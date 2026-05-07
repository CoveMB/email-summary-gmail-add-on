import type { CleanThreadText } from '../types/types';
import { analysisFieldNames } from './AnalysisSchema';

const schemaExample = {
  [analysisFieldNames.explicitActionItems.external]: [
    {
      confidence: 'high | medium | low',
      description: 'direct ask or obligation only',
      [analysisFieldNames.dueDateIso.external]: 'optional ISO date or datetime when explicit',
      owner: 'recipient | sender | third_party | unclear',
      [analysisFieldNames.sourceMessageIds.external]: ['optional source message ids'],
    },
  ],
  [analysisFieldNames.followUpRecommendation.external]: {
    confidence: 'high | medium | low',
    [analysisFieldNames.followUpDateIso.external]: 'optional ISO date or datetime',
    reason: 'why follow-up is or is not recommended',
    [analysisFieldNames.shouldFollowUp.external]: false,
  },
  [analysisFieldNames.overallConfidence.external]: 'high | medium | low',
  [analysisFieldNames.risksAndAmbiguities.external]: ['risk, missing context, or ambiguity'],
  [analysisFieldNames.suggestedCalendarEvent.external]: {
    confidence: 'high | medium | low',
    description: 'optional event details',
    [analysisFieldNames.endDateTimeIso.external]: 'optional ISO datetime',
    location: 'optional location',
    [analysisFieldNames.startDateTimeIso.external]: 'optional ISO datetime',
    title: 'event title',
  },
  [analysisFieldNames.suggestedLabel.external]: {
    confidence: 'high | medium | low',
    name: 'short label name',
    reason: 'why this label fits',
  },
  [analysisFieldNames.socialTone.external]: {
    [analysisFieldNames.socialToneApparentTone.external]: [
      'observable tone labels, such as warm, neutral, formal, tense, demanding, avoidant, collaborative, or unclear',
    ],
    cautions: [
      'Tone is inferred from text only.',
      "The sender's actual emotional state cannot be determined from the email alone.",
    ],
    confidence: 'high | medium | low',
    evidence: 'specific wording or context supporting the tone interpretation',
    [analysisFieldNames.socialTonePossibleSenderState.external]:
      'cautious communication-signal interpretation or null; never diagnostic',
    [analysisFieldNames.socialToneRelationalStance.external]:
      'cautious relational stance summary or null',
    [analysisFieldNames.socialToneSocialSignals.external]: [
      'observable emotional or interpersonal signal with evidence',
    ],
    summary: 'cautious social-tone summary',
    [analysisFieldNames.socialToneUrgencyOrPressure.external]:
      'none | low | medium | high | unclear',
  },
  [analysisFieldNames.suggestedReplyPoints.external]: ['point to include in reply'],
  summary: 'brief thread summary',
  [analysisFieldNames.thingsToConsider.external]: [
    {
      confidence: 'high | medium | low',
      description: 'context, caveat, or interpretation; not an obligation',
      [analysisFieldNames.sourceMessageIds.external]: ['optional source message ids'],
    },
  ],
};

const buildTruncationInstruction = (cleanThread: CleanThreadText): string =>
  cleanThread.wasTruncated
    ? 'The cleaned thread text was truncated before analysis. Mention truncation-related uncertainty in risksAndAmbiguities when relevant.'
    : 'The cleaned thread text was not truncated.';

export const buildEmailAnalysisPrompt = (cleanThread: CleanThreadText): string =>
  [
    'Analyze the cleaned Gmail thread below and return JSON only. Do not return markdown, prose, code fences, or comments.',
    '',
    'Focus rules:',
    '- Treat the latest/opened email as the primary focus.',
    '- Treat earlier messages as context for the latest/opened email.',
    '- Explicit action items must be direct asks, commitments, or obligations from the thread.',
    '- Things to consider are context, caveats, or interpretations, not obligations.',
    '- Do not invent tasks, deadlines, owners, events, labels, or facts not supported by the thread.',
    '- Use confidence levels exactly: high, medium, or low.',
    '- Separate evidence from interpretation: summarize what the thread says, and put uncertainty or interpretation in thingsToConsider or risksAndAmbiguities.',
    '- Analyze the communication tone and social tone of the email/thread.',
    '- Identify observable emotional or interpersonal signals only.',
    "- Do not diagnose the sender or claim to know the sender's actual psychological state.",
    '- Do not use clinical or mental-health labels such as anxious, manipulative, narcissistic, depressed, or similar labels.',
    '- Distinguish observed wording from social-tone interpretation.',
    '- Include uncertainty and alternative explanations for tone or interpersonal subtext.',
    '- Prefer cautious wording such as "may come across as", "appears to be communicating with", "possible signal", and "this is uncertain because".',
    '- If there is not enough evidence for social tone, say so.',
    '',
    'Expected JSON schema keys:',
    JSON.stringify(schemaExample, null, 2),
    '',
    'Thread metadata:',
    `- originalMessageCount: ${String(cleanThread.originalMessageCount)}`,
    `- includedMessageCount: ${String(cleanThread.includedMessageCount)}`,
    `- wasTruncated: ${String(cleanThread.wasTruncated)}`,
    `- truncationNotice: ${buildTruncationInstruction(cleanThread)}`,
    '',
    'Cleaned thread text:',
    cleanThread.text,
  ].join('\n');
