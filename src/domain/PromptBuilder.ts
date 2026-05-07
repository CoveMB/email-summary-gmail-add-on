import {
  actionOwnerValues,
  confidenceValues,
  type CleanThreadText,
  urgencyOrPressureValues,
} from '../types/types';
import { analysisFieldNames } from './AnalysisSchema';

const confidenceSchemaValue = confidenceValues.join(' | ');
const actionOwnerSchemaValue = actionOwnerValues.join(' | ');
const urgencyOrPressureSchemaValue = urgencyOrPressureValues.join(' | ');
const sourceMessageIdsSchemaExample = ['optional source message ids'] as const;

const buildExplicitActionItemSchemaExample = () => ({
  confidence: confidenceSchemaValue,
  description: 'direct ask or obligation only',
  [analysisFieldNames.dueDateIso.external]: 'optional ISO date or datetime when explicit',
  owner: actionOwnerSchemaValue,
  [analysisFieldNames.sourceMessageIds.external]: sourceMessageIdsSchemaExample,
});

const buildFollowUpRecommendationSchemaExample = () => ({
  confidence: confidenceSchemaValue,
  [analysisFieldNames.followUpDateIso.external]: 'optional ISO date or datetime',
  reason: 'why follow-up is or is not recommended',
  [analysisFieldNames.shouldFollowUp.external]: false,
});

const buildSuggestedCalendarEventSchemaExample = () => ({
  confidence: confidenceSchemaValue,
  description: 'optional event details',
  [analysisFieldNames.endDateTimeIso.external]: 'optional ISO datetime',
  location: 'optional location',
  [analysisFieldNames.startDateTimeIso.external]: 'optional ISO datetime',
  title: 'event title',
});

const buildSuggestedLabelSchemaExample = () => ({
  confidence: confidenceSchemaValue,
  name: 'short label name',
  reason: 'why this label fits',
});

const buildSocialToneSchemaExample = () => ({
  [analysisFieldNames.socialToneApparentTone.external]: [
    'observable tone labels, such as warm, neutral, formal, tense, demanding, avoidant, collaborative, or unclear',
  ],
  cautions: [
    'Tone is inferred from text only.',
    "The sender's actual emotional state cannot be determined from the email alone.",
  ],
  confidence: confidenceSchemaValue,
  evidence: 'specific wording or context supporting the tone interpretation',
  [analysisFieldNames.socialTonePossibleSenderState.external]:
    'cautious communication-signal interpretation or null; never diagnostic',
  [analysisFieldNames.socialToneRelationalStance.external]:
    'cautious relational stance summary or null',
  [analysisFieldNames.socialToneSocialSignals.external]: [
    'observable emotional or interpersonal signal with evidence',
  ],
  summary: 'cautious social-tone summary',
  [analysisFieldNames.socialToneUrgencyOrPressure.external]: urgencyOrPressureSchemaValue,
});

const buildThingToConsiderSchemaExample = () => ({
  confidence: confidenceSchemaValue,
  description: 'context, caveat, or interpretation; not an obligation',
  [analysisFieldNames.sourceMessageIds.external]: sourceMessageIdsSchemaExample,
});

const buildEmailAnalysisSchemaExample = () => ({
  [analysisFieldNames.explicitActionItems.external]: [buildExplicitActionItemSchemaExample()],
  [analysisFieldNames.followUpRecommendation.external]: buildFollowUpRecommendationSchemaExample(),
  [analysisFieldNames.overallConfidence.external]: confidenceSchemaValue,
  [analysisFieldNames.risksAndAmbiguities.external]: ['risk, missing context, or ambiguity'],
  [analysisFieldNames.suggestedCalendarEvent.external]: buildSuggestedCalendarEventSchemaExample(),
  [analysisFieldNames.suggestedLabel.external]: buildSuggestedLabelSchemaExample(),
  [analysisFieldNames.socialTone.external]: buildSocialToneSchemaExample(),
  [analysisFieldNames.suggestedReplyPoints.external]: ['point to include in reply'],
  summary: 'brief thread summary',
  [analysisFieldNames.thingsToConsider.external]: [buildThingToConsiderSchemaExample()],
});

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
    JSON.stringify(buildEmailAnalysisSchemaExample(), null, 2),
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
