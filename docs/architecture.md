# Architecture

EmailSummary keeps source code and deployable Apps Script output separate.

```text
GitHub repo
  -> TypeScript src/
  -> build step
  -> dist/
  -> clasp push
  -> Apps Script
  -> Gmail Add-on
```

## Source

`src/` contains TypeScript. Apps Script does not run this TypeScript directly.

## Build

Rollup bundles `src/Code.ts` into `dist/Code.js` as Apps Script-compatible JavaScript for the V8 runtime. The build also copies `appsscript.json` into `dist/`.

Apps Script entry points are attached to `globalThis` so they remain callable after bundling:

- `buildHomePage`
- `buildGmailContextualCard`

## Deployment

clasp should be configured later with `rootDir` set to `dist`. GitHub remains the source of truth; `dist/` is generated.

## Future Runtime Flow

The future product flow should be:

1. User opens a Gmail thread.
2. Add-on displays a contextual card.
3. User starts summarization.
4. Add-on reads only the current thread.
5. Add-on sends cleaned text to Gemini.
6. Add-on displays structured results for user review.

That flow is not implemented yet.
