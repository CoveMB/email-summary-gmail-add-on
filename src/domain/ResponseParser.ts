import {
  actionOwnerValues,
  confidenceValues,
  urgencyOrPressureValues,
  type ActionOwner,
  type Confidence,
  type EmailAnalysis,
  type ExplicitActionItem,
  type FollowUpRecommendation,
  type SocialToneAnalysis,
  type SuggestedLabel,
  type ThingToConsider,
  type UrgencyOrPressure,
} from '../types/types';
import { isRecord, type UnknownRecord } from '../utils/TypeGuards';
import { isSupportedIsoDate } from '../utils/DateUtils';
import {
  analysisFieldNames,
  currentAnalysisSchemaVersion,
  requiredAnalysisFieldNames,
  readAnalysisField,
  type AnalysisFieldName,
} from './AnalysisSchema';
import { createDefaultSocialToneAnalysis, defaultSocialToneSummary } from './SocialToneDefaults';
import { normalizeSourceMessageId } from './SourceMessageIds';

export const parseFailureSummary = 'Analysis could not be parsed.';
const parseFailureFallbackReason = 'Parser returned fallback analysis.';
const safeReasonMaximumLength = 500;
const analysisTextMaximumLength = 1000;
const labelNameMaximumLength = 80;
const unsafeSocialToneTerms = [
  'anxious',
  'manipulative',
  'narcissistic',
  'narcissist',
  'depressed',
  'depression',
  'mentally ill',
  'psychotic',
] as const;

type NormalizedDescribedItemBase = Readonly<{
  confidence: Confidence;
  description: string;
  sourceMessageIds?: readonly string[];
}>;

type NormalizedValue<NormalizedValueType> = Readonly<{
  value: NormalizedValueType;
  warnings: readonly string[];
}>;

type NormalizedNullableValue<NormalizedValueType> = Readonly<{
  value: NormalizedValueType | null;
  warnings: readonly string[];
}>;

type NormalizedOptionalDate = Readonly<{
  isoDate?: string;
  warnings: readonly string[];
}>;

type SanitizedSocialToneText = Readonly<{
  text: string;
  wasSanitized: boolean;
}>;

type NormalizedAnalysisParts = Readonly<{
  explicitActionItems: NormalizedValue<readonly ExplicitActionItem[]>;
  followUpRecommendation: NormalizedValue<FollowUpRecommendation>;
  missingFields: readonly string[];
  socialTone: NormalizedValue<SocialToneAnalysis>;
  thingsToConsider: NormalizedValue<readonly ThingToConsider[]>;
  warnings: readonly string[];
}>;

export type ParseGeminiAnalysisOptions = Readonly<{
  allowedSourceMessageIds?: readonly string[];
}>;

const createEmptyFollowUpRecommendation = (): FollowUpRecommendation => ({
  confidence: 'low',
  reason: '',
  shouldFollowUp: null,
});

const isAllowedStringValue = <AllowedValue extends string>(
  allowedValues: readonly AllowedValue[],
  value: string
): value is AllowedValue => (allowedValues as readonly string[]).includes(value);

const normalizeActionOwner = (value: unknown): ActionOwner => {
  if (typeof value === 'string' && isAllowedStringValue(actionOwnerValues, value)) {
    return value;
  }

  return 'unclear';
};

const normalizeUrgencyOrPressure = (value: unknown): UrgencyOrPressure => {
  if (typeof value === 'string' && isAllowedStringValue(urgencyOrPressureValues, value)) {
    return value;
  }

  return 'unclear';
};

const normalizeStringArray = (value: unknown, maxLength: number): readonly string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => safeText(item, maxLength)).filter((item) => item.length > 0);
};

const buildAllowedSourceMessageIdSet = (
  allowedSourceMessageIds: readonly string[] | undefined
): ReadonlySet<string> | undefined =>
  allowedSourceMessageIds
    ? new Set(
        allowedSourceMessageIds
          .map(normalizeSourceMessageId)
          .filter((sourceMessageId) => sourceMessageId.length > 0)
      )
    : undefined;

