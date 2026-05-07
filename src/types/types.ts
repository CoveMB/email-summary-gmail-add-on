export type AppConfig = Readonly<{
  APP_NAME: string;
  GEMINI_MODEL: string;
  MAX_MESSAGES: number;
  MAX_THREAD_CHARS: number;
  USE_MOCK_GEMINI: boolean;
}>;

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

export type ThreadMessage = Readonly<{
  dateIso: string;
  from: string;
  plainBody: string;
  subject: string;
  to: string;
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
  text: string;
  wasTruncated: boolean;
}>;

export type CleanThreadTextOptions = Readonly<{
  maxChars?: number;
  maxMessages?: number;
}>;

export type Confidence = 'high' | 'medium' | 'low';

export type ActionOwner = 'recipient' | 'sender' | 'third_party' | 'unclear';

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

export type SuggestedCalendarEvent = Readonly<{
  title: string;
  confidence: Confidence;
  description?: string;
  endDateTimeIso?: string;
  location?: string;
  startDateTimeIso?: string;
}>;

export type SuggestedLabel = Readonly<{
  name: string;
  confidence: Confidence;
  reason: string;
}>;

export type FollowUpRecommendation = Readonly<{
  shouldFollowUp: boolean;
  confidence: Confidence;
  reason: string;
  followUpDateIso?: string;
}>;

export type EmailAnalysis = Readonly<{
  summary: string;
  explicitActionItems: readonly ExplicitActionItem[];
  thingsToConsider: readonly ThingToConsider[];
  suggestedReplyPoints: readonly string[];
  suggestedCalendarEvent?: SuggestedCalendarEvent;
  suggestedLabel?: SuggestedLabel;
  followUpRecommendation: FollowUpRecommendation;
  risksAndAmbiguities: readonly string[];
  overallConfidence: Confidence;
}>;
