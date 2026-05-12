import { describe, expect, it } from 'vitest';

import {
  createEmptyEmailAnalysis,
  createParseFailureEmailAnalysis,
  normalizeConfidence,
  parseGeminiAnalysis,
  safeText,
  stripMarkdownCodeFences,
} from '../src/domain/ResponseParser';
import {
  defaultSocialToneCaution,
  defaultSocialToneSummary,
} from '../src/domain/SocialToneDefaults';

const expectedDefaultSocialToneAnalysis = {
  apparentTone: [],
  cautions: [defaultSocialToneCaution],
  confidence: 'low',
  evidence: '',
  possibleSenderState: null,
  relationalStance: null,
  socialSignals: [],
  summary: defaultSocialToneSummary,
  urgencyOrPressure: 'unclear',
} as const;

describe('normalizeConfidence', () => {
  it('accepts known confidence values case-insensitively', () => {
    expect(normalizeConfidence('high')).toBe('high');
    expect(normalizeConfidence(' Medium ')).toBe('medium');
    expect(normalizeConfidence('LOW')).toBe('low');
  });

  it('falls back to low for unknown or non-string values', () => {
    expect(normalizeConfidence('certain')).toBe('low');
    expect(normalizeConfidence(null)).toBe('low');
    expect(normalizeConfidence({ confidence: 'high' })).toBe('low');
  });
});

describe('safeText', () => {
  it('trims string input and enforces maximum length', () => {
    expect(safeText('  abcdef  ', 4)).toBe('abcd');
  });

  it('returns empty text for non-string input or non-positive limits', () => {
    expect(safeText(123, 10)).toBe('');
    expect(safeText('text', 0)).toBe('');
    expect(safeText('text', -1)).toBe('');
  });
});

describe('createEmptyEmailAnalysis', () => {
  it('returns a structurally complete empty analysis', () => {
    expect(createEmptyEmailAnalysis()).toEqual({
      explicitActionItems: [],
      followUpRecommendation: {
        confidence: 'low',
        reason: '',
        shouldFollowUp: null,
      },
      overallConfidence: 'low',
      risksAndAmbiguities: [],
      suggestedReplyPoints: [],
      socialTone: expectedDefaultSocialToneAnalysis,
      summary: '',
      thingsToConsider: [],
    });
  });
});

describe('createParseFailureEmailAnalysis', () => {
  it('returns fallback analysis with a sanitized failure reason', () => {
    const analysis = createParseFailureEmailAnalysis(` ${'x'.repeat(600)} `);

    expect(analysis.summary).toBe('Analysis could not be parsed.');
    expect(analysis.overallConfidence).toBe('low');
    expect(analysis.followUpRecommendation.shouldFollowUp).toBeNull();
    expect(analysis.followUpRecommendation.reason).toHaveLength(500);
    expect(analysis.risksAndAmbiguities).toEqual([analysis.followUpRecommendation.reason]);
  });

  it('uses a default reason when sanitized reason is empty', () => {
    const analysis = createParseFailureEmailAnalysis('   ');

    expect(analysis.followUpRecommendation.reason).toBe('Parser returned fallback analysis.');
    expect(analysis.risksAndAmbiguities).toEqual(['Parser returned fallback analysis.']);
  });
});

describe('stripMarkdownCodeFences', () => {
  it('removes surrounding markdown code fences', () => {
    expect(stripMarkdownCodeFences('```json\n{"summary":"ok"}\n```')).toBe('{"summary":"ok"}');
  });

  it('keeps unfenced text unchanged except outer whitespace', () => {
    expect(stripMarkdownCodeFences('  {"summary":"ok"}  ')).toBe('{"summary":"ok"}');
  });
});

