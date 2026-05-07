export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const truncateTextWithSuffix = (
  text: string,
  maxChars: number,
  suffix: string
): Readonly<{ text: string; wasTruncated: boolean }> => {
  const safeMaximumCharacterCount = Math.max(0, Math.floor(maxChars));

  if (text.length <= safeMaximumCharacterCount) {
    return {
      text,
      wasTruncated: false,
    };
  }

  if (safeMaximumCharacterCount === 0) {
    return {
      text: '',
      wasTruncated: true,
    };
  }

  if (safeMaximumCharacterCount <= suffix.length) {
    return {
      text: text.slice(0, safeMaximumCharacterCount),
      wasTruncated: true,
    };
  }

  return {
    text: `${text.slice(0, safeMaximumCharacterCount - suffix.length)}${suffix}`,
    wasTruncated: true,
  };
};
