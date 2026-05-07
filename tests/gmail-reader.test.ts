import { afterEach, describe, expect, it, vi } from 'vitest';

import { assertHasGmailContext, getCurrentThreadData } from '../src/GmailReader';
import type { AddonEvent } from '../src/types';

const missingGmailContextMessage =
  'This add-on needs an opened Gmail thread before it can summarize.';

const buildAddonEventWithMessageId = (messageId: string): AddonEvent => ({
  gmail: {
    messageId,
  },
});

const buildAddonEventWithGmailContext = (accessToken: string, messageId: string): AddonEvent => ({
  gmail: {
    accessToken,
    messageId,
  },
});

type GmailMessageMetadata = Readonly<{
  bodyAccessTrap: () => string;
  date: Date;
  from: string;
  getThread: () => GoogleAppsScript.Gmail.GmailThread;
  subject: string;
}>;

type GmailAppMock = Pick<typeof GmailApp, 'getMessageById' | 'setCurrentMessageAccessToken'>;

const buildGmailMessageMock = (
  metadata: GmailMessageMetadata
): GoogleAppsScript.Gmail.GmailMessage =>
  ({
    getBody: metadata.bodyAccessTrap,
    getDate: () => metadata.date,
    getFrom: () => metadata.from,
    getPlainBody: metadata.bodyAccessTrap,
    getRawContent: metadata.bodyAccessTrap,
    getSubject: () => metadata.subject,
    getThread: metadata.getThread,
  }) as GoogleAppsScript.Gmail.GmailMessage;

const buildGmailThreadMock = (
  threadId: string,
  messages: readonly GoogleAppsScript.Gmail.GmailMessage[]
): GoogleAppsScript.Gmail.GmailThread =>
  ({
    getId: () => threadId,
    getMessages: () => [...messages],
  }) as GoogleAppsScript.Gmail.GmailThread;

const installGmailAppMock = (openedMessage: GoogleAppsScript.Gmail.GmailMessage): GmailAppMock => {
  const gmailAppMock: GmailAppMock = {
    getMessageById: vi.fn(
      (_messageId: string): GoogleAppsScript.Gmail.GmailMessage => openedMessage
    ),
    setCurrentMessageAccessToken: vi.fn((_accessToken: string): void => undefined),
  };

  Object.defineProperty(globalThis, 'GmailApp', {
    configurable: true,
    value: gmailAppMock,
  });

  return gmailAppMock;
};

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'GmailApp');
  vi.restoreAllMocks();
});

describe('assertHasGmailContext', () => {
  it('accepts an event with Gmail message context', () => {
    expect(() => {
      assertHasGmailContext(buildAddonEventWithMessageId('message-123'));
    }).not.toThrow();
  });

  it('throws a user-safe error when Gmail context is missing', () => {
    expect(() => {
      assertHasGmailContext({});
    }).toThrow(missingGmailContextMessage);
  });

  it('throws a user-safe error when Gmail message id is empty', () => {
    expect(() => {
      assertHasGmailContext(buildAddonEventWithMessageId(''));
    }).toThrow(missingGmailContextMessage);
  });
});

describe('getCurrentThreadData', () => {
  it('requires Gmail access token before using GmailApp', () => {
    expect(() => {
      getCurrentThreadData(buildAddonEventWithMessageId('message-123'));
    }).toThrow(missingGmailContextMessage);
  });

  it('returns thread metadata without requiring message body access', () => {
    const olderDate = new Date('2026-05-06T12:00:00.000Z');
    const latestDate = new Date('2026-05-06T15:30:00.000Z');
    const bodyAccessTrap = vi.fn((): string => {
      throw new Error('Email body must not be read for metadata.');
    });

    const threadMessages: GoogleAppsScript.Gmail.GmailMessage[] = [];
    const gmailThread = buildGmailThreadMock('thread-123', threadMessages);

    const openedMessage = buildGmailMessageMock({
      bodyAccessTrap,
      date: olderDate,
      from: 'first.sender@example.com',
      getThread: () => gmailThread,
      subject: 'Project update',
    });

    const latestMessage = buildGmailMessageMock({
      bodyAccessTrap,
      date: latestDate,
      from: 'latest.sender@example.com',
      getThread: () => gmailThread,
      subject: 'Project update',
    });

    threadMessages.push(openedMessage, latestMessage);

    const gmailAppMock = installGmailAppMock(openedMessage);
    const threadData = getCurrentThreadData(
      buildAddonEventWithGmailContext('access-token-123', 'message-123')
    );

    expect(gmailAppMock.setCurrentMessageAccessToken).toHaveBeenCalledWith('access-token-123');
    expect(gmailAppMock.getMessageById).toHaveBeenCalledWith('message-123');
    expect(bodyAccessTrap).not.toHaveBeenCalled();
    expect(threadData).toEqual({
      latestDateIso: '2026-05-06T15:30:00.000Z',
      latestSender: 'latest.sender@example.com',
      messageCount: 2,
      subject: 'Project update',
      threadId: 'thread-123',
    });
  });

  it('throws a user-safe error when the opened thread has no messages', () => {
    const bodyAccessTrap = vi.fn((): string => {
      throw new Error('Email body must not be read for metadata.');
    });
    const gmailThread = buildGmailThreadMock('empty-thread-123', []);
    const openedMessage = buildGmailMessageMock({
      bodyAccessTrap,
      date: new Date('2026-05-06T12:00:00.000Z'),
      from: 'sender@example.com',
      getThread: () => gmailThread,
      subject: 'Empty thread',
    });

    installGmailAppMock(openedMessage);

    expect(() => {
      getCurrentThreadData(buildAddonEventWithGmailContext('access-token-123', 'message-123'));
    }).toThrow('The opened Gmail thread has no messages to read.');
    expect(bodyAccessTrap).not.toHaveBeenCalled();
  });
});
