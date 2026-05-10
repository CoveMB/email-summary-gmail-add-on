import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildCreateDraftReplyAction,
  buildCreateDraftReplyResponse,
  buildDraftReplyBody,
  createDraftReplyFunctionName,
  DraftReplyError,
} from '../src/domain/Actions';
import { draftReviewReminder, noStrongDraftSuggestionMessage } from '../src/domain/DraftReplyCopy';
import type { ComposeActionResponseModel } from './helpers/card-service-test-helpers';
import {
  installCardServiceMock,
  uninstallCardServiceMock,
} from './helpers/card-service-test-helpers';
import {
  buildDefaultAddonEventWithGmailContext,
  defaultGmailAccessToken,
  defaultGmailMessageId,
  installGmailAppMock,
  uninstallGmailAppMock,
} from './helpers/gmail-test-helpers';

const buildDraftReplyMessageMock = (
  createDraftReply: (draftReplyBody: string) => GoogleAppsScript.Gmail.GmailDraft
): GoogleAppsScript.Gmail.GmailMessage =>
  ({
    createDraftReply,
  }) as GoogleAppsScript.Gmail.GmailMessage;

const buildDraftReplyResponseEvent = (draftReplyBody: string) => ({
  ...buildDefaultAddonEventWithGmailContext(),
  parameters: {
    draftReplyBody,
  },
});

const buildGmailDraftMock = (): GoogleAppsScript.Gmail.GmailDraft =>
  ({ id: 'draft-123' }) as unknown as GoogleAppsScript.Gmail.GmailDraft;

const installDraftReplyGmailMock = (
  createDraftReply: (draftReplyBody: string) => GoogleAppsScript.Gmail.GmailDraft
) => installGmailAppMock(buildDraftReplyMessageMock(createDraftReply));

const expectDraftReplyErrorKind = (
  buildDraftReplyResponse: () => GoogleAppsScript.Card_Service.ComposeActionResponse,
  expectedKind: DraftReplyError['kind']
): Error => {
  let draftReplyError: unknown;

  try {
    buildDraftReplyResponse();
  } catch (error: unknown) {
    draftReplyError = error;
  }

  expect(draftReplyError).toBeInstanceOf(DraftReplyError);
  expect((draftReplyError as DraftReplyError).kind).toBe(expectedKind);

  return draftReplyError as Error;
};

afterEach(() => {
  uninstallCardServiceMock();
  uninstallGmailAppMock();
  vi.restoreAllMocks();
});

describe('buildDraftReplyBody', () => {
  it('builds a concise editable draft from suggested reply points', () => {
    const draftReplyBody = buildDraftReplyBody([
      'Confirm the timeline.',
      'Ask whether Friday still works.',
    ]);

    expect(draftReplyBody).toContain('Hi,');
    expect(draftReplyBody).toContain('- Confirm the timeline.');
    expect(draftReplyBody).toContain('- Ask whether Friday still works.');
    expect(draftReplyBody).toContain('Best,');
    expect(draftReplyBody).toContain(draftReviewReminder);
  });

  it('uses a safe fallback when no useful reply points exist', () => {
    const draftReplyBody = buildDraftReplyBody(['   ']);

    expect(draftReplyBody).toContain(noStrongDraftSuggestionMessage);
    expect(draftReplyBody).not.toContain('I will');
    expect(draftReplyBody).not.toContain('follow up');
  });

  it('drops commitment-heavy reply points while keeping reviewable wording', () => {
    const draftReplyBody = buildDraftReplyBody([
      'I will send the signed agreement by Friday.',
      'Confirm whether Friday is still the right deadline.',
      'Could you clarify who owns approval?',
    ]);

    expect(draftReplyBody).not.toContain('I will send');
    expect(draftReplyBody).toContain('- Confirm whether Friday is still the right deadline.');
    expect(draftReplyBody).toContain('- Could you clarify who owns approval?');
  });

  it('keeps the draft body bounded', () => {
    const longReplyPoint = 'x'.repeat(300);
    const draftReplyBody = buildDraftReplyBody([
      longReplyPoint,
      'Second point.',
      'Third point.',
      'Fourth point should be dropped.',
    ]);

    expect(draftReplyBody).toContain(`- ${'x'.repeat(160)}`);
    expect(draftReplyBody).toContain('- Second point.');
    expect(draftReplyBody).toContain('- Third point.');
    expect(draftReplyBody).not.toContain('Fourth point should be dropped.');
  });
});

describe('buildCreateDraftReplyAction', () => {
  beforeEach(() => {
    installCardServiceMock();
  });

  it('stores a bounded reviewable draft body in action parameters', () => {
    const action = buildCreateDraftReplyAction(['Confirm the timeline.']) as unknown as {
      functionName: string;
      parameters: Readonly<Record<string, string>>;
    };

    expect(action.functionName).toBe(createDraftReplyFunctionName);
    expect(action.parameters.draftReplyBody).toContain('- Confirm the timeline.');
    expect(action.parameters.draftReplyBody).toContain(draftReviewReminder);
  });
});

describe('buildCreateDraftReplyResponse', () => {
  beforeEach(() => {
    installCardServiceMock();
  });

  it('creates a user-reviewed draft reply from normalized action parameters', () => {
    const gmailDraft = buildGmailDraftMock();
    const createDraftReply = vi.fn((): GoogleAppsScript.Gmail.GmailDraft => gmailDraft);
    const gmailAppMock = installDraftReplyGmailMock(createDraftReply);
    const response = buildCreateDraftReplyResponse(
      buildDraftReplyResponseEvent('  Draft body for user review.  ')
    ) as unknown as ComposeActionResponseModel;

    expect(gmailAppMock.setCurrentMessageAccessToken).toHaveBeenCalledWith(defaultGmailAccessToken);
    expect(gmailAppMock.getMessageById).toHaveBeenCalledWith(defaultGmailMessageId);
    expect(createDraftReply).toHaveBeenCalledWith('Draft body for user review.');
    expect(response.draft).toBe(gmailDraft);
  });

  it('uses safe fallback body when action parameters are empty', () => {
    const gmailDraft = buildGmailDraftMock();
    const createDraftReply = vi.fn((): GoogleAppsScript.Gmail.GmailDraft => gmailDraft);
    installDraftReplyGmailMock(createDraftReply);

    buildCreateDraftReplyResponse(buildDraftReplyResponseEvent('   '));

    expect(createDraftReply).toHaveBeenCalledWith(
      `${noStrongDraftSuggestionMessage}\n\n${draftReviewReminder}`
    );
  });

  it('maps missing Gmail context to a draft-specific error', () => {
    expectDraftReplyErrorKind(() => buildCreateDraftReplyResponse({}), 'missing_gmail_context');
  });

  it('maps Gmail draft failures to a safe draft error', () => {
    installDraftReplyGmailMock((): GoogleAppsScript.Gmail.GmailDraft => {
      throw new Error('raw gmail failure with private content');
    });

    const error = expectDraftReplyErrorKind(
      () => buildCreateDraftReplyResponse(buildDefaultAddonEventWithGmailContext()),
      'draft_creation_failed'
    );

    expect(error.message).not.toContain('private content');
  });
});
