import { CONFIG } from '../config/Config';
import type {
  CleanThreadText,
  CleanThreadTextOptions,
  ThreadData,
  ThreadMessage,
} from '../types/types';
import { parseDateTimeOrMinimum } from '../utils/DateUtils';
import { truncateTextWithSuffix } from '../utils/StringUtils';
import {
  collapseExcessBlankLines,
  cutAtFirstMatchingLine,
  findLastNonEmptyLineIndex,
  normalizeLineEndings,
  trimOuterBlankLines,
  trimTrailingLineWhitespace,
} from '../utils/TextUtils';

const originalMessageDivider = '-----Original Message-----';
const truncationNotice = '\n\n[Thread text truncated]';

const quotedReplyPatterns = [
  /^\s*On .+ wrote:\s*$/i,
  /^\s*-+\s*Original Message\s*-+\s*$/i,
] as const;

const mobileSignaturePatterns = [
  /^\s*Sent from my iPhone\s*$/i,
  /^\s*Sent from my iPad\s*$/i,
  /^\s*Sent from my Android\s*$/i,
  /^\s*Sent from Outlook for iOS\s*$/i,
] as const;

const isQuotedReplyMarker = (line: string): boolean =>
  quotedReplyPatterns.some((pattern) => pattern.test(line));

const isQuotedLine = (line: string): boolean => /^\s*>/.test(line);

const isSignatureDelimiter = (line: string): boolean => /^--\s*$/.test(line);

const isMobileSignature = (line: string): boolean =>
  mobileSignaturePatterns.some((pattern) => pattern.test(line));

const removeTrailingMobileSignature = (lines: readonly string[]): readonly string[] => {
  const lastNonEmptyLineIndex = findLastNonEmptyLineIndex(lines);

  if (lastNonEmptyLineIndex === -1 || !isMobileSignature(lines[lastNonEmptyLineIndex] ?? '')) {
    return lines;
  }

  return lines.slice(0, lastNonEmptyLineIndex);
};

const parseMessageTime = (message: ThreadMessage): number => {
  return parseDateTimeOrMinimum(message.dateIso);
};

const sortMessagesByOldestFirst = (messages: readonly ThreadMessage[]): readonly ThreadMessage[] =>
  [...messages].sort((leftMessage, rightMessage) => {
    const leftMessageTime = parseMessageTime(leftMessage);
    const rightMessageTime = parseMessageTime(rightMessage);

    return leftMessageTime - rightMessageTime;
  });

const takeMostRecentMessages = (
  chronologicalMessages: readonly ThreadMessage[],
  maximumMessageCount: number
): readonly ThreadMessage[] => {
  const startIndex = Math.max(0, chronologicalMessages.length - maximumMessageCount);

  return chronologicalMessages.slice(startIndex);
};

const findOpenedMessage = (
  messages: readonly ThreadMessage[],
  openedMessageId: string
): ThreadMessage | undefined => messages.find((message) => message.id === openedMessageId);

const getRecentMessagesWithOpenedMessage = (
  messages: readonly ThreadMessage[],
  openedMessageId: string,
  maximumMessageCount: number
): readonly ThreadMessage[] => {
  if (maximumMessageCount <= 0) {
    return [];
  }

  const chronologicalMessages = sortMessagesByOldestFirst(messages);
  const openedMessage = findOpenedMessage(chronologicalMessages, openedMessageId);

  if (!openedMessage) {
    return takeMostRecentMessages(chronologicalMessages, maximumMessageCount);
  }

  const maximumContextMessageCount = maximumMessageCount - 1;
  const recentContextMessages = takeMostRecentMessages(
    chronologicalMessages.filter((message) => message.id !== openedMessage.id),
    maximumContextMessageCount
  );
  const selectedMessageIds = new Set([
    openedMessage.id,
    ...recentContextMessages.map((message) => message.id),
  ]);

  return chronologicalMessages.filter((message) => selectedMessageIds.has(message.id));
};

const buildSourceMessageId = (messageIndex: number): string =>
  `message-${String(messageIndex + 1)}`;

const formatOpenedMessageMarker = (message: ThreadMessage, openedMessageId: string): string[] =>
  message.id === openedMessageId ? ['Message focus: opened email'] : [];

const formatCleanMessage = (
  openedMessageId: string,
  message: ThreadMessage,
  messageIndex: number
): string =>
  [
    `Message ID: ${buildSourceMessageId(messageIndex)}`,
    ...formatOpenedMessageMarker(message, openedMessageId),
    `From: ${message.from}`,
    `To: ${message.to}`,
    `Date: ${message.dateIso}`,
    `Subject: ${message.subject}`,
    '',
    cleanEmailBody(message.plainBody),
  ].join('\n');

const truncateToMaximumCharacterCount = (
  text: string,
  maximumCharacterCount: number
): Pick<CleanThreadText, 'text' | 'wasTruncated'> =>
  truncateTextWithSuffix(text, maximumCharacterCount, truncationNotice);

const resolveMaximumMessageCount = (options: CleanThreadTextOptions): number =>
  Math.max(0, Math.floor(options.maxMessages ?? CONFIG.MAX_MESSAGES));

const resolveMaximumCharacterCount = (options: CleanThreadTextOptions): number =>
  Math.max(0, Math.floor(options.maxChars ?? CONFIG.MAX_THREAD_CHARS));

export const stripQuotedReply = (text: string): string => {
  const normalizedText = normalizeLineEndings(text);
  const lines = normalizedText.split('\n');
  const linesBeforeQuotedReply = cutAtFirstMatchingLine(lines, isQuotedReplyMarker);

  return linesBeforeQuotedReply.filter((line) => !isQuotedLine(line)).join('\n');
};

export const stripCommonSignatures = (text: string): string => {
  const normalizedText = normalizeLineEndings(text);
  const lines = normalizedText.split('\n');
  const linesBeforeSignatureDelimiter = cutAtFirstMatchingLine(lines, isSignatureDelimiter);

  return removeTrailingMobileSignature(linesBeforeSignatureDelimiter).join('\n');
};

export const cleanEmailBody = (text: string): string =>
  trimOuterBlankLines(
    collapseExcessBlankLines(
      trimTrailingLineWhitespace(
        stripCommonSignatures(stripQuotedReply(normalizeLineEndings(text)))
      )
    )
  );

export const buildCleanThreadText = (
  threadData: ThreadData,
  options: CleanThreadTextOptions = {}
): CleanThreadText => {
  const includedMessages = getRecentMessagesWithOpenedMessage(
    threadData.messages,
    threadData.openedMessageId,
    resolveMaximumMessageCount(options)
  );
  const cleanThreadText = includedMessages
    .map((message, messageIndex) =>
      formatCleanMessage(threadData.openedMessageId, message, messageIndex)
    )
    .join(`\n\n${originalMessageDivider}\n\n`);
  const truncatedThreadText = truncateToMaximumCharacterCount(
    cleanThreadText,
    resolveMaximumCharacterCount(options)
  );

  return {
    includedMessageCount: includedMessages.length,
    originalMessageCount: threadData.messages.length,
    text: truncatedThreadText.text,
    wasTruncated: truncatedThreadText.wasTruncated,
  };
};
