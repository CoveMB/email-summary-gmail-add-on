import type { ActionOwner, Confidence, UrgencyOrPressure } from '../types/types';
import { escapeCardText } from '../utils/CardUtils';
export { formatIsoDateForDisplay } from '../utils/DateUtils';
export { formatSourceMessageIdsForDisplay } from './SourceMessageIds';

export type MetadataLineValue = string | readonly string[] | null | undefined;

export type MetadataLineInput = Readonly<{
  fallbackValue?: string | undefined;
  label: string;
  value?: MetadataLineValue;
}>;

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

export const formatActionOwnerForDisplay = (owner: ActionOwner): string =>
  actionOwnerDisplayNames[owner];

export const formatConfidenceForDisplay = (confidence: Confidence): string =>
  confidenceDisplayNames[confidence];

export const formatUrgencyOrPressureForDisplay = (urgencyOrPressure: UrgencyOrPressure): string =>
  urgencyOrPressureDisplayNames[urgencyOrPressure];
