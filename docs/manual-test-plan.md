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
- Verify draft reply creation uses the Gmail compose action only and never sends email automatically.

## Current Mock Summary Test

1. Run `npm run check`.
2. Run `npm run build`.
3. Configure clasp with `rootDir` set to `dist`.
4. Push with `npm run clasp:push`.
5. Open Gmail and select a thread.
6. Open the EmailSummary add-on.
7. Click `Summarize thread`.
8. Confirm the card displays `Mock thread summary`.
9. Confirm the card uses separate readable sections for `Summary`, `Social tone`, `Explicit action items`, `Things to consider / think about`, `Suggested reply points`, `Suggested calendar event`, `Suggested label`, `Follow-up`, and `Risks / ambiguities`.
10. Confirm confidence labels are visible wherever the mock analysis provides confidence.
11. Confirm evidence lines are visible for action items or things to consider when source message IDs are available.
12. Confirm `Social tone` uses cautious labels such as `Possible signal`, `May indicate`, `Confidence`, and `Caution`.
13. Confirm `Social tone` does not diagnose the sender, claim a known psychological state, or use clinical labels.
14. Click `Refresh summary` and confirm the card refreshes without changing OAuth scope behavior.
15. Confirm the `Create draft reply` button appears only on the summary result card.
16. Click `Create draft reply`.
17. Confirm Gmail opens a reply draft for manual review.
18. Confirm the draft body is deterministic and based on suggested reply points when available.
19. Confirm the draft stays neutral, editable, and does not invent commitments.
20. Confirm the draft body includes a reminder to review and edit before sending.
21. Confirm a result with no useful suggested reply points shows the safe fallback message in the draft body.
22. Confirm the add-on does not send the draft.
23. Confirm the Gmail compose/action scope is present in `appsscript.json` and no broader Gmail send or modify scope is present.
24. Confirm no prompt, raw response, or full email body is displayed.
25. Confirm the privacy footer is visible.
26. Confirm a truncation notice appears when the cleaned thread is truncated.
27. Confirm OAuth scopes include only current-message readonly Gmail access, Gmail compose/action access, and add-on execution.

## Current Configuration Status Test

1. Open the EmailSummary homepage card.
2. Confirm it shows `Gemini mode: Mock`.
3. Confirm it shows `API key status: Missing` when `GEMINI_API_KEY` is not set in Apps Script Script Properties.
4. Add `GEMINI_API_KEY` in Apps Script Script Properties without changing source code.
5. Reopen the homepage card.
6. Confirm it shows `API key status: Configured`.
7. Confirm the API key value is never displayed.
8. Confirm no real Gemini network call is made while mock mode is enabled.

## Future Real Gemini Smoke Test

1. Keep `CONFIG.USE_MOCK_GEMINI` set to `true` for normal development.
2. Treat any free-tier Gemini API key as a personal testing resource only; verify Google's current terms and quota limits before use.
3. Prepare a synthetic or clearly non-sensitive Gmail thread. Do not use raw personal, confidential, client, financial, medical, legal, credential, or regulated emails for early tests.
4. For a controlled local test only, set `CONFIG.USE_MOCK_GEMINI` to `false`.
5. Run `npm run check`.
6. Build and push to Apps Script.
7. With no `GEMINI_API_KEY` Script Property set, click `Summarize thread`.
8. Confirm the add-on shows a safe failure card and does not display a key, prompt, raw response, or stack trace.
9. Set `GEMINI_API_KEY` in Apps Script Script Properties.
10. Retry summarization from the synthetic or non-sensitive test thread.
11. Confirm cleaned thread text is sent to Gemini only after clicking `Summarize thread`.
12. Confirm the Gemini response is parsed into the normal result card.
13. Confirm prompts, raw responses, API keys, and email bodies are not logged.
14. Restore `CONFIG.USE_MOCK_GEMINI` to `true` before committing or continuing normal development.
15. Run `npm run check` again after switching back to mock mode.

## Current Error UI Test

1. Open the add-on outside an opened Gmail thread, if possible.
2. Click `Summarize thread`.
3. Confirm the card displays a friendly `No Gmail thread open` error.
4. Reopen a Gmail thread and retry with `Refresh summary`.
5. Confirm Gmail read failures display `Could not read Gmail thread` without raw Gmail data.
6. Confirm parse failures display `Could not parse summary` without raw AI response text.
7. Confirm unexpected failures display `Summary unavailable` without stack traces, tokens, API keys, prompts, responses, or raw email body text.
