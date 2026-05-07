import { CONFIG } from '../config/Config';
import type {
  CleanThreadText,
  EmailAnalysis,
  ExplicitActionItem,
  FollowUpRecommendation,
  SuggestedCalendarEvent,
  SuggestedLabel,
  ThingToConsider,
} from '../types/types';
import { escapeCardText } from '../utils/CardUtils';
import { getPrivacyNoticeText } from './PrivacyNotice';

const summarizeThreadFunctionName = 'buildThreadSummaryCard';
const emptySectionText = 'None found.';

type MetadataLineInput = Readonly<{
  fallbackValue?: string | undefined;
  label: string;
  value?: string | undefined;
}>;

const buildHeader = (subtitle: string): GoogleAppsScript.Card_Service.CardHeader =>
  CardService.newCardHeader().setTitle(CONFIG.APP_NAME).setSubtitle(subtitle);

const buildTextParagraph = (text: string): GoogleAppsScript.Card_Service.TextParagraph =>
  CardService.newTextParagraph().setText(text);

const buildSummarizeThreadButtonSet = (): GoogleAppsScript.Card_Service.ButtonSet => {
  const action = CardService.newAction().setFunctionName(summarizeThreadFunctionName);
  const button = CardService.newTextButton().setText('Summarize thread').setOnClickAction(action);

  return CardService.newButtonSet().addButton(button);
};

const buildMetadataLine = (label: string, value: string): string =>
  `<b>${escapeCardText(label)}:</b> ${escapeCardText(value)}`;

const buildOptionalMetadataLines = (
  metadataLines: readonly MetadataLineInput[]
): readonly string[] =>
  metadataLines.flatMap((metadataLine) => {
    const value =
      metadataLine.value && metadataLine.value.length > 0
        ? metadataLine.value
        : metadataLine.fallbackValue;

    return value ? [buildMetadataLine(metadataLine.label, value)] : [];
  });

const buildSection = (title: string, bodyLines: readonly string[]): string =>
  [`<b>${escapeCardText(title)}</b>`, ...bodyLines].join('<br>');

const buildListSection = (title: string, items: readonly string[]): string =>
  buildSection(
    title,
    items.length > 0 ? items.map((item) => `- ${escapeCardText(item)}`) : [emptySectionText]
  );

const formatActionItem = (actionItem: ExplicitActionItem): string =>
  [
    actionItem.description,
    `(owner: ${actionItem.owner}; confidence: ${actionItem.confidence})`,
    actionItem.dueDateIso ? `due: ${actionItem.dueDateIso}` : '',
  ]
    .filter((part) => part.length > 0)
    .join(' ');

const formatThingToConsider = (thingToConsider: ThingToConsider): string =>
  `${thingToConsider.description} (confidence: ${thingToConsider.confidence})`;

const formatCalendarSuggestion = (
  suggestedCalendarEvent: SuggestedCalendarEvent | undefined
): readonly string[] => {
  if (!suggestedCalendarEvent) {
    return [emptySectionText];
  }

  return buildOptionalMetadataLines([
    { fallbackValue: '(untitled)', label: 'Title', value: suggestedCalendarEvent.title },
    { label: 'Confidence', value: suggestedCalendarEvent.confidence },
    { label: 'Description', value: suggestedCalendarEvent.description },
    { label: 'Start', value: suggestedCalendarEvent.startDateTimeIso },
    { label: 'End', value: suggestedCalendarEvent.endDateTimeIso },
    { label: 'Location', value: suggestedCalendarEvent.location },
  ]);
};

const formatLabelSuggestion = (suggestedLabel: SuggestedLabel | undefined): readonly string[] => {
  if (!suggestedLabel) {
    return [emptySectionText];
  }

  return buildOptionalMetadataLines([
    { fallbackValue: '(unnamed)', label: 'Label', value: suggestedLabel.name },
    { label: 'Confidence', value: suggestedLabel.confidence },
    { fallbackValue: '(no reason provided)', label: 'Reason', value: suggestedLabel.reason },
  ]);
};

const formatFollowUpRecommendation = (
  followUpRecommendation: FollowUpRecommendation
): readonly string[] =>
  buildOptionalMetadataLines([
    {
      label: 'Recommended',
      value: followUpRecommendation.shouldFollowUp ? 'Yes' : 'No',
    },
    { label: 'Confidence', value: followUpRecommendation.confidence },
    {
      fallbackValue: '(no reason provided)',
      label: 'Reason',
      value: followUpRecommendation.reason,
    },
    { label: 'Follow-up date', value: followUpRecommendation.followUpDateIso },
  ]);

const buildTruncationSection = (cleanThread: CleanThreadText): string =>
  cleanThread.wasTruncated
    ? buildSection('Truncation notice', [
        'Cleaned thread text was truncated before mock AI analysis. Review output with this limitation in mind.',
      ])
    : '';

const buildBaseCard = (subtitle: string, bodyText: string): GoogleAppsScript.Card_Service.Card => {
  const section = CardService.newCardSection()
    .addWidget(buildTextParagraph(bodyText))
    .addWidget(buildTextParagraph(getPrivacyNoticeText()));

  return CardService.newCardBuilder().setHeader(buildHeader(subtitle)).addSection(section).build();
};

export const buildHomeCard = (): GoogleAppsScript.Card_Service.Card =>
  buildBaseCard('Personal Gmail thread brief assistant', 'Open a Gmail thread to use ThreadBrief.');

export const buildGmailSummaryEntryCard = (): GoogleAppsScript.Card_Service.Card =>
  CardService.newCardBuilder()
    .setHeader(buildHeader('Gmail thread context'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          buildTextParagraph(
            'Mock summarization is available. It reads the currently opened thread after you click the button, cleans it in memory, sends it to the mock Gemini client, and displays parsed results.'
          )
        )
        .addWidget(buildTextParagraph('No real Gemini API call is made in mock mode.'))
        .addWidget(buildSummarizeThreadButtonSet())
        .addWidget(buildTextParagraph(getPrivacyNoticeText()))
    )
    .build();

const buildThreadAnalysisBodyText = (
  analysis: EmailAnalysis,
  cleanThread: CleanThreadText
): string =>
  [
    buildSection('Summary', [escapeCardText(analysis.summary || '(No summary returned.)')]),
    buildListSection('Explicit action items', analysis.explicitActionItems.map(formatActionItem)),
    buildListSection('Things to consider', analysis.thingsToConsider.map(formatThingToConsider)),
    buildListSection('Suggested reply points', analysis.suggestedReplyPoints),
    buildSection(
      'Suggested calendar event',
      formatCalendarSuggestion(analysis.suggestedCalendarEvent)
    ),
    buildSection('Suggested label', formatLabelSuggestion(analysis.suggestedLabel)),
    buildSection(
      'Follow-up recommendation',
      formatFollowUpRecommendation(analysis.followUpRecommendation)
    ),
    buildListSection('Risks / ambiguities', analysis.risksAndAmbiguities),
    buildTruncationSection(cleanThread),
  ]
    .filter((section) => section.length > 0)
    .join('<br><br>');

export const buildThreadAnalysisDisplayCard = (
  analysis: EmailAnalysis,
  cleanThread: CleanThreadText
): GoogleAppsScript.Card_Service.Card =>
  buildBaseCard('Mock thread summary', buildThreadAnalysisBodyText(analysis, cleanThread));

export const buildThreadSummaryErrorCard = (
  errorMessage: string
): GoogleAppsScript.Card_Service.Card => buildBaseCard('Mock thread summary', errorMessage);
