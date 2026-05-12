const sourceMessageIdMaximumLength = 200;
const sourceMessageIdPattern = /^message-([1-9]\d*)$/;

const safeSourceMessageIdText = (value: unknown): string =>
  typeof value === 'string' ? value.trim().slice(0, sourceMessageIdMaximumLength).trimEnd() : '';

export const buildSourceMessageId = (messageIndex: number): string =>
  `message-${String(messageIndex + 1)}`;

export const normalizeSourceMessageId = (value: unknown): string => {
  const sourceMessageId = safeSourceMessageIdText(value);

  return sourceMessageIdPattern.test(sourceMessageId) ? sourceMessageId : '';
};

export const formatSourceMessageIdForDisplay = (sourceMessageId: string): string | undefined => {
  const messageNumber = sourceMessageId.match(sourceMessageIdPattern)?.[1];

  return messageNumber ? `Message ${messageNumber}` : undefined;
};

export const formatSourceMessageIdsForDisplay = (
  sourceMessageIds: readonly string[] | undefined
): string | undefined => {
  if (!sourceMessageIds || sourceMessageIds.length === 0) {
    return undefined;
  }

  const formattedSourceMessageIds = sourceMessageIds
    .map(formatSourceMessageIdForDisplay)
    .filter((messageLabel): messageLabel is string => messageLabel !== undefined);

  return formattedSourceMessageIds.length > 0 ? formattedSourceMessageIds.join(', ') : undefined;
};
