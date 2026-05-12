type UnknownRecord = Readonly<Record<string, unknown>>;

export const currentAnalysisSchemaVersion = 'email-summary-analysis-v1';

export const topLevelAnalysisFieldNames = {
  explicitActionItems: {
    external: 'explicit_action_items',
    internal: 'explicitActionItems',
  },
  followUpRecommendation: {
    external: 'follow_up_recommendation',
    internal: 'followUpRecommendation',
  },
  overallConfidence: {
    external: 'overall_confidence',
    internal: 'overallConfidence',
  },
  risksAndAmbiguities: {
    external: 'risks_and_ambiguities',
    internal: 'risksAndAmbiguities',
  },
  schemaVersion: {
    external: 'schema_version',
    internal: 'schemaVersion',
  },
  socialTone: {
    external: 'social_tone',
    internal: 'socialTone',
  },
  summary: {
    external: 'summary',
    internal: 'summary',
  },
  suggestedLabel: {
    external: 'suggested_label',
    internal: 'suggestedLabel',
  },
  suggestedReplyPoints: {
    external: 'suggested_reply_points',
    internal: 'suggestedReplyPoints',
  },
  thingsToConsider: {
    external: 'things_to_consider',
    internal: 'thingsToConsider',
  },
} as const;

export const explicitActionItemFieldNames = {
  dueDateIso: {
    external: 'due_date_iso',
    internal: 'dueDateIso',
  },
} as const;

export const followUpRecommendationFieldNames = {
  followUpDateIso: {
    external: 'follow_up_date_iso',
    internal: 'followUpDateIso',
  },
  shouldFollowUp: {
    external: 'should_follow_up',
    internal: 'shouldFollowUp',
  },
} as const;

export const socialToneAnalysisFieldNames = {
  socialToneApparentTone: {
    external: 'apparent_tone',
    internal: 'apparentTone',
  },
  socialToneCautions: {
    external: 'cautions',
    internal: 'cautions',
  },
  socialToneEvidence: {
    external: 'evidence',
    internal: 'evidence',
  },
  socialTonePossibleSenderState: {
    external: 'possible_sender_state',
    internal: 'possibleSenderState',
  },
  socialToneRelationalStance: {
    external: 'relational_stance',
    internal: 'relationalStance',
  },
  socialToneSocialSignals: {
    external: 'social_signals',
    internal: 'socialSignals',
  },
  socialToneSummary: {
    external: 'summary',
    internal: 'summary',
  },
  socialToneUrgencyOrPressure: {
    external: 'urgency_or_pressure',
    internal: 'urgencyOrPressure',
  },
} as const;

export const evidenceFieldNames = {
  sourceMessageIds: {
    external: 'source_message_ids',
    internal: 'sourceMessageIds',
  },
} as const;

export const analysisFieldNames = {
  ...topLevelAnalysisFieldNames,
  ...explicitActionItemFieldNames,
  ...followUpRecommendationFieldNames,
  ...socialToneAnalysisFieldNames,
  ...evidenceFieldNames,
} as const;

export type AnalysisFieldName = keyof typeof analysisFieldNames;
export type TopLevelAnalysisFieldName = keyof typeof topLevelAnalysisFieldNames;

export const requiredAnalysisFieldNames = [
  'schemaVersion',
  'summary',
  'explicitActionItems',
  'followUpRecommendation',
  'overallConfidence',
  'risksAndAmbiguities',
  'suggestedReplyPoints',
  'socialTone',
  'thingsToConsider',
] as const satisfies readonly TopLevelAnalysisFieldName[];

export const cardSectionTitles = {
  communicationCues: 'Communication cues',
  explicitActionItems: 'Explicit action items',
  followUp: 'Follow-up',
  reviewNotes: 'Review notes',
  risksAndAmbiguities: 'Risks / ambiguities',
  sourceMessages: 'Source messages',
  suggestedLabel: 'Suggested label',
  suggestedReplyPoints: 'Suggested reply points',
  summary: 'Summary',
  thingsToConsider: 'Things to consider / think about',
  truncationNotice: 'Truncation notice',
} as const;

export const readAnalysisField = (record: UnknownRecord, fieldName: AnalysisFieldName): unknown => {
  const fieldNames = analysisFieldNames[fieldName];

  return record[fieldNames.internal] ?? record[fieldNames.external];
};
