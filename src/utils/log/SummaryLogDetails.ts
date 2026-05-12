import { CONFIG } from '../../config/Config';
import { analysisFieldNames, type AnalysisFieldName } from '../../domain/AnalysisSchema';
import { stripMarkdownCodeFences } from '../../domain/ResponseParser';
import type { CleanThreadText, EmailAnalysis, ThreadData } from '../../types/types';
import { isRecord, type UnknownRecord } from '../TypeGuards';
import type {
  CleanThreadLogDetails,
  DraftReplyLogDetails,
  EmailAnalysisLogDetails,
  GeminiAnalysisParseLogDetails,
  GeminiRequestLogDetails,
  GeminiResponseLogDetails,
  SummaryPipelineLogDetails,
  ThreadReadLogDetails,
} from './SummaryLogTypes';

const schemaLogFieldNames = (Object.keys(analysisFieldNames) as AnalysisFieldName[]).flatMap(
  (fieldName) => [analysisFieldNames[fieldName].external, analysisFieldNames[fieldName].internal]
);

const safeLogFieldNames = new Set<string>([
  ...schemaLogFieldNames,
  'confidence',
  'cautions',
  'description',
  'evidence',
  'location',
  'name',
  'owner',
  'reason',
  'summary',
  'title',
]);

const getSanitizedTopLevelFields = (record: UnknownRecord): readonly string[] =>
  Object.keys(record)
    .filter((fieldName) => safeLogFieldNames.has(fieldName))
    .sort();

export const buildSummaryPipelineLogDetails = (): SummaryPipelineLogDetails => ({
  geminiMode: CONFIG.USE_MOCK_GEMINI ? 'mock' : 'real',
  maximumMessageCount: CONFIG.MAX_MESSAGES,
  maximumThreadCharacterCount: CONFIG.MAX_THREAD_CHARS,
});

export const buildThreadReadLogDetails = (threadData: ThreadData): ThreadReadLogDetails => ({
  latestBodyPreviewCharacterCount: threadData.latestBodyPreview.length,
  messageCount: threadData.messageCount,
});

export const buildCleanThreadLogDetails = (
  cleanThread: CleanThreadText
): CleanThreadLogDetails => ({
  includedMessageCount: cleanThread.includedMessageCount,
  originalMessageCount: cleanThread.originalMessageCount,
  textCharacterCount: cleanThread.text.length,
  wasTruncated: cleanThread.wasTruncated,
});

export const buildEmailAnalysisLogDetails = (analysis: EmailAnalysis): EmailAnalysisLogDetails => ({
  explicitActionItemCount: analysis.explicitActionItems.length,
  hasSuggestedLabel: analysis.suggestedLabel !== undefined,
  overallConfidence: analysis.overallConfidence,
  riskOrAmbiguityCount: analysis.risksAndAmbiguities.length,
  shouldFollowUp: analysis.followUpRecommendation.shouldFollowUp,
  socialToneConfidence: analysis.socialTone.confidence,
  socialToneUrgencyOrPressure: analysis.socialTone.urgencyOrPressure,
  suggestedReplyPointCount: analysis.suggestedReplyPoints.length,
  thingToConsiderCount: analysis.thingsToConsider.length,
});

export const buildGeminiRequestLogDetails = (prompt: string): GeminiRequestLogDetails => ({
  maxOutputTokens: CONFIG.GEMINI_MAX_OUTPUT_TOKENS,
  model: CONFIG.GEMINI_MODEL,
  promptCharacterCount: prompt.length,
  temperature: CONFIG.GEMINI_TEMPERATURE,
});

export const buildGeminiResponseLogDetails = (
  responseCode: number,
  responseBody: string,
  modelText: string
): GeminiResponseLogDetails => ({
  modelTextCharacterCount: modelText.length,
  responseBodyCharacterCount: responseBody.length,
  responseCode,
});

export const buildDraftReplyLogDetails = (draftReplyBody: string): DraftReplyLogDetails => ({
  draftReplyBodyCharacterCount: draftReplyBody.length,
});

export const buildGeminiAnalysisParseLogDetails = (raw: string): GeminiAnalysisParseLogDetails => {
  const trimmedRaw = raw.trim();

  try {
    const parsedValue = JSON.parse(stripMarkdownCodeFences(raw)) as unknown;
    const parsedValueIsRecord = isRecord(parsedValue);

    return {
      isJsonObject: parsedValueIsRecord,
      rawCharacterCount: raw.length,
      sanitizedTopLevelFields: parsedValueIsRecord ? getSanitizedTopLevelFields(parsedValue) : [],
      startsWithMarkdownFence: trimmedRaw.startsWith('```'),
      unsafeRaw: trimmedRaw,
      wasValidJson: true,
    };
  } catch (_error: unknown) {
    return {
      isJsonObject: false,
      rawCharacterCount: raw.length,
      sanitizedTopLevelFields: [],
      startsWithMarkdownFence: trimmedRaw.startsWith('```'),
      unsafeRaw: trimmedRaw,
      wasValidJson: false,
    };
  }
};
