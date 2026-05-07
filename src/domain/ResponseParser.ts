export type PlaceholderParseResult = Readonly<{
  implemented: false;
  sections: readonly string[];
}>;

export const parsePlaceholderResponse = (_response: unknown): PlaceholderParseResult => ({
  implemented: false,
  sections: [],
});
