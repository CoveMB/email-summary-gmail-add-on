import { CONFIG } from './Config';
import { getPrivacyNoticeText } from './PrivacyNotice';
import type { ThreadData } from './types';

const readThreadMetadataFunctionName = 'buildThreadMetadataCard';

const buildHeader = (subtitle: string): GoogleAppsScript.Card_Service.CardHeader =>
  CardService.newCardHeader().setTitle(CONFIG.APP_NAME).setSubtitle(subtitle);

const buildTextParagraph = (text: string): GoogleAppsScript.Card_Service.TextParagraph =>
  CardService.newTextParagraph().setText(text);

const escapeCardText = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildReadThreadMetadataButtonSet = (): GoogleAppsScript.Card_Service.ButtonSet => {
  const action = CardService.newAction().setFunctionName(readThreadMetadataFunctionName);
  const button = CardService.newTextButton()
    .setText('Read thread metadata')
    .setOnClickAction(action);

  return CardService.newButtonSet().addButton(button);
};

const buildMetadataLine = (label: string, value: string): string =>
  `<b>${escapeCardText(label)}:</b> ${escapeCardText(value)}`;

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
  CardService.newCardBuilder()
    .setHeader(buildHeader('Gmail thread context'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          buildTextParagraph(
            'Summarization is not implemented yet. This card can read thread metadata only.'
          )
        )
        .addWidget(buildTextParagraph('Email body text is not read or displayed.'))
        .addWidget(buildReadThreadMetadataButtonSet())
        .addWidget(buildTextParagraph(getPrivacyNoticeText()))
    )
    .build();

export const buildThreadMetadataDisplayCard = (
  threadData: ThreadData
): GoogleAppsScript.Card_Service.Card =>
  buildBaseCard(
    'Thread metadata',
    [
      buildMetadataLine('Subject', threadData.subject),
      buildMetadataLine('Message count', String(threadData.messageCount)),
      buildMetadataLine('Latest sender', threadData.latestSender),
      buildMetadataLine('Latest date', threadData.latestDateIso),
    ].join('<br>')
  );

export const buildThreadMetadataErrorCard = (
  errorMessage: string
): GoogleAppsScript.Card_Service.Card => buildBaseCard('Thread metadata', errorMessage);
