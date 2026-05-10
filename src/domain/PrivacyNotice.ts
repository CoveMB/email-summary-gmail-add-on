import { CONFIG } from '../config/Config';

const mockModePrivacyNotice =
  'Privacy note: EmailSummary reads the opened thread only after you click summarize. Mock mode does not call Gemini, and email content is not logged or stored.';

const realModePrivacyNotice =
  'Privacy note: EmailSummary reads the opened thread only after you click summarize. Real mode sends cleaned thread text to Gemini, and email content is not logged or stored.';

export const getPrivacyNoticeText = (): string =>
  CONFIG.USE_MOCK_GEMINI ? mockModePrivacyNotice : realModePrivacyNotice;
