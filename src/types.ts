export type AppConfig = Readonly<{
  APP_NAME: string;
  GEMINI_MODEL: string;
  MAX_MESSAGES: number;
  MAX_THREAD_CHARS: number;
  USE_MOCK_GEMINI: boolean;
}>;

export type Confidence = 'low' | 'medium' | 'high';

export type ThreadMessage = Readonly<{
  bodyText: string;
  from: string;
  sentAtIso: string;
  subject: string;
}>;

export type EmailAnalysis = Readonly<{
  actionItems: readonly string[];
  calendarEventSuggestion: string | null;
  confidence: Confidence;
  followUpRecommendation: string | null;
  risksAndAmbiguities: readonly string[];
  suggestedLabel: string | null;
  suggestedReplyPoints: readonly string[];
  summary: string;
  thingsToConsider: readonly string[];
}>;
