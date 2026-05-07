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
