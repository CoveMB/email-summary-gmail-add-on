import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getCurrentThreadData,
  missingGmailContextMessage,
  truncateForPreview,
} from '../src/domain/GmailReader';
import {
  buildAddonEventWithGmailContext,
  buildAddonEventWithMessageId,
  buildGmailMessageMock,
  buildGmailThreadMock,
  installGmailAppMock,
  uninstallGmailAppMock,
} from './helpers/gmail-test-helpers';

afterEach(() => {
  uninstallGmailAppMock();
  vi.restoreAllMocks();
});

describe('truncateForPreview', () => {
  it('keeps text unchanged when it fits within the limit', () => {
    expect(truncateForPreview('Short preview', 300)).toBe('Short preview');
  });

  it('truncates long text and keeps the final preview within max characters', () => {
    const preview = truncateForPreview('1234567890', 7);

    expect(preview).toBe('1234...');
    expect(preview).toHaveLength(7);
  });

  it('handles very small limits without exceeding them', () => {
    expect(truncateForPreview('abcdef', 3)).toBe('abc');
    expect(truncateForPreview('abcdef', 0)).toBe('');
  });
});

describe('getCurrentThreadData', () => {
  it('requires Gmail event context before using GmailApp', () => {
    expect(() => {
      getCurrentThreadData({});
    }).toThrow(missingGmailContextMessage);
  });

  it('requires Gmail access token before using GmailApp', () => {
    expect(() => {
      getCurrentThreadData(buildAddonEventWithMessageId('message-123'));
    }).toThrow(missingGmailContextMessage);
  });

  it('requires opened Gmail message id before using GmailApp', () => {
    expect(() => {
      getCurrentThreadData(buildAddonEventWithGmailContext('access-token-123', ''));
    }).toThrow(missingGmailContextMessage);
  });

  it('returns structured thread data and reads only plain bodies', () => {
    const olderDate = new Date('2026-05-06T12:00:00.000Z');
    const latestDate = new Date('2026-05-06T15:30:00.000Z');
    const forbiddenBodyAccessTrap = vi.fn((): string => {
      throw new Error('Only plain bodies may be read.');
    });
    const olderPlainBodyReader = vi.fn((): string => 'Older full plain body.');
    const latestPlainBodyReader = vi.fn((): string => `${'a'.repeat(310)} latest trailing text`);

    const threadMessages: GoogleAppsScript.Gmail.GmailMessage[] = [];
    const gmailThread = buildGmailThreadMock('thread-123', threadMessages);

    const openedMessage = buildGmailMessageMock({
      date: olderDate,
      forbiddenBodyAccessTrap,
      from: 'first.sender@example.com',
      getThread: () => gmailThread,
      plainBodyReader: olderPlainBodyReader,
      subject: 'Project update',
      to: 'recipient@example.com',
    });

    const latestMessage = buildGmailMessageMock({
      date: latestDate,
      forbiddenBodyAccessTrap,
      from: 'latest.sender@example.com',
      getThread: () => gmailThread,
      plainBodyReader: latestPlainBodyReader,
      subject: 'Project update',
      to: 'recipient@example.com, second.recipient@example.com',
    });

    threadMessages.push(openedMessage, latestMessage);

    const gmailAppMock = installGmailAppMock(openedMessage);
    const threadData = getCurrentThreadData(
      buildAddonEventWithGmailContext('access-token-123', 'message-123')
    );

    expect(gmailAppMock.setCurrentMessageAccessToken).toHaveBeenCalledWith('access-token-123');
    expect(gmailAppMock.getMessageById).toHaveBeenCalledWith('message-123');
    expect(forbiddenBodyAccessTrap).not.toHaveBeenCalled();
    expect(olderPlainBodyReader).toHaveBeenCalledOnce();
    expect(latestPlainBodyReader).toHaveBeenCalledOnce();
    expect(threadData).toEqual({
      latestBodyPreview: `${'a'.repeat(297)}...`,
      latestDateIso: '2026-05-06T15:30:00.000Z',
      latestSender: 'latest.sender@example.com',
      messages: [
        {
          dateIso: '2026-05-06T12:00:00.000Z',
          from: 'first.sender@example.com',
          plainBody: 'Older full plain body.',
          subject: 'Project update',
          to: 'recipient@example.com',
        },
        {
          dateIso: '2026-05-06T15:30:00.000Z',
          from: 'latest.sender@example.com',
          plainBody: `${'a'.repeat(310)} latest trailing text`,
          subject: 'Project update',
          to: 'recipient@example.com, second.recipient@example.com',
        },
      ],
      messageCount: 2,
      openedMessageId: 'message-123',
      subject: 'Project update',
      threadId: 'thread-123',
    });
  });

  it('throws a user-safe error when the opened thread has no messages', () => {
    const forbiddenBodyAccessTrap = vi.fn((): string => {
      throw new Error('Only plain body preview may be read.');
    });
    const plainBodyReader = vi.fn((): string => 'Body must not be read for empty thread.');
    const gmailThread = buildGmailThreadMock('empty-thread-123', []);
    const openedMessage = buildGmailMessageMock({
      date: new Date('2026-05-06T12:00:00.000Z'),
      forbiddenBodyAccessTrap,
      from: 'sender@example.com',
      getThread: () => gmailThread,
      plainBodyReader,
      subject: 'Empty thread',
      to: 'recipient@example.com',
    });

    installGmailAppMock(openedMessage);

    expect(() => {
      getCurrentThreadData(buildAddonEventWithGmailContext('access-token-123', 'message-123'));
    }).toThrow('The opened Gmail thread has no messages to read.');
    expect(forbiddenBodyAccessTrap).not.toHaveBeenCalled();
    expect(plainBodyReader).not.toHaveBeenCalled();
  });
});
