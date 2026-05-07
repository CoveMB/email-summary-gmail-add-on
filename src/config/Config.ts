import type { AppConfig } from '../types/types';

export const CONFIG: AppConfig = Object.freeze({
  APP_NAME: 'EmailSummary',
  GEMINI_MODEL: 'gemini-2.5-flash',
  MAX_MESSAGES: 10,
  MAX_THREAD_CHARS: 50000,
  USE_MOCK_GEMINI: true,
});