const normalizeSourceMessageIds = (
  value: unknown,
  allowedSourceMessageIds: readonly string[] | undefined
): readonly string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedSourceMessageIdSet = buildAllowedSourceMessageIdSet(allowedSourceMessageIds);

  return [
    ...new Set(
      value
        .map(normalizeSourceMessageId)
        .filter((sourceMessageId) => sourceMessageId.length > 0)
        .filter(
          (sourceMessageId) =>
            allowedSourceMessageIdSet === undefined ||
            allowedSourceMessageIdSet.has(sourceMessageId)
        )
    ),
  ];
};

const normalizeOptionalIsoDate = (
  value: unknown,
  invalidDateWarning: string
): NormalizedOptionalDate => {
  const isoDate = safeText(value, analysisTextMaximumLength);

  if (isoDate.length === 0) {
    return { warnings: [] };
  }

  return isSupportedIsoDate(isoDate)
    ? { isoDate, warnings: [] }
    : { warnings: [invalidDateWarning] };
};

const normalizeNullableText = (value: unknown, maxLength: number): string | null => {
  const text = safeText(value, maxLength);

  return text.length > 0 ? text : null;
};

const readSafeTextField = (
  record: UnknownRecord,
  fieldName: AnalysisFieldName,
  maxLength = analysisTextMaximumLength
): string => safeText(readAnalysisField(record, fieldName), maxLength);

const readNullableTextField = (
  record: UnknownRecord,
  fieldName: AnalysisFieldName,
  maxLength = analysisTextMaximumLength
): string | null => normalizeNullableText(readAnalysisField(record, fieldName), maxLength);

const readStringArrayField = (
  record: UnknownRecord,
  fieldName: AnalysisFieldName,
  maxLength = analysisTextMaximumLength
): readonly string[] => normalizeStringArray(readAnalysisField(record, fieldName), maxLength);

const hasUnsafeSocialToneText = (text: string): boolean => {
  const normalizedText = text.toLowerCase();

  return unsafeSocialToneTerms.some((unsafeTerm) => normalizedText.includes(unsafeTerm));
};

const sanitizeSocialToneText = (text: string): SanitizedSocialToneText =>
  hasUnsafeSocialToneText(text) ? { text: '', wasSanitized: true } : { text, wasSanitized: false };

const sanitizeNullableSocialToneText = (text: string | null): SanitizedSocialToneText =>
  text === null ? { text: '', wasSanitized: false } : sanitizeSocialToneText(text);

const sanitizeSocialToneTextArray = (
  values: readonly string[]
): Readonly<{ values: readonly string[]; wasSanitized: boolean }> => {
  const sanitizedValues = values.map(sanitizeSocialToneText);

  return {
    values: sanitizedValues
      .map((sanitizedValue) => sanitizedValue.text)
      .filter((sanitizedText) => sanitizedText.length > 0),
    wasSanitized: sanitizedValues.some((sanitizedValue) => sanitizedValue.wasSanitized),
  };
};

const normalizeDescribedItemBase = (
  value: UnknownRecord,
  options: ParseGeminiAnalysisOptions
): NormalizedDescribedItemBase | null => {
  const sourceMessageIds = normalizeSourceMessageIds(
    readAnalysisField(value, 'sourceMessageIds'),
    options.allowedSourceMessageIds
  );
  const description = safeText(value.description, analysisTextMaximumLength);

  if (description.length === 0) {
    return null;
  }

  return {
    confidence: normalizeConfidence(value.confidence),
    description,
    ...(sourceMessageIds.length > 0 ? { sourceMessageIds } : {}),
  };
};

const normalizeExplicitActionItem = (
  value: unknown,
  options: ParseGeminiAnalysisOptions
): NormalizedNullableValue<ExplicitActionItem> => {
  if (!isRecord(value)) {
    return { value: null, warnings: [] };
  }

  const baseItem = normalizeDescribedItemBase(value, options);

  if (baseItem === null) {
    return { value: null, warnings: [] };
  }

  const dueDate = normalizeOptionalIsoDate(
    readAnalysisField(value, 'dueDateIso'),
    'AI response included an invalid due date, so the date was hidden.'
  );

  return {
    value: {
      ...baseItem,
      owner: normalizeActionOwner(value.owner),
      ...(dueDate.isoDate ? { dueDateIso: dueDate.isoDate } : {}),
    },
    warnings: dueDate.warnings,
  };
};

