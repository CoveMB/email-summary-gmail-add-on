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

const parseFailureSummary = 'Analysis could not be parsed.';
const parseFailureFallbackReason = 'Parser returned fallback analysis.';
const safeReasonMaximumLength = 500;
const analysisTextMaximumLength = 1000;
const labelNameMaximumLength = 80;
const sourceMessageIdMaximumLength = 200;

type UnknownRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readField = (
  record: UnknownRecord,
  camelCaseFieldName: string,
  snakeCaseFieldName: string
): unknown => record[camelCaseFieldName] ?? record[snakeCaseFieldName];

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

const normalizeExplicitActionItem = (value: unknown): ExplicitActionItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const dueDateIso = safeText(
    readField(value, 'dueDateIso', 'due_date_iso'),
    analysisTextMaximumLength
  );
  const sourceMessageIds = normalizeStringArray(
    readField(value, 'sourceMessageIds', 'source_message_ids'),
    sourceMessageIdMaximumLength
  );

  return {
    confidence: normalizeConfidence(value.confidence),
    description: safeText(value.description, analysisTextMaximumLength),
    owner: normalizeActionOwner(value.owner),
    ...(dueDateIso.length > 0 ? { dueDateIso } : {}),
    ...(sourceMessageIds.length > 0 ? { sourceMessageIds } : {}),
  };
};

const normalizeThingToConsider = (value: unknown): ThingToConsider | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sourceMessageIds = normalizeStringArray(
    readField(value, 'sourceMessageIds', 'source_message_ids'),
    sourceMessageIdMaximumLength
  );

  return {
    confidence: normalizeConfidence(value.confidence),
    description: safeText(value.description, analysisTextMaximumLength),
    ...(sourceMessageIds.length > 0 ? { sourceMessageIds } : {}),
  };
};

const normalizeSuggestedCalendarEvent = (value: unknown): SuggestedCalendarEvent | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const description = safeText(value.description, analysisTextMaximumLength);
  const endDateTimeIso = safeText(
    readField(value, 'endDateTimeIso', 'end_date_time_iso'),
    analysisTextMaximumLength
  );
  const location = safeText(value.location, analysisTextMaximumLength);
  const startDateTimeIso = safeText(
    readField(value, 'startDateTimeIso', 'start_date_time_iso'),
    analysisTextMaximumLength
  );

  return {
    confidence: normalizeConfidence(value.confidence),
    title: safeText(value.title, analysisTextMaximumLength),
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

  return {
    confidence: normalizeConfidence(value.confidence),
    name: safeText(value.name, labelNameMaximumLength),
    reason: safeText(value.reason, analysisTextMaximumLength),
  };
};

const normalizeFollowUpRecommendation = (value: unknown): FollowUpRecommendation => {
  if (!isRecord(value)) {
    return createEmptyFollowUpRecommendation();
  }

  const followUpDateIso = safeText(
    readField(value, 'followUpDateIso', 'follow_up_date_iso'),
    analysisTextMaximumLength
  );

  return {
    confidence: normalizeConfidence(value.confidence),
    reason: safeText(value.reason, analysisTextMaximumLength),
    shouldFollowUp: readField(value, 'shouldFollowUp', 'should_follow_up') === true,
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
    readField(value, 'suggestedCalendarEvent', 'suggested_calendar_event')
  );
  const suggestedLabel = normalizeSuggestedLabel(
    readField(value, 'suggestedLabel', 'suggested_label')
  );

  return {
    explicitActionItems: normalizeObjectArray(
      readField(value, 'explicitActionItems', 'explicit_action_items'),
      normalizeExplicitActionItem
    ),
    followUpRecommendation: normalizeFollowUpRecommendation(
      readField(value, 'followUpRecommendation', 'follow_up_recommendation')
    ),
    overallConfidence: normalizeConfidence(
      readField(value, 'overallConfidence', 'overall_confidence')
    ),
    risksAndAmbiguities: normalizeStringArray(
      readField(value, 'risksAndAmbiguities', 'risks_and_ambiguities'),
      analysisTextMaximumLength
    ),
    suggestedReplyPoints: normalizeStringArray(
      readField(value, 'suggestedReplyPoints', 'suggested_reply_points'),
      analysisTextMaximumLength
    ),
    summary: safeText(value.summary, analysisTextMaximumLength),
    thingsToConsider: normalizeObjectArray(
      readField(value, 'thingsToConsider', 'things_to_consider'),
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
