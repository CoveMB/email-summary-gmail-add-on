import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CardModel } from './helpers/card-service-test-helpers';
import { readCardText, uninstallCardServiceMock } from './helpers/card-service-test-helpers';
import {
  buildDefaultAddonEventWithGmailContext,
  buildGmailMessageMock,
  buildGmailThreadMock,
  defaultGmailAccessToken,
  defaultGmailMessageId,
  installGmailAppMock,
  uninstallGmailAppMock,
} from './helpers/gmail-test-helpers';
import { importWithCardService, mockGeminiModeProperties } from './helpers/module-test-helpers';
import { uninstallScriptPropertiesMock } from './helpers/script-properties-test-helpers';

type CodeModule = typeof import('../src/Code');

const importCode = async (): Promise<CodeModule> => {
  return importWithCardService(mockGeminiModeProperties, () => import('../src/Code'));
};

afterEach(() => {
  uninstallCardServiceMock();
  uninstallGmailAppMock();
  uninstallScriptPropertiesMock();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Apps Script entry points', () => {
  it('registers required global entry points when loaded', async () => {
    await importCode();

    expect(globalThis.buildHomePage).toBeTypeOf('function');
    expect(globalThis.buildGmailContextualCard).toBeTypeOf('function');
    expect(globalThis.buildThreadSummaryCard).toBeTypeOf('function');
  });
});

describe('buildThreadSummaryCard', () => {
  it('summarizes the opened thread after explicit action using the mock Gemini pipeline', async () => {
    const forbiddenBodyAccessTrap = vi.fn((): string => {
      throw new Error('HTML body must not be read.');
    });
    const plainBodyReader = vi.fn((): string => 'Please confirm whether Friday still works.');
    const threadMessages: GoogleAppsScript.Gmail.GmailMessage[] = [];
    const gmailThread = buildGmailThreadMock('thread-123', threadMessages);
    const openedMessage = buildGmailMessageMock({
      date: new Date('2026-05-06T12:00:00.000Z'),
      forbiddenBodyAccessTrap,
      from: 'sender@example.com',
      getThread: () => gmailThread,
      plainBodyReader,
      subject: 'Project update',
      to: 'recipient@example.com',
    });
    threadMessages.push(openedMessage);
    const gmailAppMock = installGmailAppMock(openedMessage);
    const { buildThreadSummaryCard } = await importCode();

    const card = buildThreadSummaryCard(
      buildDefaultAddonEventWithGmailContext()
    ) as unknown as CardModel;
    const cardText = readCardText(card);

    expect(gmailAppMock.setCurrentMessageAccessToken).toHaveBeenCalledWith(defaultGmailAccessToken);
    expect(gmailAppMock.getMessageById).toHaveBeenCalledWith(defaultGmailMessageId);
    expect(forbiddenBodyAccessTrap).not.toHaveBeenCalled();
    expect(plainBodyReader).toHaveBeenCalledOnce();
    expect(card.header?.subtitle).toBe('Mock thread summary');
    expect(cardText).toContain('EmailSummary mock analysis response.');
  });

  it('returns a user-safe error card when Gmail context is missing', async () => {
    const { buildThreadSummaryCard } = await importCode();

    const card = buildThreadSummaryCard({}) as unknown as CardModel;

    expect(card.header?.subtitle).toBe('No Gmail thread open');
    expect(readCardText(card)).toContain('Open a Gmail thread, then run EmailSummary');
  });
});