const normalizeThingToConsider = (
  value: unknown,
  options: ParseGeminiAnalysisOptions
): NormalizedNullableValue<ThingToConsider> => ({
  value: isRecord(value) ? normalizeDescribedItemBase(value, options) : null,
  warnings: [],
});

const normalizeSuggestedLabel = (value: unknown): SuggestedLabel | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const name = safeText(value.name, labelNameMaximumLength);

  if (name.length === 0) {
    return undefined;
  }

  return {
    confidence: normalizeConfidence(value.confidence),
    name,
    reason: safeText(value.reason, analysisTextMaximumLength),
  };
};

const normalizeFollowUpRecommendation = (
  value: unknown
): NormalizedValue<FollowUpRecommendation> => {
  if (!isRecord(value)) {
    return {
      value: createEmptyFollowUpRecommendation(),
      warnings: [],
    };
  }

  const followUpDate = normalizeOptionalIsoDate(
    readAnalysisField(value, 'followUpDateIso'),
    'AI response included an invalid follow-up date, so the date was hidden.'
  );
  const shouldFollowUpValue = readAnalysisField(value, 'shouldFollowUp');

  return {
    value: {
      confidence: normalizeConfidence(value.confidence),
      reason: safeText(value.reason, analysisTextMaximumLength),
      shouldFollowUp:
        shouldFollowUpValue === true ? true : shouldFollowUpValue === false ? false : null,
      ...(followUpDate.isoDate ? { followUpDateIso: followUpDate.isoDate } : {}),
    },
    warnings: followUpDate.warnings,
  };
};

const normalizeSocialToneAnalysis = (value: unknown): NormalizedValue<SocialToneAnalysis> => {
  if (!isRecord(value)) {
    return {
      value: createDefaultSocialToneAnalysis(),
      warnings: [],
    };
  }

  const summary = sanitizeSocialToneText(readSafeTextField(value, 'socialToneSummary'));
  const apparentTone = sanitizeSocialToneTextArray(
    readStringArrayField(value, 'socialToneApparentTone')
  );
  const cautions = sanitizeSocialToneTextArray(readStringArrayField(value, 'socialToneCautions'));
  const evidence = sanitizeSocialToneText(readSafeTextField(value, 'socialToneEvidence'));
  const possibleSenderState = sanitizeNullableSocialToneText(
    readNullableTextField(value, 'socialTonePossibleSenderState')
  );
  const relationalStance = sanitizeNullableSocialToneText(
    readNullableTextField(value, 'socialToneRelationalStance')
  );
  const socialSignals = sanitizeSocialToneTextArray(
    readStringArrayField(value, 'socialToneSocialSignals')
  );
  const socialToneWasSanitized = [
    summary.wasSanitized,
    apparentTone.wasSanitized,
    cautions.wasSanitized,
    evidence.wasSanitized,
    possibleSenderState.wasSanitized,
    relationalStance.wasSanitized,
    socialSignals.wasSanitized,
  ].some(Boolean);

  return {
    value: {
      apparentTone: apparentTone.values,
      cautions: cautions.values,
      confidence: normalizeConfidence(value.confidence),
      evidence: evidence.text,
      possibleSenderState: possibleSenderState.text.length > 0 ? possibleSenderState.text : null,
      relationalStance: relationalStance.text.length > 0 ? relationalStance.text : null,
      socialSignals: socialSignals.values,
      summary: summary.text || defaultSocialToneSummary,
      urgencyOrPressure: normalizeUrgencyOrPressure(
        readAnalysisField(value, 'socialToneUrgencyOrPressure')
      ),
    },
    warnings: socialToneWasSanitized
      ? ['Some communication-cue wording was hidden because it overclaimed sender state.']
      : [],
  };
};

