import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildEmailAnalysisSchemaExample } from '../src/domain/PromptBuilder';
import { parseGeminiAnalysis } from '../src/domain/ResponseParser';
import {
  expectGeminiGenerateContentUrl,
  expectLogEvent,
  expectSerializedValueToExclude,
} from './helpers/log-test-helpers';
import {
  importWithScriptProperties,
  mockGeminiModeProperties,
  realGeminiModeProperties,
  realGeminiModeWithoutApiKeyProperties,
} from './helpers/module-test-helpers';
import { uninstallScriptPropertiesMock } from './helpers/script-properties-test-helpers';

type UnknownRecord = Readonly<Record<string, unknown>>;
type GeminiClientModule = typeof import('../src/config/GeminiClient');
type UrlFetchAppMockOptions = Readonly<{
  contentType: string;
  headers: Readonly<Record<string, string>>;
  method: string;
  muteHttpExceptions: boolean;
  payload: string;
}>;

type UrlFetchAppMockCall = Readonly<{
  options: UrlFetchAppMockOptions;
  url: string;
}>;

type GeminiClientErrorConstructor = new (...args: readonly never[]) => Error;

const parseJsonObject = (json: string): UnknownRecord => {
  const parsedJson = JSON.parse(json) as unknown;

  if (typeof parsedJson !== 'object' || parsedJson === null || Array.isArray(parsedJson)) {
    throw new Error('Expected JSON object.');
  }

  return parsedJson;
};

const expectArray = (value: unknown): readonly unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error('Expected array.');
  }

  return value;
};

const expectRecord = (value: unknown): UnknownRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected object.');
  }

  return value;
};

const installUrlFetchAppMock = (
  responseCode: number,
  responseBody: string
): Readonly<{ calls: UrlFetchAppMockCall[]; fetch: ReturnType<typeof vi.fn> }> => {
  const calls: UrlFetchAppMockCall[] = [];
  const fetch = vi.fn(
    (url: string, options: UrlFetchAppMockOptions): GoogleAppsScript.URL_Fetch.HTTPResponse => {
      calls.push({ options, url });

      return {
        getContentText: (): string => responseBody,
        getResponseCode: (): number => responseCode,
      } as GoogleAppsScript.URL_Fetch.HTTPResponse;
    }
  );

  Object.defineProperty(globalThis, 'UrlFetchApp', {
    configurable: true,
    value: { fetch },
  });

  return { calls, fetch };
};

const installThrowingUrlFetchAppMock = (error: unknown): ReturnType<typeof vi.fn> => {
  const fetch = vi.fn((): GoogleAppsScript.URL_Fetch.HTTPResponse => {
    throw error;
  });

  Object.defineProperty(globalThis, 'UrlFetchApp', {
    configurable: true,
    value: { fetch },
  });

  return fetch;
};

const buildGeminiResponseBody = (modelText: string): string =>
  JSON.stringify({
    candidates: [
      {
        content: {
          parts: [{ text: modelText }],
        },
      },
    ],
  });

const importGeminiClient = async (
  scriptProperties: Readonly<Record<string, string | null | undefined>>
): Promise<GeminiClientModule> => {
  return importWithScriptProperties(scriptProperties, () => import('../src/config/GeminiClient'));
};

const expectGeminiClientError = (
  runGeminiRequest: () => string,
  GeminiClientError: GeminiClientErrorConstructor,
  expectedMessage: string
): void => {
  let requestError: unknown;

  try {
    runGeminiRequest();
  } catch (error: unknown) {
    requestError = error;
  }

  expect(requestError).toBeInstanceOf(GeminiClientError);
  expect(requestError).toEqual(expect.objectContaining({ message: expectedMessage }));
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'UrlFetchApp');
  uninstallScriptPropertiesMock();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('CONFIG Gemini mode', () => {
  it('uses mock Gemini mode when no mock-mode script property is configured', async () => {
    const { CONFIG } = await importWithScriptProperties({}, () => import('../src/config/Config'));

    expect(CONFIG.USE_MOCK_GEMINI).toBe(true);
  });

  it('uses real Gemini mode when the script property disables mock mode', async () => {
    const { CONFIG } = await importWithScriptProperties(
      realGeminiModeProperties,
      () => import('../src/config/Config')
    );

    expect(CONFIG.USE_MOCK_GEMINI).toBe(false);
  });
});

