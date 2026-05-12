import type {
  CleanThreadText,
  DraftReplyErrorKind,
  EmailAnalysis,
  ThreadData,
  ThreadSummaryErrorKind,
} from '../../types/types';

export type GeminiAnalysisParseLogDetails = Readonly<{
  isJsonObject: boolean;
  rawCharacterCount: number;
  sanitizedTopLevelFields: readonly string[];
  startsWithMarkdownFence: boolean;
  unsafeRaw?: string;
  wasValidJson: boolean;
}>;

export type SummaryPipelineLogDetails = Readonly<{
  geminiMode: 'mock' | 'real';
  maximumMessageCount: number;
  maximumThreadCharacterCount: number;
}>;

export type ThreadReadLogDetails = Readonly<{
  latestBodyPreviewCharacterCount: number;
  messageCount: number;
}>;

export type CleanThreadLogDetails = Readonly<{
  includedMessageCount: number;
  originalMessageCount: number;
  textCharacterCount: number;
  wasTruncated: boolean;
}>;

export type EmailAnalysisLogDetails = Readonly<{
  explicitActionItemCount: number;
  hasSuggestedLabel: boolean;
  overallConfidence: EmailAnalysis['overallConfidence'];
  riskOrAmbiguityCount: number;
  shouldFollowUp: EmailAnalysis['followUpRecommendation']['shouldFollowUp'];
  socialToneConfidence: EmailAnalysis['socialTone']['confidence'];
  socialToneUrgencyOrPressure: EmailAnalysis['socialTone']['urgencyOrPressure'];
  suggestedReplyPointCount: number;
  thingToConsiderCount: number;
}>;

export type GeminiRequestLogDetails = Readonly<{
  maxOutputTokens: number;
  model: string;
  promptCharacterCount: number;
  temperature: number;
}>;

export type GeminiResponseLogDetails = Readonly<{
  modelTextCharacterCount: number;
  responseBodyCharacterCount: number;
  responseCode: number;
}>;

export type SummaryFailureLogDetails = Readonly<{
  errorKind: ThreadSummaryErrorKind;
}>;

export type GeminiRequestFailureLogDetails = Readonly<{
  responseCode: number;
}>;

export type GeminiRequestExceptionLogDetails = Readonly<{
  errorKind: 'fetch_exception';
}>;

export type GeminiResponseUnusableLogDetails = Readonly<{
  responseBodyCharacterCount: number;
  responseCode: number;
}>;

export type DraftReplyLogDetails = Readonly<{
  draftReplyBodyCharacterCount: number;
}>;

export type DraftReplyFailureLogDetails = Readonly<{
  errorKind: DraftReplyErrorKind;
}>;

export type SummaryLogDetailsByEventName = Readonly<{
  draft_reply_created: DraftReplyLogDetails;
  draft_reply_creation_failed: DraftReplyFailureLogDetails;
  draft_reply_creation_started: DraftReplyLogDetails;
  gemini_mock_response_used: GeminiRequestLogDetails;
  gemini_request_exception: GeminiRequestExceptionLogDetails;
  gemini_request_failed: GeminiRequestFailureLogDetails;
  gemini_request_started: GeminiRequestLogDetails;
  gemini_response_received: GeminiResponseLogDetails;
  gemini_response_unusable: GeminiResponseUnusableLogDetails;
  summary_completed: EmailAnalysisLogDetails;
  summary_failed: SummaryFailureLogDetails;
  summary_parse_failure: GeminiAnalysisParseLogDetails;
  summary_started: SummaryPipelineLogDetails;
  summary_thread_cleaned: CleanThreadLogDetails;
  summary_thread_read_completed: ThreadReadLogDetails;
}>;

export type SummaryLogEventName = keyof SummaryLogDetailsByEventName;

export type SummaryLogBuilderInputs = Readonly<{
  cleanThread: CleanThreadText;
  emailAnalysis: EmailAnalysis;
  threadData: ThreadData;
}>;
