type UnknownRecord = Readonly<Record<string, unknown>>;

export const analysisFieldNames = {
  dueDateIso: {
    external: 'due_date_iso',
    internal: 'dueDateIso',
  },
  explicitActionItems: {
    external: 'explicit_action_items',
    internal: 'explicitActionItems',
  },
  followUpDateIso: {
    external: 'follow_up_date_iso',
    internal: 'followUpDateIso',
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
  shouldFollowUp: {
    external: 'should_follow_up',
    internal: 'shouldFollowUp',
  },
  socialTone: {
    external: 'social_tone',
    internal: 'socialTone',
  },
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
  sourceMessageIds: {
    external: 'source_message_ids',
    internal: 'sourceMessageIds',
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

export type AnalysisFieldName = keyof typeof analysisFieldNames;

export const readAnalysisField = (record: UnknownRecord, fieldName: AnalysisFieldName): unknown => {
  const fieldNames = analysisFieldNames[fieldName];

  return record[fieldNames.internal] ?? record[fieldNames.external];
};
