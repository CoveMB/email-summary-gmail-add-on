import { CONFIG } from '../config/Config';
import { getGeminiApiKeyStatus } from '../config/GeminiClient';
import { analysisFieldNames, cardSectionTitles, type AnalysisFieldName } from './AnalysisSchema';
import type {
  CleanThreadSourceMessage,
  CleanThreadText,
  EmailAnalysis,
  ExplicitActionItem,
  FollowUpRecommendation,
  SocialToneAnalysis,
  SuggestedLabel,
  ThingToConsider,
} from '../types/types';
import { escapeCardText } from '../utils/CardUtils';
import { buildCreateDraftReplyAction } from './Actions';
import {
  buildLabeledMetadataList,
  buildMetadataLine,
  buildOptionalMetadataLines,
  formatActionOwnerForDisplay,
  formatConfidenceForDisplay,
  formatIsoDateForDisplay,
  formatSourceMessageIdsForDisplay,
  formatUrgencyOrPressureForDisplay,
  type MetadataLineInput,
} from './CardFormatters';
import { createDraftReplyButtonText } from './DraftReplyCopy';
import { getPrivacyNoticeText } from './PrivacyNotice';
import { defaultSocialToneCaution } from './SocialToneDefaults';

const summarizeThreadFunctionName = 'buildThreadSummaryCard';
const emptySectionText = 'None found.';

type OptionalCardSection = GoogleAppsScript.Card_Service.CardSection | undefined;
type CardSectionBuilder = () => OptionalCardSection;

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
  bodyLines: readonly string[],
  emptyText = emptySectionText
): GoogleAppsScript.Card_Service.CardSection =>
  CardService.newCardSection()
    .setHeader(title)
    .addWidget(buildTextParagraph(bodyLines.length > 0 ? bodyLines.join('<br>') : emptyText));

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
  items: readonly string[],
  emptyText = emptySectionText
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(
    title,
    items.map((item) => `- ${escapeCardText(item)}`),
    emptyText
  );

const buildFormattedListSection = (
  title: string,
  items: readonly string[],
  emptyText = emptySectionText
): GoogleAppsScript.Card_Service.CardSection => buildAnalysisSection(title, items, emptyText);

const isAnalysisFieldMissing = (analysis: EmailAnalysis, fieldName: AnalysisFieldName): boolean =>
  analysis.parseMetadata?.missingFields.includes(analysisFieldNames[fieldName].external) ?? false;

const buildMissingFieldEmptyText = (fieldDisplayName: string): string =>
  `AI response did not include ${fieldDisplayName}.`;

const buildMissingFieldAwareEmptyText = (
  analysis: EmailAnalysis,
  fieldName: AnalysisFieldName,
  fieldDisplayName: string
): string =>
  isAnalysisFieldMissing(analysis, fieldName)
    ? buildMissingFieldEmptyText(fieldDisplayName)
    : emptySectionText;

const formatDescribedAnalysisItem = (
  description: string,
  metadataLines: readonly MetadataLineInput[]
): string =>
  [`- ${escapeCardText(description)}`, ...buildOptionalMetadataLines(metadataLines)].join('<br>');

const formatActionItem = (actionItem: ExplicitActionItem): string =>
  formatDescribedAnalysisItem(actionItem.description, [
    { label: 'Owner', value: formatActionOwnerForDisplay(actionItem.owner) },
    { label: 'Confidence', value: formatConfidenceForDisplay(actionItem.confidence) },
    { label: 'Due', value: formatIsoDateForDisplay(actionItem.dueDateIso) },
    { label: 'Evidence', value: formatSourceMessageIdsForDisplay(actionItem.sourceMessageIds) },
  ]);

const formatThingToConsider = (thingToConsider: ThingToConsider): string =>
  formatDescribedAnalysisItem(thingToConsider.description, [
    { label: 'Confidence', value: formatConfidenceForDisplay(thingToConsider.confidence) },
    {
      label: 'Evidence',
      value: formatSourceMessageIdsForDisplay(thingToConsider.sourceMessageIds),
    },
  ]);

const formatLabelSuggestion = (suggestedLabel: SuggestedLabel): readonly string[] =>
  buildOptionalMetadataLines([
    { fallbackValue: '(unnamed)', label: 'Label', value: suggestedLabel.name },
    { label: 'Confidence', value: formatConfidenceForDisplay(suggestedLabel.confidence) },
    { fallbackValue: '(no reason provided)', label: 'Reason', value: suggestedLabel.reason },
  ]);

const formatFollowUpRecommendationValue = (
  shouldFollowUp: FollowUpRecommendation['shouldFollowUp']
): string =>
  shouldFollowUp ? 'Yes' : shouldFollowUp === false ? 'No' : 'No recommendation returned';

