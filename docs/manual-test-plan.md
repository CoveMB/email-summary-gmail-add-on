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
- Verify thread cleaning removes common quoted replies and signatures without deleting new content.
- Verify cleaned thread text respects configured message and character limits.
- Verify no raw email body logging occurs.
- Verify Gemini failures show a safe user-facing error.
- Verify AI output is clearly reviewable before user action.

## Current Gmail Metadata Test

1. Run `npm run check`.
2. Run `npm run build`.
3. Configure clasp with `rootDir` set to `dist`.
4. Push with `npm run clasp:push`.
5. Open Gmail and select a thread.
6. Open the EmailSummary add-on.
7. Click `Read thread metadata`.
8. Confirm the card displays subject, message count, latest sender, and latest date.
9. Confirm the card displays `Debug body preview`.
10. Confirm the preview is at most 300 characters.
11. Confirm no full email body is displayed.
12. Confirm OAuth scopes include only current-message readonly Gmail access plus add-on execution.
