import { describe, expect, it } from 'vitest';

import { isNonEmptyString } from '../src/utils/StringUtils';

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
