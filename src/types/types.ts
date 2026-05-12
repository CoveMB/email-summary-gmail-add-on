export type GmailEventPayload = Readonly<{
  accessToken?: string;
  messageId?: string;
  threadId?: string;
  [fieldName: string]: unknown;
}>;

export type AddonEvent = Readonly<{
  commonEventObject?: unknown;
  formInput?: Readonly<Record<string, unknown>>;
  gmail?: GmailEventPayload | undefined;
  parameters?: Readonly<Record<string, string>>;
  [fieldName: string]: unknown;
}>;

export type DraftReplyErrorKind = 'draft_creation_failed' | 'missing_gmail_context';

export type ThreadMessage = Readonly<{
  dateIso: string;
  from: string;
  id: string;
  plainBody: string;
  subject: string;
  to: string;
}>;

export type CleanThreadSourceMessage = Readonly<{
  dateIso: string;
  from: string;
  isOpenedMessage: boolean;
  sourceMessageId: string;
}>;

export type ThreadData = Readonly<{
  latestBodyPreview: string;
  latestDateIso: string;
  latestSender: string;
  messages: readonly ThreadMessage[];
  messageCount: number;
  openedMessageId: string;
  subject: string;
  threadId: string;
}>;

export type CleanThreadText = Readonly<{
  includedMessageCount: number;
  originalMessageCount: number;
  sourceMessages?: readonly CleanThreadSourceMessage[];
  text: string;
  wasTruncated: boolean;
}>;

export type CleanThreadTextOptions = Readonly<{
  maxChars?: number;
  maxMessages?: number;
}>;

export const confidenceValues = ['high', 'medium', 'low'] as const;
export type Confidence = (typeof confidenceValues)[number];

export const actionOwnerValues = ['recipient', 'sender', 'third_party', 'unclear'] as const;
export type ActionOwner = (typeof actionOwnerValues)[number];

export const urgencyOrPressureValues = ['none', 'low', 'medium', 'high', 'unclear'] as const;
export type UrgencyOrPressure = (typeof urgencyOrPressureValues)[number];

export type ExplicitActionItem = Readonly<{
  description: string;
  owner: ActionOwner;
  confidence: Confidence;
  dueDateIso?: string;
  sourceMessageIds?: readonly string[];
}>;

export type ThingToConsider = Readonly<{
  description: string;
  confidence: Confidence;
  sourceMessageIds?: readonly string[];
}>;

export type SuggestedLabel = Readonly<{
  name: string;
  confidence: Confidence;
  reason: string;
}>;

export type FollowUpRecommendation = Readonly<{
  shouldFollowUp: boolean | null;
  confidence: Confidence;
  reason: string;
  followUpDateIso?: string;
}>;

export type SocialToneAnalysis = Readonly<{
  summary: string;
  apparentTone: readonly string[];
  socialSignals: readonly string[];
  possibleSenderState: string | null;
  relationalStance: string | null;
  urgencyOrPressure: UrgencyOrPressure;
  evidence: string;
  confidence: Confidence;
  cautions: readonly string[];
}>;

export type EmailAnalysisParseMetadata = Readonly<{
  missingFields: readonly string[];
  warnings: readonly string[];
}>;

export type EmailAnalysis = Readonly<{
  summary: string;
  explicitActionItems: readonly ExplicitActionItem[];
  thingsToConsider: readonly ThingToConsider[];
  suggestedReplyPoints: readonly string[];
  suggestedLabel?: SuggestedLabel;
  followUpRecommendation: FollowUpRecommendation;
  socialTone: SocialToneAnalysis;
  risksAndAmbiguities: readonly string[];
  overallConfidence: Confidence;
  parseMetadata?: EmailAnalysisParseMetadata;
  schemaVersion?: string;
}>;

export type ThreadSummaryErrorKind =
  | 'no_gmail_context'
  | 'gmail_read_failure'
  | 'gemini_missing_key'
  | 'gemini_request_failure'
  | 'parse_failure'
  | 'unexpected_failure';

export type UserSafeThreadSummaryError = Readonly<{
  kind: ThreadSummaryErrorKind;
  message: string;
  title: string;
}>;

export type TypeOf =
  | 'undefined'
  | 'object'
  | 'boolean'
  | 'number'
  | 'bigint'
  | 'string'
  | 'symbol'
  | 'function';

export type EnvironmentVariableCastValue<TCastType extends TypeOf> = {
  undefined: undefined;
  object: object;
  boolean: boolean;
  number: number;
  bigint: bigint;
  string: string;
  symbol: symbol;
  function: never;
}[TCastType];