const formatFollowUpRecommendation = (
  followUpRecommendation: FollowUpRecommendation,
  missingFollowUpRecommendation: boolean
): readonly string[] =>
  buildOptionalMetadataLines([
    {
      label: 'Recommendation',
      value: formatFollowUpRecommendationValue(followUpRecommendation.shouldFollowUp),
    },
    { label: 'Confidence', value: formatConfidenceForDisplay(followUpRecommendation.confidence) },
    {
      fallbackValue: missingFollowUpRecommendation
        ? buildMissingFieldEmptyText('follow-up recommendation')
        : '(no reason provided)',
      label: 'Reason',
      value: followUpRecommendation.reason,
    },
    {
      label: 'Follow-up date',
      value: formatIsoDateForDisplay(followUpRecommendation.followUpDateIso),
    },
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
    { label: 'Cue summary', value: socialTone.summary },
    { fallbackValue: 'Unclear', label: 'Observed tone', value: socialTone.apparentTone },
  ]),
  ...buildOptionalMetadataLines([
    {
      fallbackValue: 'Not enough evidence.',
      label: 'May indicate',
      value: socialTone.possibleSenderState,
    },
    { fallbackValue: 'Unclear', label: 'Relational stance', value: socialTone.relationalStance },
    {
      label: 'Urgency/pressure',
      value: formatUrgencyOrPressureForDisplay(socialTone.urgencyOrPressure),
    },
    {
      fallbackValue: 'No specific evidence available.',
      label: 'Evidence',
      value: socialTone.evidence,
    },
    { label: 'Confidence', value: formatConfidenceForDisplay(socialTone.confidence) },
  ]),
  ...buildLabeledMetadataLists([
    {
      fallbackValue: 'Not enough evidence to identify a reliable signal.',
      label: 'Communication cue',
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
    ? buildAnalysisSection(cardSectionTitles.truncationNotice, [
        'Cleaned thread text was truncated before AI analysis. Review output with this limitation in mind.',
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

const formatThreadAnalysisCardSubtitle = (): string =>
  CONFIG.USE_MOCK_GEMINI ? 'Mock thread summary' : 'Thread summary';

const buildHomeConfigurationSection = (): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection('Configuration status', [
    buildMetadataLine('Gemini mode', formatGeminiMode()),
    buildMetadataLine('API key status', formatGeminiApiKeyStatus()),
  ]);

const buildSummarySection = (analysis: EmailAnalysis): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(cardSectionTitles.summary, [
    escapeCardText(analysis.summary || '(No summary returned.)'),
    buildMetadataLine('Confidence', formatConfidenceForDisplay(analysis.overallConfidence)),
  ]);

const buildSocialToneSection = (
  socialTone: SocialToneAnalysis
): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(cardSectionTitles.communicationCues, formatSocialToneAnalysis(socialTone));

const buildExplicitActionItemsSection = (
  analysis: EmailAnalysis
): GoogleAppsScript.Card_Service.CardSection =>
  buildFormattedListSection(
    cardSectionTitles.explicitActionItems,
    analysis.explicitActionItems.map(formatActionItem),
    buildMissingFieldAwareEmptyText(analysis, 'explicitActionItems', 'explicit action items')
  );

const buildThingsToConsiderSection = (
  analysis: EmailAnalysis
): GoogleAppsScript.Card_Service.CardSection =>
  buildFormattedListSection(
    cardSectionTitles.thingsToConsider,
    analysis.thingsToConsider.map(formatThingToConsider),
    buildMissingFieldAwareEmptyText(analysis, 'thingsToConsider', 'things to consider')
  );

const buildSuggestedReplyPointsSection = (
  analysis: EmailAnalysis
): GoogleAppsScript.Card_Service.CardSection =>
  buildListSection(
    cardSectionTitles.suggestedReplyPoints,
    analysis.suggestedReplyPoints,
    buildMissingFieldAwareEmptyText(analysis, 'suggestedReplyPoints', 'suggested reply points')
  );

const buildSuggestedLabelSection = (
  suggestedLabel: SuggestedLabel | undefined
): GoogleAppsScript.Card_Service.CardSection | undefined =>
  suggestedLabel
    ? buildAnalysisSection(cardSectionTitles.suggestedLabel, formatLabelSuggestion(suggestedLabel))
    : undefined;

const buildFollowUpSection = (analysis: EmailAnalysis): GoogleAppsScript.Card_Service.CardSection =>
  buildAnalysisSection(
    cardSectionTitles.followUp,
    formatFollowUpRecommendation(
      analysis.followUpRecommendation,
      isAnalysisFieldMissing(analysis, 'followUpRecommendation')
    )
  );

const buildRisksAndAmbiguitiesSection = (
  analysis: EmailAnalysis
): GoogleAppsScript.Card_Service.CardSection =>
  buildListSection(
    cardSectionTitles.risksAndAmbiguities,
    analysis.risksAndAmbiguities,
    buildMissingFieldAwareEmptyText(analysis, 'risksAndAmbiguities', 'risks and ambiguities')
  );

const formatSourceMessage = (sourceMessage: CleanThreadSourceMessage): string => {
  const messageLabel =
    formatSourceMessageIdsForDisplay([sourceMessage.sourceMessageId]) ??
    sourceMessage.sourceMessageId;
  const sourceMessageDetails = [
    sourceMessage.from || 'Unknown sender',
    formatIsoDateForDisplay(sourceMessage.dateIso) ?? 'Unknown date',
    ...(sourceMessage.isOpenedMessage ? ['opened email'] : []),
  ];

  return buildMetadataLine(messageLabel, sourceMessageDetails.join(' - '));
};

const buildSourceMessagesSection = (
  sourceMessages: readonly CleanThreadSourceMessage[] | undefined
): GoogleAppsScript.Card_Service.CardSection | undefined =>
  sourceMessages && sourceMessages.length > 0
    ? buildAnalysisSection(
        cardSectionTitles.sourceMessages,
        sourceMessages.map(formatSourceMessage)
      )
    : undefined;

const buildReviewNotesSection = (
  analysis: EmailAnalysis
): GoogleAppsScript.Card_Service.CardSection | undefined => {
  const warnings = analysis.parseMetadata?.warnings ?? [];

  return warnings.length > 0
    ? buildFormattedListSection(
        cardSectionTitles.reviewNotes,
        warnings.map((warning) => `- ${escapeCardText(warning)}`)
      )
    : undefined;
};

const buildCreateDraftReplySection = (
  suggestedReplyPoints: readonly string[]
): GoogleAppsScript.Card_Service.CardSection | undefined =>
  suggestedReplyPoints.length > 0
    ? buildButtonSection(buildCreateDraftReplyButtonSet(suggestedReplyPoints))
    : undefined;

export const buildHomeCard = (): GoogleAppsScript.Card_Service.Card =>
  buildCard('Personal Gmail thread brief assistant', [
    buildPlainTextSection('Open a Gmail thread to use EmailSummary.'),
    buildHomeConfigurationSection(),
    buildPrivacyFooterSection(),
  ]);

const buildGmailSummaryEntrySection = (): GoogleAppsScript.Card_Service.CardSection => {
  const modeDescription = CONFIG.USE_MOCK_GEMINI
    ? 'Mock summarization is available. It reads the currently opened thread after you click the button, cleans it in memory, sends it to the mock Gemini client, and displays parsed results.'
    : 'Real Gemini summarization is enabled. It reads the currently opened thread after you click the button, cleans it in memory, sends cleaned thread text to Gemini, and displays parsed results.';
  const modePrivacyDescription = CONFIG.USE_MOCK_GEMINI
    ? 'No real Gemini API call is made in mock mode.'
    : 'Use real mode only with synthetic or non-sensitive threads during personal MVP testing.';

  return CardService.newCardSection()
    .addWidget(buildTextParagraph(modeDescription))
    .addWidget(buildTextParagraph(modePrivacyDescription))
    .addWidget(buildSummarizeThreadButtonSet());
};

export const buildGmailSummaryEntryCard = (): GoogleAppsScript.Card_Service.Card =>
  buildCard('Gmail thread context', [buildGmailSummaryEntrySection(), buildPrivacyFooterSection()]);

const buildDefinedSections = (
  sectionBuilders: readonly CardSectionBuilder[]
): readonly GoogleAppsScript.Card_Service.CardSection[] =>
  sectionBuilders.flatMap((buildSection) => {
    const section = buildSection();

    return section ? [section] : [];
  });

const buildThreadAnalysisSections = (
  analysis: EmailAnalysis,
  cleanThread: CleanThreadText
): readonly GoogleAppsScript.Card_Service.CardSection[] =>
  buildDefinedSections([
    () => buildSummarySection(analysis),
    () => buildExplicitActionItemsSection(analysis),
    () => buildFollowUpSection(analysis),
    () => buildRisksAndAmbiguitiesSection(analysis),
    () => buildThingsToConsiderSection(analysis),
    () => buildSuggestedReplyPointsSection(analysis),
    () => buildSuggestedLabelSection(analysis.suggestedLabel),
    () => buildSocialToneSection(analysis.socialTone),
    () => buildSourceMessagesSection(cleanThread.sourceMessages),
    () => buildTruncationSection(cleanThread),
    () => buildReviewNotesSection(analysis),
    () => buildCreateDraftReplySection(analysis.suggestedReplyPoints),
    () => buildButtonSection(buildRefreshSummaryButtonSet()),
    () => buildPrivacyFooterSection(),
  ]);

export const buildThreadAnalysisDisplayCard = (
  analysis: EmailAnalysis,
  cleanThread: CleanThreadText
): GoogleAppsScript.Card_Service.Card =>
  buildCard(formatThreadAnalysisCardSubtitle(), buildThreadAnalysisSections(analysis, cleanThread));

export const buildErrorCard = (
  title: string,
  message: string
): GoogleAppsScript.Card_Service.Card =>
  buildCard(title, [
    buildPlainTextSection(message),
    buildButtonSection(buildRefreshSummaryButtonSet()),
    buildPrivacyFooterSection(),
  ]);
