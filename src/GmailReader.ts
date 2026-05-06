import type { AddonEvent, ThreadData, ThreadDebugSummary } from './types';
import { isNonEmptyString } from './utils/StringUtils';

const missingGmailContextMessage =
  'This add-on needs an opened Gmail thread before it can summarize.';

const threadReadingNotImplementedMessage = 'Thread reading is not implemented yet.';

export const assertHasGmailContext = (event: AddonEvent): void => {
  if (!event.gmail) {
    throw new Error(missingGmailContextMessage);
  }

  if (!isNonEmptyString(event.gmail.messageId)) {
    throw new Error(missingGmailContextMessage);
  }
};

export const createEmptyThreadDebugSummary = (): ThreadDebugSummary => ({
  messageCount: 0,
  threadId: null,
  totalBodyCharacters: 0,
  wasTruncated: false,
});

export const getCurrentThreadData = (event: AddonEvent): ThreadData => {
  assertHasGmailContext(event);

  throw new Error(threadReadingNotImplementedMessage);
};
