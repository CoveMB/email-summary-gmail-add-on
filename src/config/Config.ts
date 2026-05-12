import { getEnvironmentVariableCastedOr } from '../utils/Env';

export const GEMINI_API_KEY_PROPERTY_NAME = 'GEMINI_API_KEY';

export const CONFIG = Object.freeze({
  APP_NAME: 'EmailSummary',
  DEBUG_UNSAFE_RAW: getEnvironmentVariableCastedOr('DEBUG_UNSAFE_RAW', 'boolean', false),
  GEMINI_MAX_OUTPUT_TOKENS: 4096,
  GEMINI_MODEL: 'gemini-3.1-flash-lite',
  GEMINI_TEMPERATURE: 0.2,
  MAX_MESSAGES: 10,
  MAX_THREAD_CHARS: 50000,
  USE_MOCK_GEMINI: getEnvironmentVariableCastedOr('USE_MOCK_GEMINI', 'boolean', true),
});
