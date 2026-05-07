import {
  buildHomeCard,
  buildPlaceholderGmailCard,
  buildThreadAnalysisDisplayCard,
  buildThreadSummaryErrorCard,
} from './domain/Cards';
import { buildCleanThreadText } from './domain/ThreadCleaner';
import { getCurrentThreadData } from './domain/GmailReader';
import { buildEmailAnalysisPrompt } from './domain/PromptBuilder';
import { parseGeminiAnalysis } from './domain/ResponseParser';
import { analyzeThreadWithGemini } from './config/GeminiClient';
import type { AddonEvent } from './types/types';

const fallbackThreadSummaryErrorMessage = 'Thread summary could not be generated.';

const getSafeErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : fallbackThreadSummaryErrorMessage;

export const buildHomePage = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildHomeCard();

export const buildGmailContextualCard = (_event: AddonEvent): GoogleAppsScript.Card_Service.Card =>
  buildPlaceholderGmailCard();

export const buildThreadMetadataCard = (event: AddonEvent): GoogleAppsScript.Card_Service.Card => {
  try {
    const threadData = getCurrentThreadData(event);
    const cleanThread = buildCleanThreadText(threadData);
    const prompt = buildEmailAnalysisPrompt(cleanThread);
    const rawAnalysis = analyzeThreadWithGemini(prompt);
    const emailAnalysis = parseGeminiAnalysis(rawAnalysis);

    return buildThreadAnalysisDisplayCard(emailAnalysis, cleanThread);
  } catch (error: unknown) {
    return buildThreadSummaryErrorCard(getSafeErrorMessage(error));
  }
};

Object.assign(globalThis, {
  buildGmailContextualCard,
  buildHomePage,
  buildThreadMetadataCard,
});