const normalizeObjectArray = <NormalizedItem>(
  value: unknown,
  normalizeItem: (value: unknown) => NormalizedNullableValue<NormalizedItem>
): NormalizedValue<readonly NormalizedItem[]> => {
  if (!Array.isArray(value)) {
    return {
      value: [],
      warnings: [],
    };
  }

  const normalizedItems = value
    .map(normalizeItem)
    .filter(
      (normalizedItem): normalizedItem is NormalizedValue<NormalizedItem> =>
        normalizedItem.value !== null
    );

  return {
    value: normalizedItems.map((normalizedItem) => normalizedItem.value),
    warnings: normalizedItems.flatMap((normalizedItem) => normalizedItem.warnings),
  };
};

const hasAnalysisField = (record: UnknownRecord, fieldName: AnalysisFieldName): boolean => {
  const fieldNames = analysisFieldNames[fieldName];

  return fieldNames.internal in record || fieldNames.external in record;
};

const buildMissingAnalysisFields = (record: UnknownRecord): readonly string[] =>
  requiredAnalysisFieldNames
    .filter((fieldName) => !hasAnalysisField(record, fieldName))
    .map((fieldName) => analysisFieldNames[fieldName].external);

const formatAnalysisFieldForWarning = (fieldName: string): string => fieldName.replace(/_/g, ' ');

const buildMissingFieldWarnings = (missingFields: readonly string[]): readonly string[] =>
  missingFields
    .filter((missingField) => missingField !== analysisFieldNames.schemaVersion.external)
    .map(
      (missingField) =>
        `AI response did not include the ${formatAnalysisFieldForWarning(missingField)} field.`
    );

const dedupeWarnings = (warnings: readonly string[]): readonly string[] => [...new Set(warnings)];

const collectNormalizedAnalysisWarnings = (
  normalizedAnalysisParts: Pick<
    NormalizedAnalysisParts,
    | 'explicitActionItems'
    | 'followUpRecommendation'
    | 'missingFields'
    | 'socialTone'
    | 'thingsToConsider'
  >
): readonly string[] =>
  dedupeWarnings([
    ...buildMissingFieldWarnings(normalizedAnalysisParts.missingFields),
    ...normalizedAnalysisParts.explicitActionItems.warnings,
    ...normalizedAnalysisParts.followUpRecommendation.warnings,
    ...normalizedAnalysisParts.socialTone.warnings,
    ...normalizedAnalysisParts.thingsToConsider.warnings,
  ]);

const normalizeAnalysisParts = (
  value: UnknownRecord,
  options: ParseGeminiAnalysisOptions
): NormalizedAnalysisParts => {
  const explicitActionItems = normalizeObjectArray(
    readAnalysisField(value, 'explicitActionItems'),
    (item) => normalizeExplicitActionItem(item, options)
  );
  const followUpRecommendation = normalizeFollowUpRecommendation(
    readAnalysisField(value, 'followUpRecommendation')
  );
  const missingFields = buildMissingAnalysisFields(value);
  const socialTone = normalizeSocialToneAnalysis(readAnalysisField(value, 'socialTone'));
  const thingsToConsider = normalizeObjectArray(
    readAnalysisField(value, 'thingsToConsider'),
    (item) => normalizeThingToConsider(item, options)
  );

  return {
    explicitActionItems,
    followUpRecommendation,
    missingFields,
    socialTone,
    thingsToConsider,
    warnings: collectNormalizedAnalysisWarnings({
      explicitActionItems,
      followUpRecommendation,
      missingFields,
      socialTone,
      thingsToConsider,
    }),
  };
};

const normalizeSchemaVersion = (value: unknown): string => {
  const schemaVersion = safeText(value, analysisTextMaximumLength);

  return schemaVersion.length > 0 ? schemaVersion : currentAnalysisSchemaVersion;
};

