import { describe, expect, it } from 'vitest';

import { buildEmailAnalysisPrompt } from '../src/domain/PromptBuilder';
import type { CleanThreadText } from '../src/types/types';

const buildCleanThreadText = (overrides: Partial<CleanThreadText> = {}): CleanThreadText => ({
  includedMessageCount: 2,
  originalMessageCount: 3,
  text: 'From: sender@example.com\n\nPlease send the signed agreement by Friday.',
  wasTruncated: false,
  ...overrides,
});

describe('buildEmailAnalysisPrompt', () => {
  it('includes cleaned thread text and focus instructions', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain('Please send the signed agreement by Friday.');
    expect(prompt).toContain(
      'Treat the message marked "Message focus: opened email" as the primary focus.'
    );
    expect(prompt).toContain(
      'Treat the latest email and earlier emails as context when they are not the opened email.'
    );
  });

  it('distinguishes direct obligations from things to consider', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain(
      'Explicit action items must be direct asks, commitments, or obligations'
    );
    expect(prompt).toContain(
      'Things to consider are context, caveats, or interpretations, not obligations.'
    );
    expect(prompt).toContain(
      'Do not invent tasks, deadlines, owners, events, labels, source message IDs, or facts'
    );
    expect(prompt).toContain('Use only provided Message ID values in source_message_ids.');
  });

  it('requires confidence levels, evidence separation, and JSON-only output', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain('Use confidence levels exactly: high, medium, or low.');
    expect(prompt).toContain('Separate evidence from interpretation');
    expect(prompt).toContain('return JSON only');
    expect(prompt).toContain('Do not return markdown');
  });

  it('includes expected schema keys', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain('"summary"');
    expect(prompt).toContain('"explicit_action_items"');
    expect(prompt).toContain('"things_to_consider"');
    expect(prompt).toContain('"suggested_reply_points"');
    expect(prompt).toContain('"suggested_calendar_event"');
    expect(prompt).toContain('"suggested_label"');
    expect(prompt).toContain('"follow_up_recommendation"');
    expect(prompt).toContain('"social_tone"');
    expect(prompt).toContain('"apparent_tone"');
    expect(prompt).toContain('"social_signals"');
    expect(prompt).toContain('"possible_sender_state"');
    expect(prompt).toContain('"relational_stance"');
    expect(prompt).toContain('"urgency_or_pressure"');
    expect(prompt).toContain('"evidence"');
    expect(prompt).toContain('"cautions"');
    expect(prompt).toContain('"risks_and_ambiguities"');
    expect(prompt).toContain('"overall_confidence"');
    expect(prompt).not.toContain('"explicitActionItems"');
  });

  it('includes non-diagnostic social tone caution instructions', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain('Analyze the communication tone and social tone');
    expect(prompt).toContain('Identify observable emotional or interpersonal signals only.');
    expect(prompt).toContain('Do not diagnose the sender');
    expect(prompt).toContain("claim to know the sender's actual psychological state");
    expect(prompt).toContain('Distinguish observed wording from social-tone interpretation.');
    expect(prompt).toContain('Include uncertainty and alternative explanations');
    expect(prompt).toContain('If there is not enough evidence for social tone, say so.');
  });

  it('explicitly forbids clinical or mental-health labels', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain('Do not use clinical or mental-health labels');
    expect(prompt).toContain('anxious');
    expect(prompt).toContain('manipulative');
    expect(prompt).toContain('narcissistic');
    expect(prompt).toContain('depressed');
    expect(prompt).toContain('Prefer cautious wording');
    expect(prompt).toContain('may come across as');
    expect(prompt).toContain('possible signal');
  });

  it('includes message counts and non-truncated status', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain('- originalMessageCount: 3');
    expect(prompt).toContain('- includedMessageCount: 2');
    expect(prompt).toContain('- wasTruncated: false');
    expect(prompt).toContain('The cleaned thread text was not truncated.');
  });

  it('includes truncation notice when clean thread was truncated', () => {
    const prompt = buildEmailAnalysisPrompt(
      buildCleanThreadText({
        text: 'Short retained thread text.\n\n[Thread text truncated]',
        wasTruncated: true,
      })
    );

    expect(prompt).toContain('- wasTruncated: true');
    expect(prompt).toContain('The cleaned thread text was truncated before analysis.');
    expect(prompt).toContain('Mention truncation-related uncertainty in risksAndAmbiguities');
  });
});
