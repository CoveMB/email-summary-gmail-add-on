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

## Current Mock Summary Test

1. Run `npm run check`.
2. Run `npm run build`.
3. Configure clasp with `rootDir` set to `dist`.
4. Push with `npm run clasp:push`.
5. Open Gmail and select a thread.
6. Open the ThreadBrief add-on.
7. Click `Summarize thread`.
8. Confirm the card displays `Mock thread summary`.
9. Confirm the card includes summary, explicit action items, things to consider, reply points, calendar suggestion, label suggestion, follow-up recommendation, and risks / ambiguities.
10. Confirm no prompt, raw response, or full email body is displayed.
11. Confirm the output states mock mode did not call Gemini.
12. Confirm a truncation notice appears when the cleaned thread is truncated.
13. Confirm OAuth scopes include only current-message readonly Gmail access plus add-on execution.
