export type PlaceholderActionState = Readonly<{
  enabled: false;
  reason: string;
}>;

export const buildPlaceholderActionState = (): PlaceholderActionState => ({
  enabled: false,
  reason: 'Actions are intentionally not implemented yet.',
});
