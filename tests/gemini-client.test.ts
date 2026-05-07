import { describe, expect, it } from 'vitest';

import { CONFIG } from '../src/config/Config';
import { analyzeThreadWithGemini } from '../src/config/GeminiClient';
import { parseGeminiAnalysis } from '../src/domain/ResponseParser';

type UnknownRecord = Readonly<Record<string, unknown>>;

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

describe('analyzeThreadWithGemini', () => {
  it('keeps mock mode enabled by default', () => {
    expect(CONFIG.USE_MOCK_GEMINI).toBe(true);
  });

  it('returns stable mock JSON without using the prompt content', () => {
    const sensitivePrompt = 'private email content must not be echoed';

    expect(analyzeThreadWithGemini('first prompt')).toBe(analyzeThreadWithGemini('second prompt'));
    expect(analyzeThreadWithGemini(sensitivePrompt)).not.toContain(sensitivePrompt);
  });

  it('returns expected external snake_case schema keys', () => {
    const mockResponse = parseJsonObject(analyzeThreadWithGemini('prompt must not be logged'));

    expect(Object.keys(mockResponse).sort()).toEqual([
      'explicit_action_items',
      'follow_up_recommendation',
      'overall_confidence',
      'risks_and_ambiguities',
      'suggested_calendar_event',
      'suggested_label',
      'suggested_reply_points',
      'summary',
      'things_to_consider',
    ]);
    expect(mockResponse).not.toHaveProperty('explicitActionItems');
    expect(mockResponse).not.toHaveProperty('followUpRecommendation');
  });

  it('uses snake_case nested field names in mock analysis sections', () => {
    const mockResponse = parseJsonObject(analyzeThreadWithGemini('prompt'));
    const explicitActionItems = expectArray(mockResponse.explicit_action_items);
    const firstActionItem = expectRecord(explicitActionItems[0]);
    const followUpRecommendation = expectRecord(mockResponse.follow_up_recommendation);

    expect(firstActionItem).toHaveProperty('source_message_ids');
    expect(followUpRecommendation).toHaveProperty('should_follow_up');
  });

  it('returns mock response that ResponseParser can parse safely', () => {
    const analysis = parseGeminiAnalysis(analyzeThreadWithGemini('prompt'));

    expect(analysis.summary).toBe(
      'ThreadBrief mock analysis response. No Gemini API call was made.'
    );
    expect(analysis.explicitActionItems[0]?.description).toBe(
      'Review the thread and decide whether a real Gemini call should be enabled.'
    );
    expect(analysis.followUpRecommendation.shouldFollowUp).toBe(false);
    expect(analysis.suggestedLabel?.name).toBe('ThreadBrief Mock');
    expect(analysis.risksAndAmbiguities).toEqual([
      'This is a deterministic mock response and not an interpretation of real email content.',
    ]);
  });
});
