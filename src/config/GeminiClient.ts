import { analysisFieldNames } from '../domain/AnalysisSchema';
import { getEnvironmentVariable } from '../utils/Env';
import { CONFIG, GEMINI_API_KEY_PROPERTY_NAME } from './Config';

const geminiGenerateContentEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(CONFIG.GEMINI_MODEL)}:generateContent`;
const missingGeminiApiKeyMessage = 'Gemini API key is missing.';
const geminiRequestFailedMessage = 'Gemini API request failed.';
const geminiInvalidResponseMessage = 'Gemini API response could not be read.';

type UnknownRecord = Readonly<Record<string, unknown>>;
type ErrorWithCause = Error & Readonly<{ cause: unknown }>;

const mockGeminiAnalysisResponse = {
  [analysisFieldNames.explicitActionItems.external]: [
    {
      confidence: 'high',
      description: 'Review the thread and decide whether a real Gemini call should be enabled.',
      owner: 'sender',
      [analysisFieldNames.sourceMessageIds.external]: ['mock-message-1'],
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
  [analysisFieldNames.suggestedCalendarEvent.external]: {
    confidence: 'low',
    description: 'No real calendar event inferred in mock mode.',
    title: 'Review EmailSummary Gemini setup',
  },
  [analysisFieldNames.suggestedLabel.external]: {
    confidence: 'medium',
    name: 'EmailSummary Mock',
    reason: 'Response was generated locally in mock mode.',
  },
  [analysisFieldNames.suggestedReplyPoints.external]: [
    'Confirm Gemini integration remains disabled until credentials and scopes are configured.',
  ],
  summary: 'EmailSummary mock analysis response. No Gemini API call was made.',
  [analysisFieldNames.thingsToConsider.external]: [
    {
      confidence: 'medium',
      description:
        'Mock output proves the pipeline shape without reading secrets or sending network requests.',
      [analysisFieldNames.sourceMessageIds.external]: ['mock-message-1'],
    },
  ],
} as const;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const buildSafeError = (message: string, cause: unknown): ErrorWithCause =>
  Object.assign(new Error(message), { cause });

const readGeminiApiKey = (): string => getEnvironmentVariable(GEMINI_API_KEY_PROPERTY_NAME);

export const getGeminiApiKeyStatus = (): 'configured' | 'missing' => {
  const apiKey = readGeminiApiKey();

  return apiKey.length > 0 ? 'configured' : 'missing';
};

const getRequiredGeminiApiKey = (): string => {
  const apiKey = readGeminiApiKey();

  if (apiKey.length === 0) {
    throw new Error(missingGeminiApiKeyMessage);
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
    throw buildSafeError(geminiRequestFailedMessage, error);
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

  throw new Error(geminiInvalidResponseMessage);
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

  throw new Error(geminiInvalidResponseMessage);
};

const analyzeThreadWithRealGemini = (prompt: string): string => {
  const apiKey = getRequiredGeminiApiKey();
  const response = fetchGeminiGenerateContent(apiKey, prompt);
  const responseCode = response.getResponseCode();

  if (responseCode < 200 || responseCode >= 300) {
    throw new Error(geminiRequestFailedMessage);
  }

  return extractGeminiModelText(response.getContentText());
};

export const analyzeThreadWithGemini = (prompt: string): string => {
  if (!CONFIG.USE_MOCK_GEMINI) {
    return analyzeThreadWithRealGemini(prompt);
  }

  return JSON.stringify(mockGeminiAnalysisResponse);
};
