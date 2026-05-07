import type { AddonEvent, ThreadData } from './types';
import { isNonEmptyString } from './utils/StringUtils';

const missingGmailContextMessage =
  'This add-on needs an opened Gmail thread before it can summarize.';

const emptyThreadMessage = 'The opened Gmail thread has no messages to read.';

type CurrentGmailContext = Readonly<{
  accessToken: string;
  messageId: string;
}>;

const getCurrentGmailContext = (event: AddonEvent): CurrentGmailContext => {
  assertHasGmailContext(event);

  const accessToken = event.gmail?.accessToken;
  const messageId = event.gmail?.messageId;

  if (!isNonEmptyString(accessToken) || !isNonEmptyString(messageId)) {
    throw new Error(missingGmailContextMessage);
  }

  return {
    accessToken,
    messageId,
  };
};

const getLatestMessage = (
  messages: readonly GoogleAppsScript.Gmail.GmailMessage[]
): GoogleAppsScript.Gmail.GmailMessage => {
  const [firstMessage, ...remainingMessages] = messages;

  if (!firstMessage) throw new Error(emptyThreadMessage);

  return remainingMessages.reduce(
    (latestMessage, currentMessage) =>
      currentMessage.getDate().getTime() > latestMessage.getDate().getTime()
        ? currentMessage
        : latestMessage,
    firstMessage
  );
};

export const assertHasGmailContext = (event: AddonEvent): void => {
  if (!event.gmail) {
    throw new Error(missingGmailContextMessage);
  }

  if (!isNonEmptyString(event.gmail.messageId)) {
    throw new Error(missingGmailContextMessage);
  }
};

export const getCurrentThreadData = (event: AddonEvent): ThreadData => {
  const gmailContext = getCurrentGmailContext(event);

  GmailApp.setCurrentMessageAccessToken(gmailContext.accessToken);

  const openedMessage = GmailApp.getMessageById(gmailContext.messageId);
  const openedThread = openedMessage.getThread();
  const threadMessages = openedThread.getMessages();
  const latestMessage = getLatestMessage(threadMessages);

  return {
    latestDateIso: latestMessage.getDate().toISOString(),
    latestSender: latestMessage.getFrom(),
    messageCount: threadMessages.length,
    subject: openedMessage.getSubject(),
    threadId: openedThread.getId(),
  };
};
