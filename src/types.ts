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
  bodyText: string;
  from: string;
  messageId: string;
  sentAtIso: string;
  subject: string;
  to: readonly string[];
}>;

export type ThreadData = Readonly<{
  messages: readonly ThreadMessage[];
  subject: string;
  threadId: string;
}>;

export type ThreadDebugSummary = Readonly<{
  messageCount: number;
  threadId: string | null;
  totalBodyCharacters: number;
  wasTruncated: boolean;
}>;
