import type { DraftReplyErrorKind } from '../types/types';

export const createDraftReplyButtonText = 'Create draft reply';
export const noStrongDraftSuggestionMessage = 'No strong draft suggestion available.';
export const draftReviewReminder = '[Review and edit before sending. This draft was not sent.]';

export const draftReplyErrorMessages = {
  draft_creation_failed: 'EmailSummary could not create a draft reply. Please try again.',
  missing_gmail_context: 'Open a Gmail message before creating a draft reply.',
} as const satisfies Readonly<Record<DraftReplyErrorKind, string>>;