describe('parseGeminiAnalysis', () => {
  it('accepts valid JSON analysis', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicitActionItems: [
          {
            confidence: 'high',
            description: 'Send the signed agreement.',
            dueDateIso: '2026-05-08',
            owner: 'recipient',
            sourceMessageIds: ['message-123'],
          },
        ],
        followUpRecommendation: {
          confidence: 'medium',
          followUpDateIso: '2026-05-10',
          reason: 'Agreement is time sensitive.',
          shouldFollowUp: true,
        },
        overallConfidence: 'high',
        risksAndAmbiguities: ['Deadline timezone is unclear.'],
        suggestedLabel: {
          confidence: 'high',
          name: 'Contracts',
          reason: 'Thread discusses an agreement.',
        },
        suggestedReplyPoints: ['Confirm signature timing.'],
        social_tone: {
          apparent_tone: ['polite', 'time-sensitive', 'direct'],
          cautions: [
            'Tone is inferred from text only.',
            'The sender actual emotional state cannot be determined from the email alone.',
          ],
          confidence: 'medium',
          evidence: 'The sender asks whether the recipient can confirm by Friday.',
          possible_sender_state: 'The sender may be feeling time pressure, but this is uncertain.',
          relational_stance: 'collaborative but deadline-oriented',
          social_signals: [
            'The sender asks for confirmation quickly but does not use hostile wording.',
          ],
          summary: 'The email comes across as polite but somewhat urgent.',
          urgency_or_pressure: 'medium',
        },
        summary: 'Recipient needs to send a signed agreement.',
        thingsToConsider: [
          {
            confidence: 'medium',
            description: 'Legal review may still be pending.',
            sourceMessageIds: ['message-124'],
          },
        ],
      })
    );

    expect(analysis.summary).toBe('Recipient needs to send a signed agreement.');
    expect(analysis.explicitActionItems[0]).toEqual({
      confidence: 'high',
      description: 'Send the signed agreement.',
      dueDateIso: '2026-05-08',
      owner: 'recipient',
      sourceMessageIds: ['message-123'],
    });
    expect(analysis.thingsToConsider[0]?.description).toBe('Legal review may still be pending.');
    expect(analysis.suggestedReplyPoints).toEqual(['Confirm signature timing.']);
    expect(analysis.suggestedLabel?.name).toBe('Contracts');
    expect(analysis.followUpRecommendation.shouldFollowUp).toBe(true);
    expect(analysis.socialTone).toEqual({
      apparentTone: ['polite', 'time-sensitive', 'direct'],
      cautions: [
        'Tone is inferred from text only.',
        'The sender actual emotional state cannot be determined from the email alone.',
      ],
      confidence: 'medium',
      evidence: 'The sender asks whether the recipient can confirm by Friday.',
      possibleSenderState: 'The sender may be feeling time pressure, but this is uncertain.',
      relationalStance: 'collaborative but deadline-oriented',
      socialSignals: ['The sender asks for confirmation quickly but does not use hostile wording.'],
      summary: 'The email comes across as polite but somewhat urgent.',
      urgencyOrPressure: 'medium',
    });
    expect(analysis.overallConfidence).toBe('high');
  });

  it('accepts external snake_case JSON analysis', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicit_action_items: [
          {
            confidence: 'high',
            description: 'Review the mock pipeline.',
            owner: 'sender',
            source_message_ids: ['message-123'],
          },
        ],
        follow_up_recommendation: {
          confidence: 'medium',
          follow_up_date_iso: '2026-05-10',
          reason: 'Mock output requested follow-up review.',
          should_follow_up: true,
        },
        overall_confidence: 'medium',
        risks_and_ambiguities: ['Mock data is not real analysis.'],
        suggested_label: {
          confidence: 'medium',
          name: 'Mock',
          reason: 'Mock response.',
        },
        suggested_reply_points: ['Confirm mock mode is expected.'],
        summary: 'Mock summary.',
        things_to_consider: [
          {
            confidence: 'medium',
            description: 'No real Gemini call was made.',
            source_message_ids: ['message-124'],
          },
        ],
      })
    );

    expect(analysis.explicitActionItems[0]).toEqual({
      confidence: 'high',
      description: 'Review the mock pipeline.',
      owner: 'sender',
      sourceMessageIds: ['message-123'],
    });
    expect(analysis.followUpRecommendation).toEqual({
      confidence: 'medium',
      followUpDateIso: '2026-05-10',
      reason: 'Mock output requested follow-up review.',
      shouldFollowUp: true,
    });
    expect(analysis.overallConfidence).toBe('medium');
    expect(analysis.risksAndAmbiguities).toEqual(['Mock data is not real analysis.']);
    expect(analysis.suggestedLabel?.name).toBe('Mock');
    expect(analysis.suggestedReplyPoints).toEqual(['Confirm mock mode is expected.']);
    expect(analysis.thingsToConsider[0]?.sourceMessageIds).toEqual(['message-124']);
    expect(analysis.socialTone).toEqual(expectedDefaultSocialToneAnalysis);
  });

  it('accepts fenced JSON analysis', () => {
    const analysis = parseGeminiAnalysis(
      ['```json', '{"summary":"Fenced summary","overallConfidence":"medium"}', '```'].join('\n')
    );

    expect(analysis.summary).toBe('Fenced summary');
    expect(analysis.overallConfidence).toBe('medium');
  });

  it('handles malformed JSON with fallback analysis instead of throwing', () => {
    expect(() => parseGeminiAnalysis('{not valid json')).not.toThrow();

    const analysis = parseGeminiAnalysis('{not valid json');

    expect(analysis.summary).toBe('Analysis could not be parsed.');
    expect(analysis.followUpRecommendation.reason).toBe('AI response was not valid JSON.');
    expect(analysis.risksAndAmbiguities).toEqual(['AI response was not valid JSON.']);
  });

  it('fills missing arrays and required fallback objects', () => {
    const analysis = parseGeminiAnalysis('{"summary":"Only summary"}');

    expect(analysis.summary).toBe('Only summary');
    expect(analysis.explicitActionItems).toEqual([]);
    expect(analysis.thingsToConsider).toEqual([]);
    expect(analysis.suggestedReplyPoints).toEqual([]);
    expect(analysis.risksAndAmbiguities).toEqual([]);
    expect(analysis.followUpRecommendation).toEqual({
      confidence: 'low',
      reason: '',
      shouldFollowUp: null,
    });
    expect(analysis.socialTone).toEqual(expectedDefaultSocialToneAnalysis);
    expect(analysis.overallConfidence).toBe('low');
    expect(analysis.schemaVersion).toBe('email-summary-analysis-v1');
    expect(analysis.parseMetadata?.missingFields).toEqual([
      'schema_version',
      'explicit_action_items',
      'follow_up_recommendation',
      'overall_confidence',
      'risks_and_ambiguities',
      'suggested_reply_points',
      'social_tone',
      'things_to_consider',
    ]);
    expect(analysis.parseMetadata?.warnings).toContain(
      'AI response did not include the explicit action items field.'
    );
  });

  it('keeps explicit negative follow-up distinct from missing follow-up data', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        follow_up_recommendation: {
          confidence: 'medium',
          reason: 'No reply is needed because the thread is informational.',
          should_follow_up: false,
        },
      })
    );

    expect(analysis.followUpRecommendation).toEqual({
      confidence: 'medium',
      reason: 'No reply is needed because the thread is informational.',
      shouldFollowUp: false,
    });
  });

  it('keeps only supported source message IDs from the opened thread', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicit_action_items: [
          {
            confidence: 'high',
            description: 'Reply with approval.',
            owner: 'recipient',
            source_message_ids: ['message-1', 'message-2', 'external-id'],
          },
        ],
        things_to_consider: [
          {
            confidence: 'medium',
            description: 'The deadline may need confirmation.',
            source_message_ids: ['message-2'],
          },
        ],
      }),
      { allowedSourceMessageIds: ['message-1'] }
    );

    expect(analysis.explicitActionItems[0]?.sourceMessageIds).toEqual(['message-1']);
    expect(analysis.thingsToConsider[0]?.sourceMessageIds).toBeUndefined();
  });

  it('falls back when social_tone is malformed', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        social_tone: ['not an object'],
        summary: 'Malformed tone payload.',
      })
    );

    expect(analysis.socialTone).toEqual(expectedDefaultSocialToneAnalysis);
  });

  it('normalizes invalid social tone urgency to unclear', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        social_tone: {
          summary: 'Tone has some pressure.',
          urgency_or_pressure: 'extreme',
        },
      })
    );

    expect(analysis.socialTone.urgencyOrPressure).toBe('unclear');
  });

  it('normalizes invalid social tone confidence to low', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        social_tone: {
          confidence: 'certain',
          summary: 'Tone has limited evidence.',
          urgency_or_pressure: 'low',
        },
      })
    );

    expect(analysis.socialTone.confidence).toBe('low');
  });

  it('hides unsafe social tone fields without dropping safe tone details', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        social_tone: {
          apparent_tone: ['polite'],
          confidence: 'high',
          evidence: 'The sender asks for a quick reply.',
          possible_sender_state: 'The sender is anxious and manipulative.',
          summary: 'The sender is anxious and manipulative.',
          urgency_or_pressure: 'medium',
        },
      })
    );

    expect(analysis.socialTone).toEqual({
      apparentTone: ['polite'],
      cautions: [],
      confidence: 'high',
      evidence: 'The sender asks for a quick reply.',
      possibleSenderState: null,
      relationalStance: null,
      socialSignals: [],
      summary: defaultSocialToneSummary,
      urgencyOrPressure: 'medium',
    });
    expect(analysis.parseMetadata?.warnings).toContain(
      'Some communication-cue wording was hidden because it overclaimed sender state.'
    );
  });

  it('hides invalid ISO dates and reports date normalization warnings', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicit_action_items: [
          {
            confidence: 'high',
            description: 'Send the agreement.',
            due_date_iso: 'next Friday',
            owner: 'recipient',
          },
        ],
        follow_up_recommendation: {
          confidence: 'medium',
          follow_up_date_iso: '2026-02-30',
          reason: 'Follow up if no reply arrives.',
          should_follow_up: true,
        },
      })
    );

    expect(analysis.explicitActionItems[0]?.dueDateIso).toBeUndefined();
    expect(analysis.followUpRecommendation.followUpDateIso).toBeUndefined();
    expect(analysis.parseMetadata?.warnings).toEqual(
      expect.arrayContaining([
        'AI response included an invalid due date, so the date was hidden.',
        'AI response included an invalid follow-up date, so the date was hidden.',
      ])
    );
  });

  it('drops parsed objects that lack required display text', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicit_action_items: [
          {
            confidence: 'high',
            description: '  ',
            owner: 'recipient',
          },
        ],
        suggested_label: {
          confidence: 'medium',
          name: '',
          reason: 'Missing label name.',
        },
        things_to_consider: [
          {
            confidence: 'low',
            description: '',
          },
        ],
      })
    );

    expect(analysis.explicitActionItems).toEqual([]);
    expect(analysis.thingsToConsider).toEqual([]);
    expect(analysis.suggestedLabel).toBeUndefined();
  });

  it('normalizes invalid confidence values to low', () => {
    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicitActionItems: [
          {
            confidence: 'certain',
            description: 'Review draft.',
            owner: 'unknown-owner',
          },
        ],
        followUpRecommendation: {
          confidence: 'urgent',
          reason: 'Missing reply.',
          shouldFollowUp: true,
        },
        overallConfidence: 'maximum',
        suggestedLabel: {
          confidence: 'sure',
          name: 'Review',
          reason: 'Needs review.',
        },
      })
    );

    expect(analysis.overallConfidence).toBe('low');
    expect(analysis.explicitActionItems[0]?.confidence).toBe('low');
    expect(analysis.explicitActionItems[0]?.owner).toBe('unclear');
    expect(analysis.followUpRecommendation.confidence).toBe('low');
    expect(analysis.suggestedLabel?.confidence).toBe('low');
  });

  it('limits long text fields', () => {
    const longText = 'x'.repeat(1200);
    const longLabelName = 'l'.repeat(120);

    const analysis = parseGeminiAnalysis(
      JSON.stringify({
        explicitActionItems: [
          {
            confidence: 'high',
            description: longText,
            owner: 'sender',
            sourceMessageIds: [longText],
          },
        ],
        followUpRecommendation: {
          confidence: 'high',
          reason: longText,
          shouldFollowUp: true,
        },
        overallConfidence: 'high',
        risksAndAmbiguities: [longText],
        suggestedLabel: {
          confidence: 'high',
          name: longLabelName,
          reason: longText,
        },
        suggestedReplyPoints: [longText],
        social_tone: {
          apparent_tone: [longText],
          cautions: [longText],
          confidence: 'high',
          evidence: longText,
          possible_sender_state: longText,
          relational_stance: longText,
          social_signals: [longText],
          summary: longText,
          urgency_or_pressure: 'high',
        },
        summary: longText,
        thingsToConsider: [
          {
            confidence: 'high',
            description: longText,
          },
        ],
      })
    );

    expect(analysis.summary).toHaveLength(1000);
    expect(analysis.explicitActionItems[0]?.description).toHaveLength(1000);
    expect(analysis.explicitActionItems[0]?.sourceMessageIds).toBeUndefined();
    expect(analysis.followUpRecommendation.reason).toHaveLength(1000);
    expect(analysis.risksAndAmbiguities[0]).toHaveLength(1000);
    expect(analysis.suggestedLabel?.name).toHaveLength(80);
    expect(analysis.suggestedLabel?.reason).toHaveLength(1000);
    expect(analysis.suggestedReplyPoints[0]).toHaveLength(1000);
    expect(analysis.socialTone.summary).toHaveLength(1000);
    expect(analysis.socialTone.apparentTone[0]).toHaveLength(1000);
    expect(analysis.socialTone.socialSignals[0]).toHaveLength(1000);
    expect(analysis.socialTone.possibleSenderState).toHaveLength(1000);
    expect(analysis.socialTone.relationalStance).toHaveLength(1000);
    expect(analysis.socialTone.evidence).toHaveLength(1000);
    expect(analysis.socialTone.cautions[0]).toHaveLength(1000);
    expect(analysis.thingsToConsider[0]?.description).toHaveLength(1000);
  });
});
