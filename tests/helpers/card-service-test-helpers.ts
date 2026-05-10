export type CardHeaderModel = Readonly<{
  subtitle?: string;
  title?: string;
  type: 'cardHeader';
}>;

export type TextParagraphModel = Readonly<{
  text?: string;
  type: 'textParagraph';
}>;

export type ActionModel = Readonly<{
  functionName?: string;
  parameters?: Readonly<Record<string, string>>;
  type: 'action';
}>;

export type TextButtonModel = Readonly<{
  composeAction?: Readonly<{
    action: ActionModel;
    composedEmailType: string;
  }>;
  onClickAction?: ActionModel;
  text?: string;
  type: 'textButton';
}>;

export type ButtonSetModel = Readonly<{
  buttons: TextButtonModel[];
  type: 'buttonSet';
}>;

export type CardSectionModel = Readonly<{
  header?: string;
  type: 'cardSection';
  widgets: Array<TextParagraphModel | ButtonSetModel>;
}>;

export type CardModel = Readonly<{
  header?: CardHeaderModel;
  sections: CardSectionModel[];
  type: 'card';
}>;

export type ComposeActionResponseModel = Readonly<{
  draft?: unknown;
  type: 'composeActionResponse';
}>;

type CardWidgetModel = TextParagraphModel | ButtonSetModel;

type MutableCardHeaderModel = Omit<CardHeaderModel, 'subtitle' | 'title'> &
  Partial<Pick<CardHeaderModel, 'subtitle' | 'title'>> & {
    setSubtitle: (subtitle: string) => MutableCardHeaderModel;
    setTitle: (title: string) => MutableCardHeaderModel;
  };

type MutableActionModel = Omit<ActionModel, 'functionName' | 'parameters'> &
  Partial<Pick<ActionModel, 'functionName' | 'parameters'>> & {
    setFunctionName: (functionName: string) => MutableActionModel;
    setParameters: (parameters: Readonly<Record<string, string>>) => MutableActionModel;
  };

type MutableTextParagraphModel = Omit<TextParagraphModel, 'text'> &
  Partial<Pick<TextParagraphModel, 'text'>> & {
    setText: (text: string) => MutableTextParagraphModel;
  };

type MutableTextButtonModel = Omit<TextButtonModel, 'composeAction' | 'onClickAction' | 'text'> &
  Partial<Pick<TextButtonModel, 'composeAction' | 'onClickAction' | 'text'>> & {
    setComposeAction: (action: ActionModel, composedEmailType: string) => MutableTextButtonModel;
    setOnClickAction: (action: ActionModel) => MutableTextButtonModel;
    setText: (text: string) => MutableTextButtonModel;
  };

type MutableButtonSetModel = ButtonSetModel & {
  addButton: (button: TextButtonModel) => MutableButtonSetModel;
};

type MutableCardSectionModel = Omit<CardSectionModel, 'header'> &
  Partial<Pick<CardSectionModel, 'header'>> & {
    addWidget: (widget: CardWidgetModel) => MutableCardSectionModel;
    setHeader: (header: string) => MutableCardSectionModel;
  };

const buildCardHeader = (): GoogleAppsScript.Card_Service.CardHeader => {
  const cardHeader: MutableCardHeaderModel = {
    setSubtitle: (subtitle: string) => {
      cardHeader.subtitle = subtitle;

      return cardHeader;
    },
    setTitle: (title: string) => {
      cardHeader.title = title;

      return cardHeader;
    },
    type: 'cardHeader',
  };

  return cardHeader as unknown as GoogleAppsScript.Card_Service.CardHeader;
};

const buildTextParagraph = (): GoogleAppsScript.Card_Service.TextParagraph => {
  const textParagraph: MutableTextParagraphModel = {
    setText: (text: string): MutableTextParagraphModel => {
      textParagraph.text = text;

      return textParagraph;
    },
    type: 'textParagraph',
  };

  return textParagraph;
};

const buildAction = (): GoogleAppsScript.Card_Service.Action => {
  const action: MutableActionModel = {
    setFunctionName: (functionName: string) => {
      action.functionName = functionName;

      return action;
    },
    setParameters: (parameters: Readonly<Record<string, string>>) => {
      action.parameters = parameters;

      return action;
    },
    type: 'action',
  };

  return action as unknown as GoogleAppsScript.Card_Service.Action;
};

