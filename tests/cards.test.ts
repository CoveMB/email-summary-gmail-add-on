import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CleanThreadText, EmailAnalysis } from '../src/types/types';
import type { CardModel } from './helpers/card-service-test-helpers';
import {
  readButtons,
  readCardText,
  readRequiredButton,
  readVisibleSectionHeaders,
  uninstallCardServiceMock,
} from './helpers/card-service-test-helpers';
import {
  importWithCardService,
  mockGeminiModeProperties,
  realGeminiModeWithoutApiKeyProperties,
} from './helpers/module-test-helpers';
import { uninstallScriptPropertiesMock } from './helpers/script-properties-test-helpers';

type CardsModule = typeof import('../src/domain/Cards');

const buildCleanThreadText = (wasTruncated: boolean): CleanThreadText => ({
  includedMessageCount: 2,
  originalMessageCount: 3,
  sourceMessages: [
    {
      dateIso: '2026-05-11T14:00:00.000Z',
      from: 'sender@example.com',
      isOpenedMessage: true,
      sourceMessageId: 'message-1',
    },
    {
      dateIso: '2026-05-10T13:00:00.000Z',
      from: 'recipient@example.com',
      isOpenedMessage: false,
      sourceMessageId: 'message-2',
    },
  ],
  text: 'clean thread text',
  wasTruncated,
});

const buildEmailAnalysis = (): EmailAnalysis => ({
  explicitActionItems: [
    {
      confidence: 'high',
      description: 'Send the signed <agreement>.',
      dueDateIso: '2026-05-12',
      owner: 'recipient',
      sourceMessageIds: ['message-1'],
    },
  ],
  followUpRecommendation: {
    confidence: 'medium',
    followUpDateIso: '2026-05-13',
    reason: 'Deadline is near.',
    shouldFollowUp: true,
  },
  overallConfidence: 'high',
  risksAndAmbiguities: ['Timezone is unclear.'],
  socialTone: {
    apparentTone: ['direct'],
    cautions: [],
    confidence: 'medium',
    evidence: 'Sender asks for confirmation.',
    possibleSenderState: null,
    relationalStance: '',
    socialSignals: [],
    summary: 'Direct and practical.',
    urgencyOrPressure: 'medium',
  },
  suggestedLabel: {
    confidence: 'high',
    name: 'Contracts',
    reason: 'Thread discusses an agreement.',
  },
  suggestedReplyPoints: ['Confirm the timeline.'],
  summary: 'Recipient should review <agreement>.',
  thingsToConsider: [
    {
      confidence: 'medium',
      description: 'Legal review may still be pending.',
      sourceMessageIds: [],
    },
  ],
});

const importCards = async (
  scriptProperties: Readonly<Record<string, string | null | undefined>>
): Promise<CardsModule> => {
  return importWithCardService(scriptProperties, () => import('../src/domain/Cards'));
};

afterEach(() => {
  uninstallCardServiceMock();
  uninstallScriptPropertiesMock();
  vi.resetModules();
});

describe('buildHomeCard', () => {
  it('renders configuration and real-mode privacy status without requiring an API key', async () => {
    const { buildHomeCard } = await importCards(realGeminiModeWithoutApiKeyProperties);
    const card = buildHomeCard() as unknown as CardModel;
    const cardText = readCardText(card);

    expect(card.header?.title).toBe('EmailSummary');
    expect(card.header?.subtitle).toBe('Personal Gmail thread brief assistant');
    expect(cardText).toContain('<b>Gemini mode:</b> Real');
    expect(cardText).toContain('<b>API key status:</b> Missing');
    expect(cardText).toContain('The text is sent to Gemini');
  });
});

describe('buildGmailSummaryEntryCard', () => {
  it('renders mock-mode entry copy and summarize action', async () => {
    const { buildGmailSummaryEntryCard } = await importCards(mockGeminiModeProperties);
    const card = buildGmailSummaryEntryCard() as unknown as CardModel;
    const cardText = readCardText(card);
    const summarizeButton = readRequiredButton(card, 'Summarize thread');

    expect(card.header?.subtitle).toBe('Gmail thread context');
    expect(cardText).toContain('Mock summarization is available.');
    expect(cardText).toContain('No real Gemini API call is made in mock mode.');
    expect(summarizeButton.onClickAction?.functionName).toBe('buildThreadSummaryCard');
  });
});

