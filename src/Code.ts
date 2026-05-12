import { analyzeThreadWithGemini, GeminiClientError } from './config/GeminiClient';
import { buildCreateDraftReplyResponse } from './domain/Actions';
import {
  buildErrorCard,
  buildGmailSummaryEntryCard,
  buildHomeCard,
  buildThreadAnalysisDisplayCard,
} from './domain/Cards';
import { getCurrentThreadData, missingGmailContextMessage } from './domain/GmailReader';
import { buildEmailAnalysisPrompt } from './domain/PromptBuilder';
import { parseFailureSummary, parseGeminiAnalysis } from './domain/ResponseParser';
import { buildCleanThreadText } from './domain/ThreadCleaner';
import type {
  AddonEvent,
  CleanThreadText,
  EmailAnalysis,
  ThreadSummaryErrorKind,
  UserSafeThreadSummaryError,
} from './types/types';
import {
  buildCleanThreadLogDetails,
  buildEmailAnalysisLogDetails,
  buildGeminiAnalysisParseLogDetails,
  buildSummaryPipelineLogDetails,
  buildThreadReadLogDetails,
  type SummaryLogDetailsByEventName,
  type SummaryLogEventName,
  writeSummaryLogEvent,
} from './utils/log/SummaryLog';

type ThreadSummaryResult = Readonly<{
  cleanThread: CleanThreadText;
  emailAnalysis: EmailAnalysis;
}>;

export class ThreadSummaryStageError extends Error {
  public constructor(public readonly kind: ThreadSummaryErrorKind) {
    super(kind);
    this.name = 'ThreadSummaryStageError';
  }
}

const userSafeThreadSummaryErrors: Readonly<
  Record<ThreadSummaryErrorKind, UserSafeThreadSummaryError>
> = {
  gmail_read_failure: {
    kind: 'gmail_read_failure',
    message:
      'EmailSummary could not read the opened Gmail thread. Reopen the thread and try again.',
    title: 'Could not read Gmail thread',
  },
  gemini_missing_key: {
    kind: 'gemini_missing_key',
    message:
      'EmailSummary needs a configured Gemini API key before real Gemini mode can summarize.',
    title: 'Gemini API key missing',
  },
  gemini_request_failure: {
    kind: 'gemini_request_failure',
    message:
      'EmailSummary could not get a usable Gemini response. Try again later or switch back to mock mode.',
    title: 'Gemini request failed',
  },
  no_gmail_context: {
    kind: 'no_gmail_context',
    message: 'Open a Gmail thread, then run EmailSummary from that thread.',
    title: 'No Gmail thread open',
  },
  parse_failure: {
    kind: 'parse_failure',
    message: 'EmailSummary could not understand the generated summary. Try refreshing the summary.',
    title: 'Could not parse summary',
  },
  unexpected_failure: {
    kind: 'unexpected_failure',
    message: 'EmailSummary could not generate a summary. Try again in a moment.',
    title: 'Summary unavailable',
  },
} as const;

const isMissingGmailContextError = (error: unknown): boolean =>
  error instanceof Error && error.message === missingGmailContextMessage;

const getGeminiThreadSummaryErrorKind = (error: GeminiClientError): ThreadSummaryErrorKind =>
  error.kind === 'missing_key' ? 'gemini_missing_key' : 'gemini_request_failure';

const readCurrentThreadDataSafely = (event: AddonEvent) => {
  try {
    return getCurrentThreadData(event);
  } catch (error: unknown) {
    throw new ThreadSummaryStageError(
      isMissingGmailContextError(error) ? 'no_gmail_context' : 'gmail_read_failure'
    );
  }
};

const isParseFailureAnalysis = (emailAnalysis: EmailAnalysis): boolean =>
  emailAnalysis.summary === parseFailureSummary;

const logSummaryEvent = <EventName extends SummaryLogEventName>(
  eventName: EventName,
  details: SummaryLogDetailsByEventName[EventName]
): void => {
  writeSummaryLogEvent(eventName, details);
};

const buildAllowedSourceMessageIds = (cleanThread: CleanThreadText): readonly string[] =>
  Array.from(
    { length: cleanThread.includedMessageCount },
    (_unusedValue, messageIndex) => `message-${String(messageIndex + 1)}`
  );

const parseCurrentThreadEmailAnalysisSafely = (
  rawAnalysis: string,
  cleanThread: CleanThreadText
): EmailAnalysis => {
  const emailAnalysis = parseGeminiAnalysis(rawAnalysis, {
    allowedSourceMessageIds: buildAllowedSourceMessageIds(cleanThread),
  });

  if (isParseFailureAnalysis(emailAnalysis)) {
    logSummaryEvent('summary_parse_failure', buildGeminiAnalysisParseLogDetails(rawAnalysis));
    throw new ThreadSummaryStageError('parse_failure');
  }

  return emailAnalysis;
};

export const getUserSafeThreadSummaryError = (error: unknown): UserSafeThreadSummaryError =>
  error instanceof ThreadSummaryStageError
    ? userSafeThreadSummaryErrors[error.kind]
    : error instanceof GeminiClientError
      ? userSafeThreadSummaryErrors[getGeminiThreadSummaryErrorKind(error)]
      : userSafeThreadSummaryErrors.unexpected_failure;

const withUserSafeErrorCard = (
  buildCard: () => GoogleAppsScript.Card_Service.Card
): GoogleAppsScript.Card_Service.Card => {
  try {
    return buildCard();
  } catch (error: unknown) {
    const userSafeError = getUserSafeThreadSummaryError(error);
    logSummaryEvent('summary_failed', { errorKind: userSafeError.kind });

    return buildErrorCard(userSafeError.title, userSafeError.message);
  }
};

const summarizeCurrentThread = (event: AddonEvent): ThreadSummaryResult => {
  logSummaryEvent('summary_started', buildSummaryPipelineLogDetails());

  const threadData = readCurrentThreadDataSafely(event);
  logSummaryEvent('summary_thread_read_completed', buildThreadReadLogDetails(threadData));

  const cleanThread = buildCleanThreadText(threadData);
  logSummaryEvent('summary_thread_cleaned', buildCleanThreadLogDetails(cleanThread));

  const prompt = buildEmailAnalysisPrompt(cleanThread);
  const rawAnalysis = analyzeThreadWithGemini(prompt);
  const emailAnalysis = parseCurrentThreadEmailAnalysisSafely(rawAnalysis, cleanThread);
  logSummaryEvent('summary_completed', buildEmailAnalysisLogDetails(emailAnalysis));

  return {
    cleanThread,
    emailAnalysis,
  };
};

export const buildHomePage = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildHomeCard();

export const buildGmailContextualCard = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildGmailSummaryEntryCard();

export const buildThreadSummaryCard = (event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  withUserSafeErrorCard(() => {
    const threadSummary = summarizeCurrentThread(event);

    return buildThreadAnalysisDisplayCard(threadSummary.emailAnalysis, threadSummary.cleanThread);
  });

Object.assign(globalThis, {
  buildCreateDraftReplyResponse,
  buildGmailContextualCard,
  buildHomePage,
  buildThreadSummaryCard,
});
