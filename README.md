# EmailSummary

EmailSummary is a personal Google Workspace Gmail Add-on scaffold for summarizing the currently opened Gmail thread.

The MVP goal is a private add-on that can later let a user click "Summarize thread" and review structured output such as a summary, action items, reply points, follow-up recommendations, and risks. Product logic is intentionally not implemented in this initialization step.

The architecture is personal-use ready while keeping a Marketplace-ready path: least-permission OAuth, clear privacy documentation, typed source, reproducible builds, and a clean Apps Script deployment boundary.

## Tech Stack

- Google Workspace Gmail Add-on
- Google Apps Script V8
- TypeScript
- Rollup for Apps Script-compatible bundling
- clasp for Apps Script deployment
- Vitest for pure-function tests
- Gemini API integration later

## Repository Model

GitHub is the source of truth. TypeScript source lives in `src/`. Rollup bundles the Apps Script runtime output into `dist/`, and clasp should later push `dist/` to Apps Script.

`dist/` is generated and gitignored to keep source review clean and avoid committing build artifacts. Run `npm run build` before any clasp push.

## Local Setup

```sh
npm install
```

## Development Commands

```sh
npm run format
npm run format:check
npm run lint
npm run lint:fix
npm run test
npm run build
npm run check
```

## Apps Script Build

```sh
npm run build
```

The build command creates:

- `dist/Code.js`
- `dist/appsscript.json`

The bundled JavaScript is intended for Apps Script V8 and does not rely on runtime module imports.

## clasp Deployment Placeholder

When clasp is configured later, `.clasp.json` should point at `dist/`:

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "dist"
}
```

Do not commit `.clasprc.json`. It contains local clasp authentication state.

After clasp setup:

```sh
npm run clasp:push
npm run clasp:open
```

## Security And Privacy

This scaffold does not read Gmail content, call Gemini, store email text, or declare broad OAuth scopes. Future implementation should process only the currently opened Gmail thread after explicit user action, avoid raw email logging, and keep secrets in Apps Script Script Properties.
