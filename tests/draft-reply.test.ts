import { describe, expect, it } from 'vitest';

import { buildDraftReplyBody } from '../src/domain/Actions';
import { draftReviewReminder, noStrongDraftSuggestionMessage } from '../src/domain/DraftReplyCopy';

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
