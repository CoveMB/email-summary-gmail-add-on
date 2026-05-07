import { CONFIG } from './Config';

const mockGeminiAnalysisResponse = {
  explicit_action_items: [
    {
      confidence: 'high',
      description: 'Review the thread and decide whether a real Gemini call should be enabled.',
      owner: 'sender',
      source_message_ids: ['mock-message-1'],
    },
  ],
  follow_up_recommendation: {
    confidence: 'medium',
    reason: 'Mock mode keeps development safe until API access and data handling are reviewed.',
    should_follow_up: false,
  },
  overall_confidence: 'medium',
  risks_and_ambiguities: [
    'This is a deterministic mock response and not an interpretation of real email content.',
  ],
  suggested_calendar_event: {
    confidence: 'low',
    description: 'No real calendar event inferred in mock mode.',
    title: 'Review ThreadBrief Gemini setup',
  },
  suggested_label: {
    confidence: 'medium',
    name: 'ThreadBrief Mock',
    reason: 'Response was generated locally in mock mode.',
  },
  suggested_reply_points: [
    'Confirm Gemini integration remains disabled until credentials and scopes are configured.',
  ],
  summary: 'ThreadBrief mock analysis response. No Gemini API call was made.',
  things_to_consider: [
    {
      confidence: 'medium',
      description:
        'Mock output proves the pipeline shape without reading secrets or sending network requests.',
      source_message_ids: ['mock-message-1'],
    },
  ],
} as const;

export const analyzeThreadWithGemini = (_prompt: string): string => {
  if (!CONFIG.USE_MOCK_GEMINI) {
    throw new Error('Real Gemini calls are not implemented. Enable mock mode for now.');
  }

  return JSON.stringify(mockGeminiAnalysisResponse);
};
