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
    expect(prompt).toContain('Treat the latest/opened email as the primary focus.');
    expect(prompt).toContain('Treat earlier messages as context for the latest/opened email.');
  });

  it('distinguishes direct obligations from things to consider', () => {
    const prompt = buildEmailAnalysisPrompt(buildCleanThreadText());

    expect(prompt).toContain(
      'Explicit action items must be direct asks, commitments, or obligations'
    );
    expect(prompt).toContain(
      'Things to consider are context, caveats, or interpretations, not obligations.'
    );
    expect(prompt).toContain('Do not invent tasks, deadlines, owners, events, labels, or facts');
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
    expect(prompt).toContain('"explicitActionItems"');
    expect(prompt).toContain('"thingsToConsider"');
    expect(prompt).toContain('"suggestedReplyPoints"');
    expect(prompt).toContain('"suggestedCalendarEvent"');
    expect(prompt).toContain('"suggestedLabel"');
    expect(prompt).toContain('"followUpRecommendation"');
    expect(prompt).toContain('"risksAndAmbiguities"');
    expect(prompt).toContain('"overallConfidence"');
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
