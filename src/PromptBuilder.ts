export type PlaceholderPrompt = Readonly<{
  body: string;
  title: string;
}>;

export const buildPlaceholderPrompt = (): PlaceholderPrompt => ({
  body: 'Prompt assembly is intentionally not implemented yet.',
  title: 'EmailSummary prompt placeholder',
});
