import { describe, expect, it } from 'vitest';

import {
  buildCleanThreadText,
  cleanEmailBody,
  stripCommonSignatures,
  stripQuotedReply,
} from '../src/domain/ThreadCleaner';
import type { ThreadData, ThreadMessage } from '../src/types/types';

const buildThreadMessage = (
  messageIndex: number,
  overrides: Partial<ThreadMessage> = {}
): ThreadMessage => ({
  dateIso: new Date(Date.UTC(2026, 4, 6, 12, messageIndex)).toISOString(),
  from: `sender-${String(messageIndex)}@example.com`,
  plainBody: `Message ${String(messageIndex)} body`,
  subject: 'Project update',
  to: 'recipient@example.com',
  ...overrides,
});

const buildThreadData = (messages: readonly ThreadMessage[]): ThreadData => ({
  latestBodyPreview: '',
  latestDateIso: messages[messages.length - 1]?.dateIso ?? '',
  latestSender: messages[messages.length - 1]?.from ?? '',
  messages,
  messageCount: messages.length,
  openedMessageId: 'opened-message-123',
  subject: 'Project update',
  threadId: 'thread-123',
});

describe('stripQuotedReply', () => {
  it('removes common quoted reply blocks without removing current message text', () => {
    const text = [
      'Current answer stays.',
      '',
      'On Tue, May 5, 2026 at 9:00 AM Alex <alex@example.com> wrote:',
      '> Old quoted line',
    ].join('\n');

    expect(stripQuotedReply(text)).toBe('Current answer stays.\n');
  });

  it('removes quote-prefixed lines while keeping surrounding new text', () => {
    const text = ['First new line', '> quoted old line', 'Second new line'].join('\n');

    expect(stripQuotedReply(text)).toBe('First new line\nSecond new line');
  });
});

describe('stripCommonSignatures', () => {
  it('removes delimiter signatures', () => {
    const text = ['Please review this.', '-- ', 'Alex Example', 'Title'].join('\n');

    expect(stripCommonSignatures(text)).toBe('Please review this.');
  });

  it('removes common mobile signatures only from the end', () => {
    const text = ['I saw "Sent from my iPhone" in the docs.', '', 'Sent from my iPhone'].join('\n');

    expect(stripCommonSignatures(text)).toBe('I saw "Sent from my iPhone" in the docs.\n');
  });
});

describe('cleanEmailBody', () => {
  it('normalizes whitespace and applies conservative cleanup', () => {
    const text = [
      '  Keep leading spaces when meaningful.  ',
      '',
      '',
      '',
      'Thanks,  ',
      'Sent from Outlook for iOS',
    ].join('\r\n');

    expect(cleanEmailBody(text)).toBe('  Keep leading spaces when meaningful.\n\nThanks,');
  });
});

describe('buildCleanThreadText', () => {
  it('includes most recent messages up to configured max count', () => {
    const maxMessages = 3;
    const messages = Array.from({ length: maxMessages + 2 }, (_value, index) =>
      buildThreadMessage(index)
    );
    const cleanThreadText = buildCleanThreadText(buildThreadData(messages), { maxMessages });

    expect(cleanThreadText.originalMessageCount).toBe(maxMessages + 2);
    expect(cleanThreadText.includedMessageCount).toBe(maxMessages);
    expect(cleanThreadText.wasTruncated).toBe(false);
    expect(cleanThreadText.text).not.toContain('Message 0 body');
    expect(cleanThreadText.text).not.toContain('Message 1 body');
    expect(cleanThreadText.text).toContain(`Message ${String(maxMessages + 1)} body`);
  });

  it('treats malformed message dates as oldest when selecting recent messages', () => {
    const cleanThreadText = buildCleanThreadText(
      buildThreadData([
        buildThreadMessage(1, {
          dateIso: 'not-a-date',
          plainBody: 'Malformed date body',
        }),
        buildThreadMessage(2, {
          plainBody: 'Valid newer body',
        }),
      ]),
      { maxMessages: 1 }
    );

    expect(cleanThreadText.includedMessageCount).toBe(1);
    expect(cleanThreadText.text).toContain('Valid newer body');
    expect(cleanThreadText.text).not.toContain('Malformed date body');
  });

  it('keeps selected recent messages in chronological order', () => {
    const cleanThreadText = buildCleanThreadText(
      buildThreadData([buildThreadMessage(3), buildThreadMessage(1), buildThreadMessage(2)]),
      { maxMessages: 2 }
    );

    expect(cleanThreadText.text).not.toContain('Message 1 body');
    expect(cleanThreadText.text.indexOf('Message 2 body')).toBeLessThan(
      cleanThreadText.text.indexOf('Message 3 body')
    );
  });

  it('formats cleaned message metadata and bodies', () => {
    const cleanThreadText = buildCleanThreadText(
      buildThreadData([
        buildThreadMessage(1, {
          plainBody: ['New content', '', 'On Mon, May 4, 2026 at 9:00 AM Sam wrote:', '> old'].join(
            '\n'
          ),
        }),
      ])
    );

    expect(cleanThreadText.text).toContain('From: sender-1@example.com');
    expect(cleanThreadText.text).toContain('To: recipient@example.com');
    expect(cleanThreadText.text).toContain('Subject: Project update');
    expect(cleanThreadText.text).toContain('New content');
    expect(cleanThreadText.text).not.toContain('old');
  });

  it('truncates cleaned thread text to configured max character count', () => {
    const maxChars = 80;
    const cleanThreadText = buildCleanThreadText(
      buildThreadData([
        buildThreadMessage(1, {
          plainBody: 'x'.repeat(maxChars + 100),
        }),
      ]),
      { maxChars }
    );

    expect(cleanThreadText.wasTruncated).toBe(true);
    expect(cleanThreadText.text.length).toBeLessThanOrEqual(maxChars);
    expect(cleanThreadText.text).toContain('[Thread text truncated]');
  });
});
