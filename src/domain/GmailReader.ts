import type { AddonEvent, ThreadData, ThreadMessage } from '../types/types';
import { parseDateTimeOrMinimum } from '../utils/DateUtils';
import { isNonEmptyString, truncateTextWithSuffix } from '../utils/StringUtils';

const missingGmailContextMessage =
  'This add-on needs an opened Gmail thread before it can summarize.';

const emptyThreadMessage = 'The opened Gmail thread has no messages to read.';
const bodyPreviewMaximumCharacterCount = 300;

type CurrentGmailContext = Readonly<{
  accessToken: string;
  messageId: string;
}>;

const getCurrentGmailContext = (event: AddonEvent): CurrentGmailContext => {
  const gmailPayload = event.gmail;
  const accessToken = gmailPayload?.accessToken;
  const messageId = gmailPayload?.messageId;

  if (!isNonEmptyString(accessToken) || !isNonEmptyString(messageId)) {
    throw new Error(missingGmailContextMessage);
  }

  return {
    accessToken,
    messageId,
  };
};

const getLatestThreadMessage = (messages: readonly ThreadMessage[]): ThreadMessage => {
  const [firstMessage, ...remainingMessages] = messages;

  if (!firstMessage) {
    throw new Error(emptyThreadMessage);
  }

  return remainingMessages.reduce(
    (latestMessage, currentMessage) =>
      parseDateTimeOrMinimum(currentMessage.dateIso) > parseDateTimeOrMinimum(latestMessage.dateIso)
        ? currentMessage
        : latestMessage,
    firstMessage
  );
};

const buildThreadMessage = (message: GoogleAppsScript.Gmail.GmailMessage): ThreadMessage => ({
  dateIso: message.getDate().toISOString(),
  from: message.getFrom(),
  plainBody: message.getPlainBody(),
  subject: message.getSubject(),
  to: message.getTo(),
});

export const truncateForPreview = (text: string, maxChars: number): string =>
  truncateTextWithSuffix(text, maxChars, '...').text;

export const getCurrentThreadData = (event: AddonEvent): ThreadData => {
  const gmailContext = getCurrentGmailContext(event);

  GmailApp.setCurrentMessageAccessToken(gmailContext.accessToken);

  const openedMessage = GmailApp.getMessageById(gmailContext.messageId);
  const openedThread = openedMessage.getThread();
  const messages = openedThread.getMessages().map(buildThreadMessage);
  const latestMessage = getLatestThreadMessage(messages);

  return {
    latestBodyPreview: truncateForPreview(
      latestMessage.plainBody,
      bodyPreviewMaximumCharacterCount
    ),
    latestDateIso: latestMessage.dateIso,
    latestSender: latestMessage.from,
    messages,
    messageCount: messages.length,
    openedMessageId: gmailContext.messageId,
    subject: openedMessage.getSubject(),
    threadId: openedThread.getId(),
  };
};
