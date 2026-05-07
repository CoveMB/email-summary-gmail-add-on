import { CONFIG } from './Config';

export type GeminiClientPlaceholderState = Readonly<{
  apiCallsEnabled: false;
  mockMode: boolean;
  model: string;
}>;

export const getGeminiClientPlaceholderState = (): GeminiClientPlaceholderState => ({
  apiCallsEnabled: false,
  mockMode: CONFIG.USE_MOCK_GEMINI,
  model: CONFIG.GEMINI_MODEL,
});