describe('buildThreadAnalysisDisplayCard', () => {
  it('renders every analysis section, escaped content, truncation notice, and actions', async () => {
    const { buildThreadAnalysisDisplayCard } = await importCards(mockGeminiModeProperties);
    const card = buildThreadAnalysisDisplayCard(
      buildEmailAnalysis(),
      buildCleanThreadText(true)
    ) as unknown as CardModel;
    const cardText = readCardText(card);
    const draftButton = readRequiredButton(card, 'Create draft reply');
    const refreshButton = readRequiredButton(card, 'Refresh summary');

    expect(card.header?.subtitle).toBe('Mock thread summary');
    expect(readVisibleSectionHeaders(card)).toEqual([
      'Summary',
      'Explicit action items',
      'Follow-up',
      'Risks / ambiguities',
      'Things to consider / think about',
      'Suggested reply points',
      'Suggested label',
      'Communication cues',
      'Source messages',
      'Truncation notice',
    ]);
    expect(cardText).toContain('Recipient should review &lt;agreement&gt;.');
    expect(cardText).toContain('Send the signed &lt;agreement&gt;.');
    expect(cardText).toContain('<b>Owner:</b> Recipient');
    expect(cardText).toContain('<b>Confidence:</b> High');
    expect(cardText).toContain('<b>Due:</b> May 12, 2026');
    expect(cardText).toContain('<b>Evidence:</b> Message 1');
    expect(cardText).toContain(
      '<b>Message 1:</b> sender@example.com - May 11, 2026, 2:00 PM UTC - opened email'
    );
    expect(cardText).toContain('<b>Recommendation:</b> Yes');
    expect(cardText).toContain('<b>Follow-up date:</b> May 13, 2026');
    expect(cardText).toContain('<b>Caution:</b>');
    expect(cardText).not.toContain('Suggested calendar event');
    expect(cardText).toContain('Cleaned thread text was truncated before AI analysis.');
    expect(draftButton.composeAction?.composedEmailType).toBe('REPLY_AS_DRAFT');
    expect(draftButton.composeAction?.action.functionName).toBe('buildCreateDraftReplyResponse');
    expect(refreshButton.onClickAction?.functionName).toBe('buildThreadSummaryCard');
  });

  it('does not show optional label section and missing follow-up as a no recommendation', async () => {
    const { buildThreadAnalysisDisplayCard } = await importCards(mockGeminiModeProperties);
    const { suggestedLabel: _suggestedLabel, ...baseAnalysisWithoutLabel } = buildEmailAnalysis();
    const analysis: EmailAnalysis = {
      ...baseAnalysisWithoutLabel,
      followUpRecommendation: {
        confidence: 'low',
        reason: '',
        shouldFollowUp: null,
      },
    };
    const card = buildThreadAnalysisDisplayCard(
      analysis,
      buildCleanThreadText(false)
    ) as unknown as CardModel;
    const cardText = readCardText(card);

    expect(readVisibleSectionHeaders(card)).not.toContain('Suggested label');
    expect(cardText).toContain('<b>Recommendation:</b> No recommendation returned');
    expect(cardText).not.toContain('<b>Recommended:</b> No');
  });

  it('renders parser review notes and hides draft creation when no reply points exist', async () => {
    const { buildThreadAnalysisDisplayCard } = await importCards(mockGeminiModeProperties);
    const { suggestedLabel: _suggestedLabel, ...baseAnalysisWithoutLabel } = buildEmailAnalysis();
    const analysis: EmailAnalysis = {
      ...baseAnalysisWithoutLabel,
      explicitActionItems: [],
      parseMetadata: {
        missingFields: ['explicit_action_items', 'suggested_reply_points'],
        warnings: [
          'AI response did not include the explicit action items field.',
          'AI response did not include the suggested reply points field.',
        ],
      },
      suggestedReplyPoints: [],
    };
    const card = buildThreadAnalysisDisplayCard(
      analysis,
      buildCleanThreadText(false)
    ) as unknown as CardModel;
    const cardText = readCardText(card);
    const buttonTexts = readButtons(card).map((button) => button.text);

    expect(readVisibleSectionHeaders(card)).toContain('Review notes');
    expect(cardText).toContain('AI response did not include explicit action items.');
    expect(cardText).toContain('- AI response did not include the suggested reply points field.');
    expect(buttonTexts).not.toContain('Create draft reply');
    expect(buttonTexts).toContain('Refresh summary');
  });
});

describe('buildErrorCard', () => {
  it('escapes unsafe error text and keeps refresh action available', async () => {
    const { buildErrorCard } = await importCards(mockGeminiModeProperties);
    const card = buildErrorCard('Unsafe <title>', 'Retry <later>.') as unknown as CardModel;
    const refreshButton = readRequiredButton(card, 'Refresh summary');

    expect(card.header?.subtitle).toBe('Unsafe <title>');
    expect(readCardText(card)).toContain('Retry &lt;later&gt;.');
    expect(refreshButton.onClickAction?.functionName).toBe('buildThreadSummaryCard');
  });
});
