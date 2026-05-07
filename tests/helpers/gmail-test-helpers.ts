import { vi } from 'vitest';

import type { AddonEvent } from '../../src/types/types';

export type GmailMessageMetadata = Readonly<{
  date: Date;
  forbiddenBodyAccessTrap: () => string;
  from: string;
  getThread: () => GoogleAppsScript.Gmail.GmailThread;
  plainBodyReader: () => string;
  subject: string;
  to: string;
}>;

export type GmailAppMock = Pick<typeof GmailApp, 'getMessageById' | 'setCurrentMessageAccessToken'>;

export const buildAddonEventWithMessageId = (messageId: string): AddonEvent => ({
  gmail: {
    messageId,
  },
});

export const buildAddonEventWithGmailContext = (
  accessToken: string,
  messageId: string
): AddonEvent => ({
  gmail: {
    accessToken,
    messageId,
  },
});

export const buildGmailMessageMock = (
  metadata: GmailMessageMetadata
): GoogleAppsScript.Gmail.GmailMessage =>
  ({
    getBody: metadata.forbiddenBodyAccessTrap,
    getDate: () => metadata.date,
    getFrom: () => metadata.from,
    getPlainBody: metadata.plainBodyReader,
    getRawContent: metadata.forbiddenBodyAccessTrap,
    getSubject: () => metadata.subject,
    getThread: metadata.getThread,
    getTo: () => metadata.to,
  }) as GoogleAppsScript.Gmail.GmailMessage;

export const buildGmailThreadMock = (
  threadId: string,
  messages: readonly GoogleAppsScript.Gmail.GmailMessage[]
): GoogleAppsScript.Gmail.GmailThread =>
  ({
    getId: () => threadId,
    getMessages: () => [...messages],
  }) as GoogleAppsScript.Gmail.GmailThread;

export const installGmailAppMock = (
  openedMessage: GoogleAppsScript.Gmail.GmailMessage
): GmailAppMock => {
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

export const uninstallGmailAppMock = (): void => {
  Reflect.deleteProperty(globalThis, 'GmailApp');
};
