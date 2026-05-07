import { describe, expect, it } from 'vitest';
import { getUserSafeThreadSummaryError, ThreadSummaryStageError } from '../src/Code';

const sensitiveErrorText =
  'raw body text prompt response accessToken=secret apiKey=secret stack trace line 1';

describe('getUserSafeThreadSummaryError', () => {
  it('maps missing Gmail context to friendly copy', () => {
    const error = getUserSafeThreadSummaryError(new ThreadSummaryStageError('no_gmail_context'));

    expect(error).toEqual({
      kind: 'no_gmail_context',
      message: 'Open a Gmail thread, then run EmailSummary from that thread.',
      title: 'No Gmail thread open',
    });
  });

  it('maps Gmail read failure without exposing raw details', () => {
    const error = getUserSafeThreadSummaryError(new ThreadSummaryStageError('gmail_read_failure'));

    expect(error.kind).toBe('gmail_read_failure');
    expect(error.title).toBe('Could not read Gmail thread');
    expect(error.message).not.toContain('accessToken');
    expect(error.message).not.toContain('secret');
  });

  it('maps parse failure to retry-friendly copy', () => {
    const error = getUserSafeThreadSummaryError(new ThreadSummaryStageError('parse_failure'));

    expect(error).toEqual({
      kind: 'parse_failure',
      message:
        'EmailSummary could not understand the generated summary. Try refreshing the summary.',
      title: 'Could not parse summary',
    });
  });

  it('maps unexpected failures without exposing raw exception text', () => {
    const error = getUserSafeThreadSummaryError(new Error(sensitiveErrorText));
    const renderedText = `${error.title} ${error.message}`;

    expect(error.kind).toBe('unexpected_failure');
    expect(renderedText).not.toContain('raw body text');
    expect(renderedText).not.toContain('prompt');
    expect(renderedText).not.toContain('response');
    expect(renderedText).not.toContain('accessToken');
    expect(renderedText).not.toContain('apiKey');
    expect(renderedText).not.toContain('stack trace');
  });
});
