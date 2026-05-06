import { describe, expect, it } from 'vitest';

import {
  assertHasGmailContext,
  createEmptyThreadDebugSummary,
  getCurrentThreadData,
} from '../src/GmailReader';
import type { AddonEvent } from '../src/types';

const buildAddonEventWithMessageId = (messageId: string): AddonEvent => ({
  gmail: {
    messageId,
  },
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
    }).toThrow('This add-on needs an opened Gmail thread before it can summarize.');
  });

  it('throws a user-safe error when Gmail message id is empty', () => {
    expect(() => {
      assertHasGmailContext(buildAddonEventWithMessageId(''));
    }).toThrow('This add-on needs an opened Gmail thread before it can summarize.');
  });
});

describe('createEmptyThreadDebugSummary', () => {
  it('returns a stable empty debug summary', () => {
    expect(createEmptyThreadDebugSummary()).toEqual({
      messageCount: 0,
      threadId: null,
      totalBodyCharacters: 0,
      wasTruncated: false,
    });
  });
});

describe('getCurrentThreadData', () => {
  it('throws a user-safe not implemented error without reading Gmail', () => {
    expect(() => {
      getCurrentThreadData(buildAddonEventWithMessageId('message-123'));
    }).toThrow('Thread reading is not implemented yet.');
  });
});
