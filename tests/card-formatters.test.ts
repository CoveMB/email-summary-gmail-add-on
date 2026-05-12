import { describe, expect, it } from 'vitest';

import {
  buildLabeledMetadataList,
  buildMetadataLine,
  buildOptionalMetadataLines,
  formatActionOwnerForDisplay,
  formatConfidenceForDisplay,
  formatIsoDateForDisplay,
  formatSourceMessageIdsForDisplay,
  formatUrgencyOrPressureForDisplay,
} from '../src/domain/CardFormatters';

describe('buildMetadataLine', () => {
  it('escapes labels and values before rendering card markup', () => {
    expect(buildMetadataLine('A&B', '<unsafe>')).toBe('<b>A&amp;B:</b> &lt;unsafe&gt;');
  });
});

describe('buildOptionalMetadataLines', () => {
  it('renders strings, arrays, and fallback values while dropping empty metadata', () => {
    expect(
      buildOptionalMetadataLines([
        { label: 'String', value: 'value' },
        { label: 'Array', value: ['first', 'second'] },
        { fallbackValue: 'fallback', label: 'Empty string', value: '' },
        { fallbackValue: 'fallback', label: 'Empty array', value: [] },
        { label: 'Missing', value: undefined },
      ])
    ).toEqual([
      '<b>String:</b> value',
      '<b>Array:</b> first, second',
      '<b>Empty string:</b> fallback',
      '<b>Empty array:</b> fallback',
    ]);
  });
});

describe('buildLabeledMetadataList', () => {
  it('renders one labeled metadata line per value', () => {
    expect(buildLabeledMetadataList('Evidence', ['message-1', 'message-2'], 'none')).toEqual([
      '- <b>Evidence:</b> message-1',
      '- <b>Evidence:</b> message-2',
    ]);
  });

  it('renders the fallback when no values are available', () => {
    expect(buildLabeledMetadataList('Evidence', [], 'none')).toEqual(['<b>Evidence:</b> none']);
  });
});

describe('display formatters', () => {
  it('renders enum values as readable labels', () => {
    expect(formatActionOwnerForDisplay('third_party')).toBe('Third party');
    expect(formatConfidenceForDisplay('medium')).toBe('Medium');
    expect(formatUrgencyOrPressureForDisplay('none')).toBe('None');
  });

  it('renders ISO dates and source message IDs for card display', () => {
    expect(formatIsoDateForDisplay('2026-05-12')).toBe('May 12, 2026');
    expect(formatIsoDateForDisplay('2026-05-12T15:30:00.000Z')).toBe('May 12, 2026, 3:30 PM UTC');
    expect(formatSourceMessageIdsForDisplay(['message-1', 'message-2'])).toBe(
      'Message 1, Message 2'
    );
  });
});