describe('analyzeThreadWithGemini mock mode', () => {
  it('returns stable mock JSON without using the prompt content', async () => {
    const { analyzeThreadWithGemini } = await importGeminiClient(mockGeminiModeProperties);
    const sensitivePrompt = 'private email content must not be echoed';

    expect(analyzeThreadWithGemini('first prompt')).toBe(analyzeThreadWithGemini('second prompt'));
    expect(analyzeThreadWithGemini(sensitivePrompt)).not.toContain(sensitivePrompt);
  });

  it('returns expected external snake_case schema keys', async () => {
    const { analyzeThreadWithGemini } = await importGeminiClient(mockGeminiModeProperties);
    const mockResponse = parseJsonObject(analyzeThreadWithGemini('prompt must not be logged'));
    const schemaExample = buildEmailAnalysisSchemaExample();

    expect(Object.keys(mockResponse).sort()).toEqual(Object.keys(schemaExample).sort());
    expect(mockResponse).not.toHaveProperty('explicitActionItems');
    expect(mockResponse).not.toHaveProperty('followUpRecommendation');
  });

  it('uses snake_case nested field names in mock analysis sections', async () => {
    const { analyzeThreadWithGemini } = await importGeminiClient(mockGeminiModeProperties);
    const mockResponse = parseJsonObject(analyzeThreadWithGemini('prompt'));
    const explicitActionItems = expectArray(mockResponse.explicit_action_items);
    const firstActionItem = expectRecord(explicitActionItems[0]);
    const followUpRecommendation = expectRecord(mockResponse.follow_up_recommendation);
    const socialTone = expectRecord(mockResponse.social_tone);

    expect(firstActionItem).toHaveProperty('source_message_ids');
    expect(followUpRecommendation).toHaveProperty('should_follow_up');
    expect(socialTone).toHaveProperty('apparent_tone');
    expect(socialTone).toHaveProperty('social_signals');
    expect(socialTone).toHaveProperty('possible_sender_state');
    expect(socialTone).toHaveProperty('urgency_or_pressure');
  });

  it('returns mock response that ResponseParser can parse safely', async () => {
    const { analyzeThreadWithGemini } = await importGeminiClient(mockGeminiModeProperties);
    const analysis = parseGeminiAnalysis(analyzeThreadWithGemini('prompt'));

    expect(analysis.summary).toBe(
      'EmailSummary mock analysis response. No Gemini API call was made.'
    );
    expect(analysis.explicitActionItems[0]?.description).toBe(
      'Review the thread and decide whether a real Gemini call should be enabled.'
    );
    expect(analysis.followUpRecommendation.shouldFollowUp).toBe(false);
    expect(analysis.suggestedLabel?.name).toBe('EmailSummary Mock');
    expect(analysis.socialTone.summary).toBe(
      'The mock message may come across as neutral, practical, and low-pressure.'
    );
    expect(analysis.socialTone.urgencyOrPressure).toBe('low');
    expect(analysis.risksAndAmbiguities).toEqual([
      'This is a deterministic mock response and not an interpretation of real email content.',
    ]);
  });
});

describe('analyzeThreadWithGemini real mode', () => {
  it('reports missing API key status without exposing raw env errors', async () => {
    const { getGeminiApiKeyStatus } = await importGeminiClient(
      realGeminiModeWithoutApiKeyProperties
    );

    expect(getGeminiApiKeyStatus()).toBe('missing');
  });

  it('throws a typed missing-key error before making a network request', async () => {
    const { analyzeThreadWithGemini, GeminiClientError } = await importGeminiClient(
      realGeminiModeWithoutApiKeyProperties
    );
    const { fetch } = installUrlFetchAppMock(200, buildGeminiResponseBody('{"summary":"ok"}'));

    expectGeminiClientError(
      () => analyzeThreadWithGemini('prompt'),
      GeminiClientError,
      'Gemini API key is missing.'
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sends a bounded JSON request and extracts model text from a successful response', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const modelText = '{"summary":"Private model text must not be logged."}';
    const { calls, fetch } = installUrlFetchAppMock(200, buildGeminiResponseBody(modelText));
    const { analyzeThreadWithGemini } = await importGeminiClient(realGeminiModeProperties);

    expect(analyzeThreadWithGemini('Private prompt must not be logged.')).toBe(modelText);
    expect(fetch).toHaveBeenCalledOnce();
    expectGeminiGenerateContentUrl(calls[0]?.url);
    expect(calls[0]?.options).toMatchObject({
      contentType: 'application/json',
      headers: {
        'x-goog-api-key': 'test-api-key',
      },
      method: 'post',
      muteHttpExceptions: true,
    });
    expect(calls[0]?.options.payload).toContain('Private prompt must not be logged.');
    expectLogEvent(warnSpy, 'gemini_request_started');
    expectLogEvent(warnSpy, 'gemini_response_received');

    const serializedLogCalls = JSON.stringify(warnSpy.mock.calls);

    expectSerializedValueToExclude(serializedLogCalls, [
      'test-api-key',
      'Private prompt',
      'Private model text',
    ]);
  });

  it('throws a typed request error when Gemini returns a non-success status', async () => {
    installUrlFetchAppMock(500, buildGeminiResponseBody('{"summary":"unusable"}'));
    const { analyzeThreadWithGemini, GeminiClientError } =
      await importGeminiClient(realGeminiModeProperties);

    expectGeminiClientError(
      () => analyzeThreadWithGemini('prompt'),
      GeminiClientError,
      'Gemini API request failed.'
    );
  });

  it('logs fetch exceptions without exposing raw exception details', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetch = installThrowingUrlFetchAppMock(
      new Error('private raw network failure must not be logged')
    );
    const { analyzeThreadWithGemini, GeminiClientError } =
      await importGeminiClient(realGeminiModeProperties);

    expectGeminiClientError(
      () => analyzeThreadWithGemini('Private prompt must not be logged.'),
      GeminiClientError,
      'Gemini API request failed.'
    );

    expect(fetch).toHaveBeenCalledOnce();
    expectLogEvent(warnSpy, 'gemini_request_exception');
    expectSerializedValueToExclude(JSON.stringify(warnSpy.mock.calls), [
      'private raw network failure',
      'Private prompt',
    ]);
  });

  it('throws a typed request error for malformed Gemini response bodies', async () => {
    installUrlFetchAppMock(200, JSON.stringify({ candidates: [{ content: { parts: [] } }] }));
    const { analyzeThreadWithGemini, GeminiClientError } =
      await importGeminiClient(realGeminiModeProperties);

    expectGeminiClientError(
      () => analyzeThreadWithGemini('prompt'),
      GeminiClientError,
      'Gemini API request failed.'
    );
  });
});
