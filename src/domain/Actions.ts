import type { AddonEvent, DraftReplyErrorKind } from '../types/types';
import { buildDraftReplyLogDetails, writeSummaryLogEvent } from '../utils/log/SummaryLog';
import {
  draftReplyErrorMessages,
  draftReviewReminder,
  noStrongDraftSuggestionMessage,
} from './DraftReplyCopy';
import {
  getCurrentGmailContext,
  missingGmailContextMessage,
  type CurrentGmailContext,
} from './GmailReader';

export const createDraftReplyFunctionName = 'buildCreateDraftReplyResponse';

const draftReplyBodyParameterName = 'draftReplyBody';
const maxDraftReplyPoints = 3;
const maxDraftReplyPointCharacters = 160;
const maxDraftReplyBodyCharacters = 700;

const commitmentHeavyDraftPointPatterns = [
  /\b(?:i|we)\s+(?:will|promise|guarantee|shall)\b/i,
  /\b(?:i|we)\s+(?:commit|committed)\s+to\b/i,
  /\b(?:i|we)\s+(?:can|could)\s+guarantee\b/i,
  /\b(?:i|we)(?:'ll|’ll)\b/i,
  /\b(?:i\s+am|we\s+are)\s+going\s+to\b/i,
] as const;
const reviewableDraftPointPattern =
  /^(?:ask|check|clarify|confirm|consider|mention|note|propose|suggest|verify)\b/i;

export class DraftReplyError extends Error {
  public constructor(public readonly kind: DraftReplyErrorKind) {
    super(draftReplyErrorMessages[kind]);
    this.name = 'DraftReplyError';
  }
}

const normalizeDraftReplyPoint = (suggestedReplyPoint: string): string =>
  suggestedReplyPoint.trim().slice(0, maxDraftReplyPointCharacters).trim();

const isReviewableDraftReplyPoint = (suggestedReplyPoint: string): boolean =>
  suggestedReplyPoint.endsWith('?') || reviewableDraftPointPattern.test(suggestedReplyPoint);

const isCommitmentHeavyDraftReplyPoint = (suggestedReplyPoint: string): boolean =>
  !isReviewableDraftReplyPoint(suggestedReplyPoint) &&
  commitmentHeavyDraftPointPatterns.some((pattern) => pattern.test(suggestedReplyPoint));

const normalizeDraftReplyPoints = (suggestedReplyPoints: readonly string[]): readonly string[] =>
  suggestedReplyPoints
    .map(normalizeDraftReplyPoint)
    .filter((suggestedReplyPoint) => suggestedReplyPoint.length > 0)
    .filter((suggestedReplyPoint) => !isCommitmentHeavyDraftReplyPoint(suggestedReplyPoint))
    .slice(0, maxDraftReplyPoints);

export const buildDraftReplyBody = (suggestedReplyPoints: readonly string[]): string => {
  const normalizedSuggestedReplyPoints = normalizeDraftReplyPoints(suggestedReplyPoints);

  if (normalizedSuggestedReplyPoints.length === 0) {
    return `${noStrongDraftSuggestionMessage}\n\n${draftReviewReminder}`;
  }

  return [
    'Hi,',
    '',
    ...normalizedSuggestedReplyPoints.map((suggestedReplyPoint) => `- ${suggestedReplyPoint}`),
    '',
    'Best,',
    '',
    draftReviewReminder,
  ].join('\n');
};

const normalizeDraftReplyBody = (draftReplyBody: string | undefined): string =>
  draftReplyBody && draftReplyBody.trim().length > 0
    ? draftReplyBody.slice(0, maxDraftReplyBodyCharacters).trim()
    : buildDraftReplyBody([]);

const getRequiredDraftGmailContext = (event: AddonEvent): CurrentGmailContext => {
  try {
    return getCurrentGmailContext(event);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === missingGmailContextMessage) {
      throw new DraftReplyError('missing_gmail_context');
    }

    throw error;
  }
};

const createDraftReply = (
  gmailContext: CurrentGmailContext,
  draftReplyBody: string
): GoogleAppsScript.Gmail.GmailDraft => {
  GmailApp.setCurrentMessageAccessToken(gmailContext.accessToken);

  return GmailApp.getMessageById(gmailContext.messageId).createDraftReply(draftReplyBody);
};

export const buildCreateDraftReplyAction = (
  suggestedReplyPoints: readonly string[]
): GoogleAppsScript.Card_Service.Action =>
  CardService.newAction()
    .setFunctionName(createDraftReplyFunctionName)
    .setParameters({
      [draftReplyBodyParameterName]: buildDraftReplyBody(suggestedReplyPoints),
    });

export const buildCreateDraftReplyResponse = (
  event: AddonEvent
): GoogleAppsScript.Card_Service.ComposeActionResponse => {
  try {
    const gmailContext = getRequiredDraftGmailContext(event);
    const draftReplyBody = normalizeDraftReplyBody(event.parameters?.[draftReplyBodyParameterName]);
    const draftReplyLogDetails = buildDraftReplyLogDetails(draftReplyBody);
    writeSummaryLogEvent('draft_reply_creation_started', draftReplyLogDetails);

    const draftReply = createDraftReply(gmailContext, draftReplyBody);
    writeSummaryLogEvent('draft_reply_created', draftReplyLogDetails);

    return CardService.newComposeActionResponseBuilder().setGmailDraft(draftReply).build();
  } catch (error: unknown) {
    if (error instanceof DraftReplyError) {
      writeSummaryLogEvent('draft_reply_creation_failed', { errorKind: error.kind });
      throw error;
    }

    writeSummaryLogEvent('draft_reply_creation_failed', { errorKind: 'draft_creation_failed' });
    throw new DraftReplyError('draft_creation_failed');
  }
};
