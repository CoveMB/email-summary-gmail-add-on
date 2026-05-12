import type { ActionOwner, Confidence, UrgencyOrPressure } from '../types/types';
import { escapeCardText } from '../utils/CardUtils';

export type MetadataLineValue = string | readonly string[] | null | undefined;

export type MetadataLineInput = Readonly<{
  fallbackValue?: string | undefined;
  label: string;
  value?: MetadataLineValue;
}>;

const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const actionOwnerDisplayNames = {
  recipient: 'Recipient',
  sender: 'Sender',
  third_party: 'Third party',
  unclear: 'Unclear',
} as const satisfies Readonly<Record<ActionOwner, string>>;

const confidenceDisplayNames = {
  high: 'High',
  low: 'Low',
  medium: 'Medium',
} as const satisfies Readonly<Record<Confidence, string>>;

const urgencyOrPressureDisplayNames = {
  high: 'High',
  low: 'Low',
  medium: 'Medium',
  none: 'None',
  unclear: 'Unclear',
} as const satisfies Readonly<Record<UrgencyOrPressure, string>>;

const sourceMessageIdPattern = /^message-([1-9]\d*)$/;

export const buildMetadataLine = (label: string, value: string): string =>
  `<b>${escapeCardText(label)}:</b> ${escapeCardText(value)}`;

const resolveMetadataLineValue = (metadataLine: MetadataLineInput): string | undefined => {
  const metadataValue = metadataLine.value;

  if (typeof metadataValue === 'string') {
    return metadataValue.length > 0 ? metadataValue : metadataLine.fallbackValue;
  }

  if (Array.isArray(metadataValue)) {
    return metadataValue.length > 0 ? metadataValue.join(', ') : metadataLine.fallbackValue;
  }

  return metadataLine.fallbackValue;
};

export const buildOptionalMetadataLines = (
  metadataLines: readonly MetadataLineInput[]
): readonly string[] =>
  metadataLines.flatMap((metadataLine) => {
    const value = resolveMetadataLineValue(metadataLine);

    return value ? [buildMetadataLine(metadataLine.label, value)] : [];
  });

export const buildLabeledMetadataList = (
  label: string,
  values: readonly string[],
  fallbackValue: string
): readonly string[] =>
  values.length > 0
    ? values.map((value) => `- ${buildMetadataLine(label, value)}`)
    : [buildMetadataLine(label, fallbackValue)];

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

const formatDateParts = (date: Date): string => {
  const monthName = monthNames[date.getUTCMonth()] ?? 'Jan';
  const day = String(date.getUTCDate());
  const year = String(date.getUTCFullYear());

  return `${monthName} ${day}, ${year}`;
};

const formatTimeParts = (date: Date): string => {
  const hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const hour12 = hours % 12 || 12;
  const meridiem = hours >= 12 ? 'PM' : 'AM';

  return `${String(hour12)}:${minutes} ${meridiem} UTC`;
};

export const formatActionOwnerForDisplay = (owner: ActionOwner): string =>
  actionOwnerDisplayNames[owner];

export const formatConfidenceForDisplay = (confidence: Confidence): string =>
  confidenceDisplayNames[confidence];

export const formatIsoDateForDisplay = (isoDate: string | undefined): string | undefined => {
  if (!isoDate) {
    return undefined;
  }

  const parsedDate = new Date(isoDate);

  if (!isValidDate(parsedDate)) {
    return isoDate;
  }

  return isoDate.includes('T')
    ? `${formatDateParts(parsedDate)}, ${formatTimeParts(parsedDate)}`
    : formatDateParts(parsedDate);
};

export const formatSourceMessageIdsForDisplay = (
  sourceMessageIds: readonly string[] | undefined
): string | undefined => {
  if (!sourceMessageIds || sourceMessageIds.length === 0) {
    return undefined;
  }

  return sourceMessageIds
    .map((sourceMessageId) => sourceMessageId.match(sourceMessageIdPattern)?.[1])
    .filter((messageNumber): messageNumber is string => messageNumber !== undefined)
    .map((messageNumber) => `Message ${messageNumber}`)
    .join(', ');
};

export const formatUrgencyOrPressureForDisplay = (urgencyOrPressure: UrgencyOrPressure): string =>
  urgencyOrPressureDisplayNames[urgencyOrPressure];
