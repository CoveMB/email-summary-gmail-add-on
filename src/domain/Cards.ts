import { CONFIG } from '../config/Config';
import { getGeminiApiKeyStatus } from '../config/GeminiClient';
import type {
  CleanThreadText,
  EmailAnalysis,
  ExplicitActionItem,
  FollowUpRecommendation,
  SocialToneAnalysis,
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

const buildThreadSummaryButtonSet = (
  buttonText: string
): GoogleAppsScript.Card_Service.ButtonSet => {
  const action = CardService.newAction().setFunctionName(summarizeThreadFunctionName);
  const button = CardService.newTextButton().setText(buttonText).setOnClickAction(action);

  return CardService.newButtonSet().addButton(button);
};

const buildSummarizeThreadButtonSet = (): GoogleAppsScript.Card_Service.ButtonSet =>
  buildThreadSummaryButtonSet('Summarize thread');

const buildRefreshSummaryButtonSet = (): GoogleAppsScript.Card_Service.ButtonSet =>
  buildThreadSummaryButtonSet('Refresh summary');

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

const buildAnalysisSection = (
  title: string,
  bodyLines: readonly string[]
): GoogleAppsScript.Card_Service.CardSection =>
  CardService.newCardSection()
    .setHeader(title)
    .addWidget(
      buildTextParagraph(bodyLines.length > 0 ? bodyLines.join('<br>') : emptySectionText)
    );

const buildPlainTextSection = (bodyText: string): GoogleAppsScript.Card_Service.CardSection =>
  CardService.newCardSection().addWidget(buildTextParagraph(escapeCardText(bodyText)));

const buildButtonSection = (
  buttonSet: GoogleAppsScript.Card_Service.ButtonSet
): GoogleAppsScript.Card_Service.CardSection => CardService.newCardSection().addWidget(buttonSet);

const buildPrivacyFooterSection = (): GoogleAppsScript.Card_Service.CardSection =>
  CardService.newCardSection().addWidget(
    buildTextParagraph(`<font color="#666666">${escapeCardText(getPrivacyNoticeText())}</font>`)
  );

const buildListSection = (
  title: string,
  items: readonly string[]
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(
    title,
    items.length > 0 ? items.map((item) => `- ${escapeCardText(item)}`) : [emptySectionText]
  );

const buildFormattedListSection = (
  title: string,
  items: readonly string[]
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(title, items.length > 0 ? items : [emptySectionText]);

const buildEvidenceLine = (sourceMessageIds: readonly string[] | undefined): string =>
  sourceMessageIds && sourceMessageIds.length > 0
    ? buildMetadataLine('Evidence', sourceMessageIds.join(', '))
    : '';

const formatActionItem = (actionItem: ExplicitActionItem): string =>
  [
    `- ${escapeCardText(actionItem.description)}`,
    buildMetadataLine('Owner', actionItem.owner),
    buildMetadataLine('Confidence', actionItem.confidence),
    actionItem.dueDateIso ? buildMetadataLine('Due', actionItem.dueDateIso) : '',
    buildEvidenceLine(actionItem.sourceMessageIds),
  ]
    .filter((part) => part.length > 0)
    .join('<br>');

const formatThingToConsider = (thingToConsider: ThingToConsider): string =>
  [
    `- ${escapeCardText(thingToConsider.description)}`,
    buildMetadataLine('Confidence', thingToConsider.confidence),
    buildEvidenceLine(thingToConsider.sourceMessageIds),
  ]
    .filter((part) => part.length > 0)
    .join('<br>');

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

const buildJoinedMetadataLine = (
  label: string,
  values: readonly string[],
  emptyText: string
): string => buildMetadataLine(label, values.length > 0 ? values.join(', ') : emptyText);

const formatSocialSignals = (socialSignals: readonly string[]): readonly string[] =>
  socialSignals.length > 0
    ? socialSignals.map((signal) => `- ${buildMetadataLine('Possible signal', signal)}`)
    : [buildMetadataLine('Possible signal', 'Not enough evidence to identify a reliable signal.')];

const formatCautions = (cautions: readonly string[]): readonly string[] =>
  cautions.length > 0
    ? cautions.map((caution) => `- ${buildMetadataLine('Caution', caution)}`)
    : [
        buildMetadataLine(
          'Caution',
          'Tone analysis is uncertain and should be reviewed cautiously.'
        ),
      ];

const formatSocialToneAnalysis = (socialTone: SocialToneAnalysis): readonly string[] => [
  buildMetadataLine('Summary', socialTone.summary),
  buildJoinedMetadataLine('Apparent tone', socialTone.apparentTone, 'Unclear'),
  ...formatSocialSignals(socialTone.socialSignals),
  buildMetadataLine('May indicate', socialTone.possibleSenderState ?? 'Not enough evidence.'),
  buildMetadataLine('Relational stance', socialTone.relationalStance ?? 'Unclear'),
  buildMetadataLine('Urgency/pressure', socialTone.urgencyOrPressure),
  buildMetadataLine('Evidence', socialTone.evidence || 'No specific evidence available.'),
  buildMetadataLine('Confidence', socialTone.confidence),
  ...formatCautions(socialTone.cautions),
];

const buildTruncationSection = (
  cleanThread: CleanThreadText
): GoogleAppsScript.Card_Service.CardSection | undefined =>
  cleanThread.wasTruncated
    ? buildAnalysisSection('Truncation notice', [
        'Cleaned thread text was truncated before mock AI analysis. Review output with this limitation in mind.',
      ])
    : undefined;

const buildCard = (
  subtitle: string,
  sections: readonly GoogleAppsScript.Card_Service.CardSection[]
): GoogleAppsScript.Card_Service.Card => {
  const cardBuilder = CardService.newCardBuilder().setHeader(buildHeader(subtitle));
  sections.forEach((section) => cardBuilder.addSection(section));

  return cardBuilder.build();
};

const formatGeminiMode = (): string => (CONFIG.USE_MOCK_GEMINI ? 'Mock' : 'Real');

const formatGeminiApiKeyStatus = (): string =>
  getGeminiApiKeyStatus() === 'configured' ? 'Configured' : 'Missing';

const buildHomeConfigurationSection = (): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection('Configuration status', [
    buildMetadataLine('Gemini mode', formatGeminiMode()),
    buildMetadataLine('API key status', formatGeminiApiKeyStatus()),
  ]);

export const buildHomeCard = (): GoogleAppsScript.Card_Service.Card =>
  buildCard('Personal Gmail thread brief assistant', [
    buildPlainTextSection('Open a Gmail thread to use EmailSummary.'),
    buildHomeConfigurationSection(),
    buildPrivacyFooterSection(),
  ]);

const buildGmailSummaryEntrySection = (): GoogleAppsScript.Card_Service.CardSection =>
  CardService.newCardSection()
    .addWidget(
      buildTextParagraph(
        'Mock summarization is available. It reads the currently opened thread after you click the button, cleans it in memory, sends it to the mock Gemini client, and displays parsed results.'
      )
    )
    .addWidget(buildTextParagraph('No real Gemini API call is made in mock mode.'))
    .addWidget(buildSummarizeThreadButtonSet());

export const buildGmailSummaryEntryCard = (): GoogleAppsScript.Card_Service.Card =>
  buildCard('Gmail thread context', [buildGmailSummaryEntrySection(), buildPrivacyFooterSection()]);

const buildThreadAnalysisSections = (
  analysis: EmailAnalysis,
  cleanThread: CleanThreadText
): readonly GoogleAppsScript.Card_Service.CardSection[] =>
  [
    buildAnalysisSection('Summary', [
      escapeCardText(analysis.summary || '(No summary returned.)'),
      buildMetadataLine('Confidence', analysis.overallConfidence),
    ]),
    buildAnalysisSection('Social tone', formatSocialToneAnalysis(analysis.socialTone)),
    buildFormattedListSection(
      'Explicit action items',
      analysis.explicitActionItems.map(formatActionItem)
    ),
    buildFormattedListSection(
      'Things to consider / think about',
      analysis.thingsToConsider.map(formatThingToConsider)
    ),
    buildListSection('Suggested reply points', analysis.suggestedReplyPoints),
    buildAnalysisSection(
      'Suggested calendar event',
      formatCalendarSuggestion(analysis.suggestedCalendarEvent)
    ),
    buildAnalysisSection('Suggested label', formatLabelSuggestion(analysis.suggestedLabel)),
    buildAnalysisSection(
      'Follow-up',
      formatFollowUpRecommendation(analysis.followUpRecommendation)
    ),
    buildListSection('Risks / ambiguities', analysis.risksAndAmbiguities),
    buildTruncationSection(cleanThread),
    buildButtonSection(buildRefreshSummaryButtonSet()),
    buildPrivacyFooterSection(),
  ].filter(
    (section): section is GoogleAppsScript.Card_Service.CardSection => section !== undefined
  );

export const buildThreadAnalysisDisplayCard = (
  analysis: EmailAnalysis,
  cleanThread: CleanThreadText
): GoogleAppsScript.Card_Service.Card =>
  buildCard('Mock thread summary', buildThreadAnalysisSections(analysis, cleanThread));

export const buildErrorCard = (
  title: string,
  message: string
): GoogleAppsScript.Card_Service.Card =>
  buildCard(title, [
    buildPlainTextSection(message),
    buildButtonSection(buildRefreshSummaryButtonSet()),
    buildPrivacyFooterSection(),
  ]);
