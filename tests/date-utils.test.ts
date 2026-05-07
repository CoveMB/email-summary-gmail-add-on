import { describe, expect, it } from 'vitest';

import { parseDateTimeOrMinimum } from '../src/utils/DateUtils';

describe('parseDateTimeOrMinimum', () => {
  it('parses valid date-time strings', () => {
    expect(parseDateTimeOrMinimum('2026-05-06T12:00:00.000Z')).toBe(
      Date.parse('2026-05-06T12:00:00.000Z')
    );
  });

  it('returns negative infinity for malformed date-time strings', () => {
    expect(parseDateTimeOrMinimum('not-a-date')).toBe(Number.NEGATIVE_INFINITY);
  });
});
