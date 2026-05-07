import {
  buildHomeCard,
  buildGmailSummaryEntryCard,
  buildThreadAnalysisDisplayCard,
  buildThreadSummaryErrorCard,
} from './domain/Cards';
import { buildCleanThreadText } from './domain/ThreadCleaner';
import { getCurrentThreadData } from './domain/GmailReader';
import { buildEmailAnalysisPrompt } from './domain/PromptBuilder';
import { parseGeminiAnalysis } from './domain/ResponseParser';
import { analyzeThreadWithGemini } from './config/GeminiClient';
import type { AddonEvent, CleanThreadText, EmailAnalysis } from './types/types';

const fallbackThreadSummaryErrorMessage = 'Thread summary could not be generated.';
const safeThreadSummaryErrorMessages = new Set<string>([
  'This add-on needs an opened Gmail thread before it can summarize.',
  'The opened Gmail thread has no messages to read.',
]);

type ThreadSummaryResult = Readonly<{
  cleanThread: CleanThreadText;
  emailAnalysis: EmailAnalysis;
}>;

const getSafeErrorMessage = (error: unknown): string =>
  error instanceof Error && safeThreadSummaryErrorMessages.has(error.message)
    ? error.message
    : fallbackThreadSummaryErrorMessage;

const summarizeCurrentThread = (event: AddonEvent): ThreadSummaryResult => {
  const threadData = getCurrentThreadData(event);
  const cleanThread = buildCleanThreadText(threadData);
  const prompt = buildEmailAnalysisPrompt(cleanThread);
  const rawAnalysis = analyzeThreadWithGemini(prompt);
  const emailAnalysis = parseGeminiAnalysis(rawAnalysis);

  return {
    cleanThread,
    emailAnalysis,
  };
};

export const buildHomePage = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildHomeCard();

export const buildGmailContextualCard = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildGmailSummaryEntryCard();

export const buildThreadSummaryCard = (event: AddonEvent): GoogleAppsScript.Card_Service.Card => {
  try {
    const threadSummary = summarizeCurrentThread(event);

    return buildThreadAnalysisDisplayCard(threadSummary.emailAnalysis, threadSummary.cleanThread);
  } catch (error: unknown) {
    return buildThreadSummaryErrorCard(getSafeErrorMessage(error));
  }
};

Object.assign(globalThis, {
  buildGmailContextualCard,
  buildHomePage,
  buildThreadSummaryCard,
});