const normalizeEmailAnalysis = (
  value: unknown,
  options: ParseGeminiAnalysisOptions
): EmailAnalysis => {
  if (!isRecord(value)) {
    return createParseFailureEmailAnalysis('AI response was not a JSON object.');
  }

  const normalizedAnalysisParts = normalizeAnalysisParts(value, options);
  const suggestedLabel = normalizeSuggestedLabel(readAnalysisField(value, 'suggestedLabel'));

  return {
    explicitActionItems: normalizedAnalysisParts.explicitActionItems.value,
    followUpRecommendation: normalizedAnalysisParts.followUpRecommendation.value,
    overallConfidence: normalizeConfidence(readAnalysisField(value, 'overallConfidence')),
    parseMetadata: {
      missingFields: normalizedAnalysisParts.missingFields,
      warnings: normalizedAnalysisParts.warnings,
    },
    risksAndAmbiguities: normalizeStringArray(
      readAnalysisField(value, 'risksAndAmbiguities'),
      analysisTextMaximumLength
    ),
    schemaVersion: normalizeSchemaVersion(readAnalysisField(value, 'schemaVersion')),
    suggestedReplyPoints: normalizeStringArray(
      readAnalysisField(value, 'suggestedReplyPoints'),
      analysisTextMaximumLength
    ),
    socialTone: normalizedAnalysisParts.socialTone.value,
    summary: readSafeTextField(value, 'summary'),
    thingsToConsider: normalizedAnalysisParts.thingsToConsider.value,
    ...(suggestedLabel ? { suggestedLabel } : {}),
  };
};

export const normalizeConfidence = (value: unknown): Confidence => {
  if (typeof value !== 'string') {
    return 'low';
  }

  const normalizedValue = value.trim().toLowerCase();

  if (isAllowedStringValue(confidenceValues, normalizedValue)) {
    return normalizedValue;
  }

  return 'low';
};

export const safeText = (value: unknown, maxLength: number): string => {
  if (typeof value !== 'string') {
    return '';
  }

  const safeMaximumLength = Math.max(0, Math.floor(maxLength));

  if (safeMaximumLength === 0) {
    return '';
  }

  const trimmedText = value.trim();

  return trimmedText.length <= safeMaximumLength
    ? trimmedText
    : trimmedText.slice(0, safeMaximumLength).trimEnd();
};

export const createEmptyEmailAnalysis = (): EmailAnalysis => ({
  explicitActionItems: [],
  followUpRecommendation: createEmptyFollowUpRecommendation(),
  overallConfidence: 'low',
  risksAndAmbiguities: [],
  suggestedReplyPoints: [],
  socialTone: createDefaultSocialToneAnalysis(),
  summary: '',
  thingsToConsider: [],
});

export const createParseFailureEmailAnalysis = (reason: string): EmailAnalysis => {
  const safeReason = safeText(reason, safeReasonMaximumLength);
  const failureReason = safeReason || parseFailureFallbackReason;

  return {
    ...createEmptyEmailAnalysis(),
    followUpRecommendation: {
      confidence: 'low',
      reason: failureReason,
      shouldFollowUp: null,
    },
    parseMetadata: {
      missingFields: [],
      warnings: [failureReason],
    },
    risksAndAmbiguities: [failureReason],
    schemaVersion: currentAnalysisSchemaVersion,
    summary: parseFailureSummary,
  };
};

export const stripMarkdownCodeFences = (raw: string): string => {
  const trimmedRaw = raw.trim();
  const fencedJsonMatch = trimmedRaw.match(/^```[A-Za-z0-9_-]*\s*([\s\S]*?)\s*```$/);

  return fencedJsonMatch?.[1]?.trim() ?? trimmedRaw;
};

export const parseGeminiAnalysis = (
  raw: string,
  options: ParseGeminiAnalysisOptions = {}
): EmailAnalysis => {
  try {
    const parsedValue = JSON.parse(stripMarkdownCodeFences(raw)) as unknown;

    return normalizeEmailAnalysis(parsedValue, options);
  } catch (_error: unknown) {
    return createParseFailureEmailAnalysis('AI response was not valid JSON.');
  }
};
