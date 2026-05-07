import type { AppConfig } from '../types/types';
import { getEnvironmentVariableCastedOr } from '../utils/Env';

export const GEMINI_API_KEY_PROPERTY_NAME = 'GEMINI_API_KEY';

export const CONFIG: AppConfig = Object.freeze({
  APP_NAME: 'EmailSummary',
  GEMINI_MAX_OUTPUT_TOKENS: 4096,
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_TEMPERATURE: 0.2,
  MAX_MESSAGES: 10,
  MAX_THREAD_CHARS: 50000,
  USE_MOCK_GEMINI: getEnvironmentVariableCastedOr('USE_MOCK_GEMINI', 'boolean', true),
});
