import type { CleanThreadText } from '../types/types';

const schemaExample = {
  explicitActionItems: [
    {
      confidence: 'high | medium | low',
      description: 'direct ask or obligation only',
      dueDateIso: 'optional ISO date or datetime when explicit',
      owner: 'recipient | sender | third_party | unclear',
      sourceMessageIds: ['optional source message ids'],
    },
  ],
  followUpRecommendation: {
    confidence: 'high | medium | low',
    followUpDateIso: 'optional ISO date or datetime',
    reason: 'why follow-up is or is not recommended',
    shouldFollowUp: false,
  },
  overallConfidence: 'high | medium | low',
  risksAndAmbiguities: ['risk, missing context, or ambiguity'],
  suggestedCalendarEvent: {
    confidence: 'high | medium | low',
    description: 'optional event details',
    endDateTimeIso: 'optional ISO datetime',
    location: 'optional location',
    startDateTimeIso: 'optional ISO datetime',
    title: 'event title',
  },
  suggestedLabel: {
    confidence: 'high | medium | low',
    name: 'short label name',
    reason: 'why this label fits',
  },
  suggestedReplyPoints: ['point to include in reply'],
  summary: 'brief thread summary',
  thingsToConsider: [
    {
      confidence: 'high | medium | low',
      description: 'context, caveat, or interpretation; not an obligation',
      sourceMessageIds: ['optional source message ids'],
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
