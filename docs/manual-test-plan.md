# Manual Test Plan

## Current Scaffold

1. Install dependencies.
2. Run `npm run check`.
3. Run `npm run build`.
4. Confirm `dist/Code.js` exists.
5. Confirm `dist/appsscript.json` exists.

## Later clasp Setup

1. Create or select an Apps Script project.
2. Configure `.clasp.json` with `rootDir` set to `dist`.
3. Run `npm run clasp:push`.
4. Open Apps Script with `npm run clasp:open`.
5. Configure add-on settings and test in Gmail.

## Future Product Tests

- Verify only the currently opened Gmail thread is read.
- Verify email content is processed only after user action.
- Verify no raw email body logging occurs.
- Verify Gemini failures show a safe user-facing error.
- Verify AI output is clearly reviewable before user action.
