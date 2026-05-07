import { escapeCardText } from '../utils/CardUtils';

export type MetadataLineValue = string | readonly string[] | null | undefined;

export type MetadataLineInput = Readonly<{
  fallbackValue?: string | undefined;
  label: string;
  value?: MetadataLineValue;
}>;

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
