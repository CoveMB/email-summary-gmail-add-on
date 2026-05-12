import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildCleanThreadLogDetails,
  buildDraftReplyLogDetails,
  buildEmailAnalysisLogDetails,
  buildGeminiAnalysisParseLogDetails,
  buildGeminiRequestLogDetails,
  buildGeminiResponseLogDetails,
  buildThreadReadLogDetails,
  writeSummaryLogEvent,
} from '../src/utils/log/SummaryLog';
import type { CleanThreadText, EmailAnalysis, ThreadData } from '../src/types/types';
import { importWithScriptProperties } from './helpers/module-test-helpers';
import {
  expectSerializedValueToExclude,
  readFirstWarnLogPayload,
} from './helpers/log-test-helpers';
import { uninstallScriptPropertiesMock } from './helpers/script-properties-test-helpers';

afterEach(() => {
  uninstallScriptPropertiesMock();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('buildGeminiAnalysisParseLogDetails', () => {
  it('reports structural parser details and keeps unsafe raw separate', () => {
    const rawAnalysis = JSON.stringify({
      privateProviderField: 'raw private generated text',
      summary: 'Generated summary text must not be logged.',
      suggestedReplyPoints: ['Private reply point must not be logged.'],
    });
    const logDetails = buildGeminiAnalysisParseLogDetails(rawAnalysis);

    expect(logDetails.isJsonObject).toBe(true);
    expect(logDetails.rawCharacterCount).toBeGreaterThan(0);
    expect(logDetails.sanitizedTopLevelFields).toEqual(['suggestedReplyPoints', 'summary']);
    expect(logDetails.startsWithMarkdownFence).toBe(false);
    expect(logDetails.wasValidJson).toBe(true);
    expect(logDetails.unsafeRaw).toBe(rawAnalysis);
  });

  it('reports invalid JSON and keeps unsafe raw separate', () => {
    const rawAnalysis = '```json\nnot valid private output\n```';
    const logDetails = buildGeminiAnalysisParseLogDetails(rawAnalysis);

    expect(logDetails.isJsonObject).toBe(false);
    expect(logDetails.rawCharacterCount).toBeGreaterThan(0);
    expect(logDetails.sanitizedTopLevelFields).toEqual([]);
    expect(logDetails.startsWithMarkdownFence).toBe(true);
    expect(logDetails.wasValidJson).toBe(false);
    expect(logDetails.unsafeRaw).toBe(rawAnalysis);
  });
});

describe('safe summary log detail builders', () => {
  it('reports thread and clean-text counts without exposing private thread fields', () => {
    const threadData: ThreadData = {
      latestBodyPreview: 'Private preview must not be logged.',
      latestDateIso: '2026-05-11T12:00:00.000Z',
      latestSender: 'private-sender@example.com',
      messages: [],
      messageCount: 4,
      openedMessageId: 'private-message-id',
      subject: 'Private subject',
      threadId: 'private-thread-id',
    };
    const cleanThread: CleanThreadText = {
      includedMessageCount: 3,
      originalMessageCount: 4,
      text: 'Private clean thread text must not be logged.',
      wasTruncated: true,
    };

    const threadReadLogDetails = buildThreadReadLogDetails(threadData);
    const cleanThreadLogDetails = buildCleanThreadLogDetails(cleanThread);
    const serializedLogDetails = JSON.stringify({
      cleanThreadLogDetails,
      threadReadLogDetails,
    });

    expect(threadReadLogDetails).toEqual({
      latestBodyPreviewCharacterCount: 35,
      messageCount: 4,
    });
    expect(cleanThreadLogDetails).toEqual({
      includedMessageCount: 3,
      originalMessageCount: 4,
      textCharacterCount: 45,
      wasTruncated: true,
    });
    expectSerializedValueToExclude(serializedLogDetails, [
      'Private preview',
      'private-sender',
      'Private subject',
      'private-message-id',
      'private-thread-id',
      'Private clean thread text',
    ]);
  });

  it('reports analysis counts without exposing generated analysis text', () => {
    const analysis: EmailAnalysis = {
      explicitActionItems: [
        {
          confidence: 'high',
          description: 'Private action text must not be logged.',
          owner: 'recipient',
        },
      ],
      followUpRecommendation: {
        confidence: 'medium',
        reason: 'Private follow-up reason must not be logged.',
        shouldFollowUp: true,
      },
      overallConfidence: 'high',
      risksAndAmbiguities: ['Private risk text must not be logged.'],
      socialTone: {
        apparentTone: ['private tone'],
        cautions: ['Private caution must not be logged.'],
        confidence: 'medium',
        evidence: 'Private evidence must not be logged.',
        possibleSenderState: null,
        relationalStance: null,
        socialSignals: [],
        summary: 'Private tone summary must not be logged.',
        urgencyOrPressure: 'low',
      },
      suggestedLabel: {
        confidence: 'medium',
        name: 'Private label',
        reason: 'Private label reason must not be logged.',
      },
      suggestedReplyPoints: ['Private reply point must not be logged.'],
      summary: 'Private summary must not be logged.',
      thingsToConsider: [
        {
          confidence: 'low',
          description: 'Private consideration must not be logged.',
        },
      ],
    };

    const analysisLogDetails = buildEmailAnalysisLogDetails(analysis);
    const serializedLogDetails = JSON.stringify(analysisLogDetails);

    expect(analysisLogDetails).toEqual({
      explicitActionItemCount: 1,
      hasSuggestedLabel: true,
      overallConfidence: 'high',
      riskOrAmbiguityCount: 1,
      shouldFollowUp: true,
      socialToneConfidence: 'medium',
      socialToneUrgencyOrPressure: 'low',
      suggestedReplyPointCount: 1,
      thingToConsiderCount: 1,
    });
    expectSerializedValueToExclude(serializedLogDetails, ['Private']);
  });

  it('reports Gemini and draft sizes without exposing private text', () => {
    const requestLogDetails = buildGeminiRequestLogDetails('Private prompt must not be logged.');
    const responseLogDetails = buildGeminiResponseLogDetails(
      200,
      'Private response body must not be logged.',
      'Private model text must not be logged.'
    );
    const draftReplyLogDetails = buildDraftReplyLogDetails(
      'Private draft reply body must not be logged.'
    );
    const serializedLogDetails = JSON.stringify({
      draftReplyLogDetails,
      requestLogDetails,
      responseLogDetails,
    });

    expect(draftReplyLogDetails).toEqual({
      draftReplyBodyCharacterCount: 44,
    });
    expect(requestLogDetails.promptCharacterCount).toBe(34);
    expect(responseLogDetails).toEqual({
      modelTextCharacterCount: 38,
      responseBodyCharacterCount: 41,
      responseCode: 200,
    });
    expectSerializedValueToExclude(serializedLogDetails, [
      'Private draft reply body',
      'Private prompt',
      'Private response body',
      'Private model text',
    ]);
  });
});

describe('writeSummaryLogEvent', () => {
  it('emits sanitized log events without requiring a feature flag', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    writeSummaryLogEvent(
      'summary_parse_failure',
      buildGeminiAnalysisParseLogDetails('Private raw response must be redacted.')
    );

    expect(readFirstWarnLogPayload(warnSpy.mock.calls)).toEqual({
      app: 'EmailSummary',
      details: {
        isJsonObject: false,
        rawCharacterCount: 38,
        sanitizedTopLevelFields: [],
        startsWithMarkdownFence: false,
        unsafeRaw: '***',
        wasValidJson: false,
      },
      eventName: 'summary_parse_failure',
    });
    expectSerializedValueToExclude(JSON.stringify(warnSpy.mock.calls), ['Private raw response']);
  });

  it('emits unsafe raw parser details only when explicitly enabled', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { buildGeminiAnalysisParseLogDetails, writeSummaryLogEvent } =
      await importWithScriptProperties(
        { DEBUG_UNSAFE_RAW: 'true' },
        () => import('../src/utils/log/SummaryLog')
      );

    writeSummaryLogEvent(
      'summary_parse_failure',
      buildGeminiAnalysisParseLogDetails('Private raw response is intentionally visible.')
    );

    expect(readFirstWarnLogPayload(warnSpy.mock.calls)).toEqual({
      app: 'EmailSummary',
      details: {
        isJsonObject: false,
        rawCharacterCount: 46,
        sanitizedTopLevelFields: [],
        startsWithMarkdownFence: false,
        unsafeRaw: 'Private raw response is intentionally visible.',
        wasValidJson: false,
      },
      eventName: 'summary_parse_failure',
    });
  });
});
