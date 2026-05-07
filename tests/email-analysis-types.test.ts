import { describe, expect, it } from 'vitest';

import type {
  ActionOwner,
  Confidence,
  EmailAnalysis,
  ExplicitActionItem,
  FollowUpRecommendation,
  SuggestedCalendarEvent,
  SuggestedLabel,
  ThingToConsider,
} from '../src/types/types';

const buildMinimalAnalysis = (): EmailAnalysis => ({
  explicitActionItems: [],
  followUpRecommendation: {
    confidence: 'low',
    reason: 'No follow-up signal found.',
    shouldFollowUp: false,
  },
  overallConfidence: 'medium',
  risksAndAmbiguities: [],
  suggestedReplyPoints: [],
  summary: 'No summary generated yet.',
  thingsToConsider: [],
});

describe('EmailAnalysis types', () => {
  it('supports minimal future analysis output without optional suggestions', () => {
    const analysis = buildMinimalAnalysis();

    expect(analysis.followUpRecommendation.shouldFollowUp).toBe(false);
    expect(analysis.explicitActionItems).toHaveLength(0);
  });

  it('supports all planned analysis sections with camelCase fields', () => {
    const owner: ActionOwner = 'recipient';
    const confidence: Confidence = 'high';
    const explicitActionItem: ExplicitActionItem = {
      confidence,
      description: 'Send the updated proposal.',
      dueDateIso: '2026-05-08',
      owner,
      sourceMessageIds: ['message-123'],
    };
    const thingToConsider: ThingToConsider = {
      confidence: 'medium',
      description: 'Budget approval is implied but not explicit.',
      sourceMessageIds: ['message-124'],
    };
    const suggestedCalendarEvent: SuggestedCalendarEvent = {
      confidence: 'medium',
      description: 'Discuss proposal edits.',
      endDateTimeIso: '2026-05-09T15:30:00.000Z',
      location: 'Video call',
      startDateTimeIso: '2026-05-09T15:00:00.000Z',
      title: 'Proposal review',
    };
    const suggestedLabel: SuggestedLabel = {
      confidence: 'high',
      name: 'Follow up',
      reason: 'Recipient asked for next steps.',
    };
    const followUpRecommendation: FollowUpRecommendation = {
      confidence: 'high',
      followUpDateIso: '2026-05-10',
      reason: 'No response after deadline would block next step.',
      shouldFollowUp: true,
    };
    const analysis: EmailAnalysis = {
      explicitActionItems: [explicitActionItem],
      followUpRecommendation,
      overallConfidence: 'high',
      risksAndAmbiguities: ['Deadline is mentioned without timezone.'],
      suggestedCalendarEvent,
      suggestedLabel,
      suggestedReplyPoints: ['Confirm proposal deadline.', 'Ask who owns final approval.'],
      summary: 'Proposal review requires recipient action.',
      thingsToConsider: [thingToConsider],
    };

    expect(analysis.explicitActionItems[0]?.owner).toBe('recipient');
    expect(analysis.suggestedCalendarEvent?.title).toBe('Proposal review');
    expect(analysis.suggestedLabel?.name).toBe('Follow up');
    expect(analysis.risksAndAmbiguities).toHaveLength(1);
  });
});
