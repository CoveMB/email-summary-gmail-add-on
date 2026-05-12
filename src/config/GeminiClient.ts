import { analysisFieldNames } from '../domain/AnalysisSchema';
import { getEnvironmentVariableCastedOr } from '../utils/Env';
import { isRecord, type UnknownRecord } from '../utils/TypeGuards';
import {
  buildGeminiRequestLogDetails,
  buildGeminiResponseLogDetails,
  writeSummaryLogEvent,
} from '../utils/log/SummaryLog';
import { CONFIG, GEMINI_API_KEY_PROPERTY_NAME } from './Config';

const geminiGenerateContentEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(CONFIG.GEMINI_MODEL)}:generateContent`;
const missingGeminiApiKeyMessage = 'Gemini API key is missing.';
const geminiRequestFailedMessage = 'Gemini API request failed.';

export type GeminiClientErrorKind = 'missing_key' | 'request_failed';

export class GeminiClientError extends Error {
  public constructor(public readonly kind: GeminiClientErrorKind) {
    super(kind === 'missing_key' ? missingGeminiApiKeyMessage : geminiRequestFailedMessage);
    this.name = 'GeminiClientError';
  }
}

const mockGeminiAnalysisResponse = {
  [analysisFieldNames.explicitActionItems.external]: [
    {
      confidence: 'high',
      description: 'Review the thread and decide whether a real Gemini call should be enabled.',
      owner: 'sender',
      [analysisFieldNames.sourceMessageIds.external]: ['message-1'],
    },
  ],
  [analysisFieldNames.followUpRecommendation.external]: {
    confidence: 'medium',
    reason: 'Mock mode keeps development safe until API access and data handling are reviewed.',
    [analysisFieldNames.shouldFollowUp.external]: false,
  },
  [analysisFieldNames.overallConfidence.external]: 'medium',
  [analysisFieldNames.risksAndAmbiguities.external]: [
    'This is a deterministic mock response and not an interpretation of real email content.',
  ],
  [analysisFieldNames.suggestedLabel.external]: {
    confidence: 'medium',
    name: 'EmailSummary Mock',
    reason: 'Response was generated locally in mock mode.',
  },
  [analysisFieldNames.suggestedReplyPoints.external]: [
    'Confirm Gemini integration remains disabled until credentials and scopes are configured.',
  ],
  [analysisFieldNames.socialTone.external]: {
    [analysisFieldNames.socialToneApparentTone.external]: ['neutral', 'practical', 'low-pressure'],
    cautions: [
      'Tone is inferred from text only.',
      "The sender's actual emotional state cannot be determined from the email alone.",
    ],
    confidence: 'medium',
    evidence:
      'The mock response uses setup-focused wording and does not include personal or emotional content.',
    [analysisFieldNames.socialTonePossibleSenderState.external]:
      'The message may come across as a routine setup reminder, but this is mock data.',
    [analysisFieldNames.socialToneRelationalStance.external]: 'neutral and task-oriented',
    [analysisFieldNames.socialToneSocialSignals.external]: [
      'Possible signal: the wording is direct but not demanding.',
    ],
    summary: 'The mock message may come across as neutral, practical, and low-pressure.',
    [analysisFieldNames.socialToneUrgencyOrPressure.external]: 'low',
  },
  summary: 'EmailSummary mock analysis response. No Gemini API call was made.',
  [analysisFieldNames.thingsToConsider.external]: [
    {
      confidence: 'medium',
      description:
        'Mock output proves the pipeline shape without reading secrets or sending network requests.',
      [analysisFieldNames.sourceMessageIds.external]: ['message-1'],
    },
  ],
} as const;

const buildGeminiClientError = (kind: GeminiClientErrorKind, cause: unknown): GeminiClientError =>
  Object.assign(new GeminiClientError(kind), { cause });

const readGeminiApiKey = (): string =>
  getEnvironmentVariableCastedOr(GEMINI_API_KEY_PROPERTY_NAME, 'string', '');

export const getGeminiApiKeyStatus = (): 'configured' | 'missing' => {
  const apiKey = readGeminiApiKey();

  return apiKey.length > 0 ? 'configured' : 'missing';
};

const getRequiredGeminiApiKey = (): string => {
  const apiKey = readGeminiApiKey();

  if (apiKey.length === 0) {
    throw new GeminiClientError('missing_key');
  }

  return apiKey;
};

const buildGeminiRequestPayload = (prompt: string): string =>
  JSON.stringify({
    contents: [
      {
        parts: [{ text: prompt }],
        role: 'user',
      },
    ],
    generationConfig: {
      maxOutputTokens: CONFIG.GEMINI_MAX_OUTPUT_TOKENS,
      responseMimeType: 'application/json',
      temperature: CONFIG.GEMINI_TEMPERATURE,
    },
  });

const fetchGeminiGenerateContent = (
  apiKey: string,
  prompt: string
): GoogleAppsScript.URL_Fetch.HTTPResponse => {
  writeSummaryLogEvent('gemini_request_started', buildGeminiRequestLogDetails(prompt));

  try {
    return UrlFetchApp.fetch(geminiGenerateContentEndpoint, {
      contentType: 'application/json',
      headers: {
        'x-goog-api-key': apiKey,
      },
      method: 'post',
      muteHttpExceptions: true,
      payload: buildGeminiRequestPayload(prompt),
    });
  } catch (error: unknown) {
    writeSummaryLogEvent('gemini_request_exception', { errorKind: 'fetch_exception' });
    throw buildGeminiClientError('request_failed', error);
  }
};

const parseJsonObject = (rawJson: string): UnknownRecord => {
  try {
    const parsedValue = JSON.parse(rawJson) as unknown;

    if (isRecord(parsedValue)) {
      return parsedValue;
    }
  } catch (_error: unknown) {
    // Fall through to the fixed safe error below.
  }

  throw new GeminiClientError('request_failed');
};

const readRecordArray = (record: UnknownRecord, fieldName: string): readonly UnknownRecord[] => {
  const value = record[fieldName];

  return Array.isArray(value) ? value.filter(isRecord) : [];
};

const readNestedRecord = (record: UnknownRecord, fieldName: string): UnknownRecord | undefined => {
  const value = record[fieldName];

  return isRecord(value) ? value : undefined;
};

const extractGeminiModelText = (responseBody: string): string => {
  const responseRecord = parseJsonObject(responseBody);
  const [firstCandidate] = readRecordArray(responseRecord, 'candidates');
  const content = firstCandidate ? readNestedRecord(firstCandidate, 'content') : undefined;
  const [firstPart] = content ? readRecordArray(content, 'parts') : [];
  const text = firstPart?.text;

  if (typeof text === 'string' && text.trim().length > 0) {
    return text;
  }

  throw new GeminiClientError('request_failed');
};

const analyzeThreadWithRealGemini = (prompt: string): string => {
  const apiKey = getRequiredGeminiApiKey();
  const response = fetchGeminiGenerateContent(apiKey, prompt);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode < 200 || responseCode >= 300) {
    writeSummaryLogEvent('gemini_request_failed', { responseCode });
    throw new GeminiClientError('request_failed');
  }

  let modelText: string;

  try {
    modelText = extractGeminiModelText(responseBody);
  } catch (error: unknown) {
    writeSummaryLogEvent('gemini_response_unusable', {
      responseBodyCharacterCount: responseBody.length,
      responseCode,
    });

    throw error;
  }

  writeSummaryLogEvent(
    'gemini_response_received',
    buildGeminiResponseLogDetails(responseCode, responseBody, modelText)
  );

  return modelText;
};

export const analyzeThreadWithGemini = (prompt: string): string => {
  if (!CONFIG.USE_MOCK_GEMINI) {
    return analyzeThreadWithRealGemini(prompt);
  }

  writeSummaryLogEvent('gemini_mock_response_used', buildGeminiRequestLogDetails(prompt));

  return JSON.stringify(mockGeminiAnalysisResponse);
};
