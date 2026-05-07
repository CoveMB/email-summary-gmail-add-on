import { CONFIG } from '../config/Config';
import type { ThreadData } from '../types/types';
import { escapeCardText } from '../utils/CardUtils';
import { getPrivacyNoticeText } from './PrivacyNotice';

const readThreadMetadataFunctionName = 'buildThreadMetadataCard';

const buildHeader = (subtitle: string): GoogleAppsScript.Card_Service.CardHeader =>
  CardService.newCardHeader().setTitle(CONFIG.APP_NAME).setSubtitle(subtitle);

const buildTextParagraph = (text: string): GoogleAppsScript.Card_Service.TextParagraph =>
  CardService.newTextParagraph().setText(text);

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
            'Summarization is not implemented yet. This card reads thread metadata and a short debug body preview only.'
          )
        )
        .addWidget(buildTextParagraph('Debug preview is limited to 300 characters.'))
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
      buildMetadataLine(
        'Debug body preview',
        threadData.latestBodyPreview.length > 0 ? threadData.latestBodyPreview : '(empty)'
      ),
    ].join('<br>')
  );

export const buildThreadMetadataErrorCard = (
  errorMessage: string
): GoogleAppsScript.Card_Service.Card => buildBaseCard('Thread metadata', errorMessage);
