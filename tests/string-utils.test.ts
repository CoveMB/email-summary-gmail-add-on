import { describe, expect, it } from 'vitest';

import { isNonEmptyString, truncateTextWithSuffix } from '../src/utils/StringUtils';

describe('isNonEmptyString', () => {
  it('accepts strings with non-whitespace content', () => {
    expect(isNonEmptyString('message-123')).toBe(true);
  });

  it('rejects empty and whitespace-only strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString({ value: 'message-123' })).toBe(false);
  });
});

describe('truncateTextWithSuffix', () => {
  it('keeps text unchanged when it fits within the limit', () => {
    expect(truncateTextWithSuffix('Short text', 20, '...')).toEqual({
      text: 'Short text',
      wasTruncated: false,
    });
  });

  it('truncates with suffix while respecting the maximum length', () => {
    expect(truncateTextWithSuffix('1234567890', 7, '...')).toEqual({
      text: '1234...',
      wasTruncated: true,
    });
  });

  it('omits suffix when the maximum length cannot fit it', () => {
    expect(truncateTextWithSuffix('abcdef', 2, '...')).toEqual({
      text: 'ab',
      wasTruncated: true,
    });
  });
});
