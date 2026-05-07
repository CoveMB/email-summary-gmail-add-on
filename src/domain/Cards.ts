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
import { buildCreateDraftReplyAction } from './Actions';
import {
  buildLabeledMetadataList,
  buildMetadataLine,
  buildOptionalMetadataLines,
  type MetadataLineInput,
} from './CardFormatters';
import { createDraftReplyButtonText } from './DraftReplyCopy';
import { getPrivacyNoticeText } from './PrivacyNotice';
import { defaultSocialToneCaution } from './SocialToneDefaults';

const summarizeThreadFunctionName = 'buildThreadSummaryCard';
const emptySectionText = 'None found.';

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

const buildCreateDraftReplyButtonSet = (
  suggestedReplyPoints: readonly string[]
): GoogleAppsScript.Card_Service.ButtonSet => {
  const button = CardService.newTextButton()
    .setText(createDraftReplyButtonText)
    .setComposeAction(
      buildCreateDraftReplyAction(suggestedReplyPoints),
      CardService.ComposedEmailType.REPLY_AS_DRAFT
    );

  return CardService.newButtonSet().addButton(button);
};

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

const formatDescribedAnalysisItem = (
  description: string,
  metadataLines: readonly MetadataLineInput[]
): string =>
  [`- ${escapeCardText(description)}`, ...buildOptionalMetadataLines(metadataLines)].join('<br>');

const formatActionItem = (actionItem: ExplicitActionItem): string =>
  formatDescribedAnalysisItem(actionItem.description, [
    { label: 'Owner', value: actionItem.owner },
    { label: 'Confidence', value: actionItem.confidence },
    { label: 'Due', value: actionItem.dueDateIso },
    { label: 'Evidence', value: actionItem.sourceMessageIds },
  ]);

const formatThingToConsider = (thingToConsider: ThingToConsider): string =>
  formatDescribedAnalysisItem(thingToConsider.description, [
    { label: 'Confidence', value: thingToConsider.confidence },
    { label: 'Evidence', value: thingToConsider.sourceMessageIds },
  ]);

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

type LabeledMetadataListInput = Readonly<{
  fallbackValue: string;
  label: string;
  values: readonly string[];
}>;

const buildLabeledMetadataLists = (
  labeledMetadataLists: readonly LabeledMetadataListInput[]
): readonly string[] =>
  labeledMetadataLists.flatMap((labeledMetadataList) =>
    buildLabeledMetadataList(
      labeledMetadataList.label,
      labeledMetadataList.values,
      labeledMetadataList.fallbackValue
    )
  );

const formatSocialToneAnalysis = (socialTone: SocialToneAnalysis): readonly string[] => [
  ...buildOptionalMetadataLines([
    { label: 'Summary', value: socialTone.summary },
    { fallbackValue: 'Unclear', label: 'Apparent tone', value: socialTone.apparentTone },
  ]),
  ...buildOptionalMetadataLines([
    {
      fallbackValue: 'Not enough evidence.',
      label: 'May indicate',
      value: socialTone.possibleSenderState,
    },
    { fallbackValue: 'Unclear', label: 'Relational stance', value: socialTone.relationalStance },
    { label: 'Urgency/pressure', value: socialTone.urgencyOrPressure },
    {
      fallbackValue: 'No specific evidence available.',
      label: 'Evidence',
      value: socialTone.evidence,
    },
    { label: 'Confidence', value: socialTone.confidence },
  ]),
  ...buildLabeledMetadataLists([
    {
      fallbackValue: 'Not enough evidence to identify a reliable signal.',
      label: 'Possible signal',
      values: socialTone.socialSignals,
    },
    {
      fallbackValue: defaultSocialToneCaution,
      label: 'Caution',
      values: socialTone.cautions,
    },
  ]),
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

const buildSummarySection = (analysis: EmailAnalysis): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection('Summary', [
    escapeCardText(analysis.summary || '(No summary returned.)'),
    buildMetadataLine('Confidence', analysis.overallConfidence),
  ]);

const buildSocialToneSection = (
  socialTone: SocialToneAnalysis
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection('Social tone', formatSocialToneAnalysis(socialTone));

const buildExplicitActionItemsSection = (
  explicitActionItems: readonly ExplicitActionItem[]
): GoogleAppsScript.Card_Service.CardSection =>
  buildFormattedListSection('Explicit action items', explicitActionItems.map(formatActionItem));

const buildThingsToConsiderSection = (
  thingsToConsider: readonly ThingToConsider[]
): GoogleAppsScript.Card_Service.CardSection =>
  buildFormattedListSection(
    'Things to consider / think about',
    thingsToConsider.map(formatThingToConsider)
  );

const buildSuggestedReplyPointsSection = (
  suggestedReplyPoints: readonly string[]
): GoogleAppsScript.Card_Service.CardSection =>
  buildListSection('Suggested reply points', suggestedReplyPoints);

const buildSuggestedCalendarEventSection = (
  suggestedCalendarEvent: SuggestedCalendarEvent | undefined
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(
    'Suggested calendar event',
    formatCalendarSuggestion(suggestedCalendarEvent)
  );

const buildSuggestedLabelSection = (
  suggestedLabel: SuggestedLabel | undefined
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection('Suggested label', formatLabelSuggestion(suggestedLabel));

const buildFollowUpSection = (
  followUpRecommendation: FollowUpRecommendation
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection('Follow-up', formatFollowUpRecommendation(followUpRecommendation));

const buildRisksAndAmbiguitiesSection = (
  risksAndAmbiguities: readonly string[]
): GoogleAppsScript.Card_Service.CardSection =>
  buildListSection('Risks / ambiguities', risksAndAmbiguities);

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
    buildSummarySection(analysis),
    buildSocialToneSection(analysis.socialTone),
    buildExplicitActionItemsSection(analysis.explicitActionItems),
    buildThingsToConsiderSection(analysis.thingsToConsider),
    buildSuggestedReplyPointsSection(analysis.suggestedReplyPoints),
    buildSuggestedCalendarEventSection(analysis.suggestedCalendarEvent),
    buildSuggestedLabelSection(analysis.suggestedLabel),
    buildFollowUpSection(analysis.followUpRecommendation),
    buildRisksAndAmbiguitiesSection(analysis.risksAndAmbiguities),
    buildTruncationSection(cleanThread),
    buildButtonSection(buildCreateDraftReplyButtonSet(analysis.suggestedReplyPoints)),
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
