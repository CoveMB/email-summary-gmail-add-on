import { describe, expect, it } from 'vitest';

import { buildPlaceholderPrompt } from '../src/domain/PromptBuilder';

describe('buildPlaceholderPrompt', () => {
  it('returns static placeholder prompt metadata', () => {
    const prompt = buildPlaceholderPrompt();

    expect(prompt).toEqual({
      body: 'Prompt assembly is intentionally not implemented yet.',
      title: 'EmailSummary prompt placeholder',
    });
  });
});
