import { describe, expect, it } from 'vitest';

import {
  collapseExcessBlankLines,
  cutAtFirstMatchingLine,
  findFirstNonEmptyLineIndex,
  findLastNonEmptyLineIndex,
  normalizeLineEndings,
  trimOuterBlankLines,
  trimTrailingLineWhitespace,
} from '../src/utils/TextUtils';

describe('text utilities', () => {
  it('normalizes mixed line endings to line feeds', () => {
    expect(normalizeLineEndings('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('trims trailing whitespace per line without trimming meaningful leading whitespace', () => {
    expect(trimTrailingLineWhitespace('  keep  \nnext\t')).toBe('  keep\nnext');
  });

  it('collapses three or more blank lines to two line breaks', () => {
    expect(collapseExcessBlankLines('a\n\n\nb')).toBe('a\n\nb');
  });

  it('finds content line boundaries', () => {
    const lines = ['', '  ', 'first', '', 'last', ''];

    expect(findFirstNonEmptyLineIndex(lines)).toBe(2);
    expect(findLastNonEmptyLineIndex(lines)).toBe(4);
  });

  it('trims only outer blank lines', () => {
    expect(trimOuterBlankLines('\n\nfirst\n\nlast\n')).toBe('first\n\nlast');
  });

  it('cuts lines at the first matching line', () => {
    expect(cutAtFirstMatchingLine(['keep', 'cut', 'drop'], (line) => line === 'cut')).toEqual([
      'keep',
    ]);
  });
});