const buildTextButton = (): GoogleAppsScript.Card_Service.TextButton => {
  const textButton: MutableTextButtonModel = {
    setComposeAction: (action: ActionModel, composedEmailType: string): MutableTextButtonModel => {
      textButton.composeAction = { action, composedEmailType };

      return textButton;
    },
    setOnClickAction: (action: ActionModel): MutableTextButtonModel => {
      textButton.onClickAction = action;

      return textButton;
    },
    setText: (text: string) => {
      textButton.text = text;

      return textButton;
    },
    type: 'textButton',
  };

  return textButton as unknown as GoogleAppsScript.Card_Service.TextButton;
};

const buildButtonSet = (): GoogleAppsScript.Card_Service.ButtonSet => {
  const buttonSet: MutableButtonSetModel = {
    addButton: (button: TextButtonModel): MutableButtonSetModel => {
      buttonSet.buttons.push(button);

      return buttonSet;
    },
    buttons: [],
    type: 'buttonSet',
  };

  return buttonSet as unknown as GoogleAppsScript.Card_Service.ButtonSet;
};

const buildCardSection = (): GoogleAppsScript.Card_Service.CardSection => {
  const cardSection: MutableCardSectionModel = {
    addWidget: (widget: CardWidgetModel) => {
      cardSection.widgets.push(widget);

      return cardSection;
    },
    setHeader: (header: string) => {
      cardSection.header = header;

      return cardSection;
    },
    type: 'cardSection',
    widgets: [],
  };

  return cardSection as unknown as GoogleAppsScript.Card_Service.CardSection;
};

const buildCardBuilder = (): GoogleAppsScript.Card_Service.CardBuilder => {
  const card: CardModel = { sections: [], type: 'card' };
  const mutableCard = card as { header?: CardHeaderModel; sections: CardSectionModel[] };
  const builder = {
    addSection: (section: CardSectionModel) => {
      mutableCard.sections.push(section);

      return builder;
    },
    build: (): CardModel => card,
    setHeader: (header: CardHeaderModel) => {
      mutableCard.header = header;

      return builder;
    },
  };

  return builder as unknown as GoogleAppsScript.Card_Service.CardBuilder;
};

const buildComposeActionResponseBuilder =
  (): GoogleAppsScript.Card_Service.ComposeActionResponseBuilder => {
    const response: ComposeActionResponseModel = { type: 'composeActionResponse' };
    const mutableResponse = response as { draft?: unknown };
    const builder = {
      build: (): ComposeActionResponseModel => response,
      setGmailDraft: (draft: unknown) => {
        mutableResponse.draft = draft;

        return builder;
      },
    };

    return builder as unknown as GoogleAppsScript.Card_Service.ComposeActionResponseBuilder;
  };

export const installCardServiceMock = (): void => {
  Object.defineProperty(globalThis, 'CardService', {
    configurable: true,
    value: {
      ComposedEmailType: {
        REPLY_AS_DRAFT: 'REPLY_AS_DRAFT',
      },
      newAction: buildAction,
      newButtonSet: buildButtonSet,
      newCardBuilder: buildCardBuilder,
      newCardHeader: buildCardHeader,
      newCardSection: buildCardSection,
      newComposeActionResponseBuilder: buildComposeActionResponseBuilder,
      newTextButton: buildTextButton,
      newTextParagraph: buildTextParagraph,
    },
  });
};

export const uninstallCardServiceMock = (): void => {
  Reflect.deleteProperty(globalThis, 'CardService');
};

export const readTextParagraphs = (card: CardModel): readonly TextParagraphModel[] =>
  card.sections.flatMap((section) =>
    section.widgets.filter(
      (widget): widget is TextParagraphModel => widget.type === 'textParagraph'
    )
  );

export const readCardText = (card: CardModel): string =>
  readTextParagraphs(card)
    .map((textParagraph) => textParagraph.text ?? '')
    .join('\n');

export const readSectionHeaders = (card: CardModel): readonly (string | undefined)[] =>
  card.sections.map((section) => section.header);

export const readVisibleSectionHeaders = (card: CardModel): readonly string[] =>
  readSectionHeaders(card).filter((header): header is string => Boolean(header));

export const readButtons = (card: CardModel): readonly TextButtonModel[] =>
  card.sections.flatMap((section) =>
    section.widgets
      .filter((widget): widget is ButtonSetModel => widget.type === 'buttonSet')
      .flatMap((buttonSet) => buttonSet.buttons)
  );

export const readRequiredButton = (card: CardModel, buttonText: string): TextButtonModel => {
  const button = readButtons(card).find((candidateButton) => candidateButton.text === buttonText);

  if (!button) {
    throw new Error(`Expected card button: ${buttonText}`);
  }

  return button;
};
