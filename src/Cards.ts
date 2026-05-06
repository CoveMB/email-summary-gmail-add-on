import { CONFIG } from './Config';
import { getPrivacyNoticeText } from './PrivacyNotice';

const buildHeader = (subtitle: string): GoogleAppsScript.Card_Service.CardHeader =>
  CardService.newCardHeader().setTitle(CONFIG.APP_NAME).setSubtitle(subtitle);

const buildTextParagraph = (text: string): GoogleAppsScript.Card_Service.TextParagraph =>
  CardService.newTextParagraph().setText(text);

const buildBaseCard = (subtitle: string, bodyText: string): GoogleAppsScript.Card_Service.Card => {
  const section = CardService.newCardSection()
    .addWidget(buildTextParagraph(bodyText))
    .addWidget(buildTextParagraph(getPrivacyNoticeText()));

  return CardService.newCardBuilder().setHeader(buildHeader(subtitle)).addSection(section).build();
};

export const buildHomeCard = (): GoogleAppsScript.Card_Service.Card =>
  buildBaseCard(
    'Personal Gmail thread brief assistant',
    'Open a Gmail thread to use EmailSummary.'
  );

export const buildPlaceholderGmailCard = (): GoogleAppsScript.Card_Service.Card =>
  buildBaseCard(
    'Gmail thread context',
    'Summarization is not implemented yet. This scaffold does not read email content.'
  );
