import { CONFIG } from './Config';
import { analysisFieldNames } from '../domain/AnalysisSchema';

const mockGeminiAnalysisResponse = {
  [analysisFieldNames.explicitActionItems.external]: [
    {
      confidence: 'high',
      description: 'Review the thread and decide whether a real Gemini call should be enabled.',
      owner: 'sender',
      [analysisFieldNames.sourceMessageIds.external]: ['mock-message-1'],
    },
  ],
  [analysisFieldNames.followUpRecommendation.external]: {
    confidence: 'medium',
    reason: 'Mock mode keeps development safe until API access and data handling are reviewed.',
    [analysisFieldNames.shouldFollowUp.external]: false,
  },
  [analysisFieldNames.overallConfidence.external]: 'medium',
  [analysisFieldNames.risksAndAmbiguities.external]: [
    'This is a deterministic mock response and not an interpretation of real email content.',
  ],
  [analysisFieldNames.suggestedCalendarEvent.external]: {
    confidence: 'low',
    description: 'No real calendar event inferred in mock mode.',
    title: 'Review ThreadBrief Gemini setup',
  },
  [analysisFieldNames.suggestedLabel.external]: {
    confidence: 'medium',
    name: 'ThreadBrief Mock',
    reason: 'Response was generated locally in mock mode.',
  },
  [analysisFieldNames.suggestedReplyPoints.external]: [
    'Confirm Gemini integration remains disabled until credentials and scopes are configured.',
  ],
  summary: 'ThreadBrief mock analysis response. No Gemini API call was made.',
  [analysisFieldNames.thingsToConsider.external]: [
    {
      confidence: 'medium',
      description:
        'Mock output proves the pipeline shape without reading secrets or sending network requests.',
      [analysisFieldNames.sourceMessageIds.external]: ['mock-message-1'],
    },
  ],
} as const;

export const analyzeThreadWithGemini = (_prompt: string): string => {
  if (!CONFIG.USE_MOCK_GEMINI) {
    throw new Error('Real Gemini calls are not implemented. Enable mock mode for now.');
  }

  return JSON.stringify(mockGeminiAnalysisResponse);
};
