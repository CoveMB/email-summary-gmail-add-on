export const normalizeLineEndings = (text: string): string => text.replace(/\r\n?/g, '\n');

export const trimTrailingLineWhitespace = (text: string): string =>
  text
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');

export const collapseExcessBlankLines = (text: string): string => text.replace(/\n{3,}/g, '\n\n');

export const isNonEmptyLine = (line: string): boolean => line.trim().length > 0;

export const findFirstNonEmptyLineIndex = (lines: readonly string[]): number =>
  lines.findIndex(isNonEmptyLine);

export const findLastNonEmptyLineIndex = (lines: readonly string[]): number => {
  for (let lineIndex = lines.length - 1; lineIndex >= 0; lineIndex -= 1) {
    if (isNonEmptyLine(lines[lineIndex] ?? '')) {
      return lineIndex;
    }
  }

  return -1;
};

export const trimOuterBlankLines = (text: string): string => {
  const lines = text.split('\n');
  const firstContentLineIndex = findFirstNonEmptyLineIndex(lines);

  if (firstContentLineIndex === -1) {
    return '';
  }

  const lastContentLineIndex = findLastNonEmptyLineIndex(lines);

  return lines.slice(firstContentLineIndex, lastContentLineIndex + 1).join('\n');
};

export const cutAtFirstMatchingLine = (
  lines: readonly string[],
  predicate: (line: string) => boolean
): readonly string[] => {
  const matchingLineIndex = lines.findIndex(predicate);

  return matchingLineIndex === -1 ? lines : lines.slice(0, matchingLineIndex);
};
