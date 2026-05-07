import type {
  ActionOwner,
  Confidence,
  EmailAnalysis,
  ExplicitActionItem,
  FollowUpRecommendation,
  SuggestedCalendarEvent,
  SuggestedLabel,
  ThingToConsider,
} from '../types/types';
import { readAnalysisField } from './AnalysisSchema';

const parseFailureSummary = 'Analysis could not be parsed.';
const parseFailureFallbackReason = 'Parser returned fallback analysis.';
const safeReasonMaximumLength = 500;
const analysisTextMaximumLength = 1000;
const labelNameMaximumLength = 80;
const sourceMessageIdMaximumLength = 200;

type UnknownRecord = Readonly<Record<string, unknown>>;
type NormalizedDescribedItemBase = Readonly<{
  confidence: Confidence;
  description: string;
  sourceMessageIds?: readonly string[];
}>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const createEmptyFollowUpRecommendation = (): FollowUpRecommendation => ({
  confidence: 'low',
  reason: '',
  shouldFollowUp: false,
});

const normalizeActionOwner = (value: unknown): ActionOwner => {
  if (
    value === 'recipient' ||
    value === 'sender' ||
    value === 'third_party' ||
    value === 'unclear'
  ) {
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

const normalizeDescribedItemBase = (value: UnknownRecord): NormalizedDescribedItemBase | null => {
  const sourceMessageIds = normalizeStringArray(
    readAnalysisField(value, 'sourceMessageIds'),
    sourceMessageIdMaximumLength
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

const normalizeExplicitActionItem = (value: unknown): ExplicitActionItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const baseItem = normalizeDescribedItemBase(value);

  if (baseItem === null) {
    return null;
  }

  const dueDateIso = safeText(readAnalysisField(value, 'dueDateIso'), analysisTextMaximumLength);

  return {
    ...baseItem,
    owner: normalizeActionOwner(value.owner),
    ...(dueDateIso.length > 0 ? { dueDateIso } : {}),
  };
};

const normalizeThingToConsider = (value: unknown): ThingToConsider | null =>
  isRecord(value) ? normalizeDescribedItemBase(value) : null;

const normalizeSuggestedCalendarEvent = (value: unknown): SuggestedCalendarEvent | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const description = safeText(value.description, analysisTextMaximumLength);
  const endDateTimeIso = safeText(
    readAnalysisField(value, 'endDateTimeIso'),
    analysisTextMaximumLength
  );
  const location = safeText(value.location, analysisTextMaximumLength);
  const startDateTimeIso = safeText(
    readAnalysisField(value, 'startDateTimeIso'),
    analysisTextMaximumLength
  );
  const title = safeText(value.title, analysisTextMaximumLength);

  if (title.length === 0) {
    return undefined;
  }

  return {
    confidence: normalizeConfidence(value.confidence),
    title,
    ...(description.length > 0 ? { description } : {}),
    ...(endDateTimeIso.length > 0 ? { endDateTimeIso } : {}),
    ...(location.length > 0 ? { location } : {}),
    ...(startDateTimeIso.length > 0 ? { startDateTimeIso } : {}),
  };
};

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

const normalizeFollowUpRecommendation = (value: unknown): FollowUpRecommendation => {
  if (!isRecord(value)) {
    return createEmptyFollowUpRecommendation();
  }

  const followUpDateIso = safeText(
    readAnalysisField(value, 'followUpDateIso'),
    analysisTextMaximumLength
  );

  return {
    confidence: normalizeConfidence(value.confidence),
    reason: safeText(value.reason, analysisTextMaximumLength),
    shouldFollowUp: readAnalysisField(value, 'shouldFollowUp') === true,
    ...(followUpDateIso.length > 0 ? { followUpDateIso } : {}),
  };
};

const normalizeObjectArray = <NormalizedItem>(
  value: unknown,
  normalizeItem: (value: unknown) => NormalizedItem | null
): readonly NormalizedItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const normalizedItem = normalizeItem(item);

    return normalizedItem === null ? [] : [normalizedItem];
  });
};

const normalizeEmailAnalysis = (value: unknown): EmailAnalysis => {
  if (!isRecord(value)) {
    return createParseFailureEmailAnalysis('AI response was not a JSON object.');
  }

  const suggestedCalendarEvent = normalizeSuggestedCalendarEvent(
    readAnalysisField(value, 'suggestedCalendarEvent')
  );
  const suggestedLabel = normalizeSuggestedLabel(readAnalysisField(value, 'suggestedLabel'));

  return {
    explicitActionItems: normalizeObjectArray(
      readAnalysisField(value, 'explicitActionItems'),
      normalizeExplicitActionItem
    ),
    followUpRecommendation: normalizeFollowUpRecommendation(
      readAnalysisField(value, 'followUpRecommendation')
    ),
    overallConfidence: normalizeConfidence(readAnalysisField(value, 'overallConfidence')),
    risksAndAmbiguities: normalizeStringArray(
      readAnalysisField(value, 'risksAndAmbiguities'),
      analysisTextMaximumLength
    ),
    suggestedReplyPoints: normalizeStringArray(
      readAnalysisField(value, 'suggestedReplyPoints'),
      analysisTextMaximumLength
    ),
    summary: safeText(value.summary, analysisTextMaximumLength),
    thingsToConsider: normalizeObjectArray(
      readAnalysisField(value, 'thingsToConsider'),
      normalizeThingToConsider
    ),
    ...(suggestedCalendarEvent ? { suggestedCalendarEvent } : {}),
    ...(suggestedLabel ? { suggestedLabel } : {}),
  };
};

export const normalizeConfidence = (value: unknown): Confidence => {
  if (typeof value !== 'string') {
    return 'low';
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === 'high' || normalizedValue === 'medium' || normalizedValue === 'low') {
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
      shouldFollowUp: false,
    },
    risksAndAmbiguities: [failureReason],
    summary: parseFailureSummary,
  };
};

export const stripMarkdownCodeFences = (raw: string): string => {
  const trimmedRaw = raw.trim();
  const fencedJsonMatch = trimmedRaw.match(/^```[A-Za-z0-9_-]*\s*([\s\S]*?)\s*```$/);

  return fencedJsonMatch?.[1]?.trim() ?? trimmedRaw;
};

export const parseGeminiAnalysis = (raw: string): EmailAnalysis => {
  try {
    const parsedValue = JSON.parse(stripMarkdownCodeFences(raw)) as unknown;

    return normalizeEmailAnalysis(parsedValue);
  } catch (_error: unknown) {
    return createParseFailureEmailAnalysis('AI response was not valid JSON.');
  }
};
