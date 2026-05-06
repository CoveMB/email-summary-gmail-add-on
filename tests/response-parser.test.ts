import { describe, expect, it } from 'vitest';

import { parsePlaceholderResponse } from '../src/ResponseParser';

describe('parsePlaceholderResponse', () => {
  it('returns an explicit not-implemented placeholder result', () => {
    const result = parsePlaceholderResponse({ summary: 'ignored for now' });

    expect(result).toEqual({
      implemented: false,
      sections: [],
    });
  });
});
