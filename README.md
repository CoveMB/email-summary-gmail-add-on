# EmailSummary

EmailSummary is a personal Google Workspace Gmail Add-on for summarizing the currently opened Gmail thread after explicit user action.

The MVP lets a user click "Summarize thread", read only the currently opened Gmail thread, clean the thread text in memory, analyze it with mock Gemini by default or real Gemini when explicitly enabled, then review structured output such as a summary, action items, social tone, reply points, follow-up recommendations, and risks. It can also create a user-reviewed draft reply from suggested reply points without sending email.

The architecture is personal-use ready while keeping a Marketplace-ready path: least-permission OAuth, clear privacy documentation, typed source, reproducible builds, and a clean Apps Script deployment boundary.

## Tech Stack

- Google Workspace Gmail Add-on
- Google Apps Script V8
- TypeScript
- Rollup for Apps Script-compatible bundling
- clasp for Apps Script deployment
- Vitest for pure-function tests
- Gemini API integration behind mock mode

## Repository Model

GitHub is the source of truth. TypeScript source lives in `src/`. Rollup bundles the Apps Script runtime output into `dist/`, and clasp should later push `dist/` to Apps Script.

`dist/` is generated and gitignored to keep source review clean and avoid committing build artifacts. Run `pnpm run build` before any clasp push.

## Local Setup

```sh
pnpm install
```

## Development Commands

```sh
pnpm run format:fix
pnpm run lint:fix
pnpm run test
pnpm run build
pnpm run check
```

## Continuous Integration

GitHub Actions runs `pnpm install --frozen-lockfile` and `pnpm run check` on pushes and pull requests. The CI workflow validates formatting, linting, tests, and build output only. It does not deploy, run `clasp push`, or require secrets.

## Apps Script Build

```sh
pnpm run build
```

The build command creates:

- `dist/Code.js`
- `dist/appsscript.json`

The bundled JavaScript is intended for Apps Script V8 and does not rely on runtime module imports.

## Gemini Real Mode Manual Testing

EmailSummary runs in mock Gemini mode by default. Mock mode should remain the normal development
mode because it avoids network calls and avoids sending email content to Gemini.

Real Gemini mode is available for controlled personal testing only. If you use a free-tier Gemini
API key, treat it as a personal testing resource, verify Google's current terms and quota limits,
and do not use it for Marketplace, shared, production, or high-volume testing.

When real mode is enabled, cleaned text from the currently opened Gmail thread is sent to the Gemini
API after the user clicks `Summarize thread`. Do not use raw personal, confidential, regulated,
client, financial, medical, legal, credential, or otherwise sensitive emails for early tests. Use
synthetic or non-sensitive test threads.

To set the Gemini API key in Apps Script:

1. Open the Apps Script project.
2. Go to Project Settings.
3. Add a Script Property named `GEMINI_API_KEY`.
4. Set its value to the real Gemini API key.

Do not place the key in source files, manifests, local environment files, tests, or documentation.

To switch from mock mode to real mode for a manual test:

1. Confirm `GEMINI_API_KEY` is configured in Apps Script Script Properties.
2. In Apps Script Script Properties, set `USE_MOCK_GEMINI` to `false`.
3. Run `pnpm run check`.
4. Run `pnpm run build`.
5. Push the generated `dist/` output with clasp.
6. Test only with synthetic or non-sensitive Gmail threads.

To switch back to mock mode:

1. In Apps Script Script Properties, set `USE_MOCK_GEMINI` back to `true` or remove it.
2. Run `pnpm run check`.
3. Run `pnpm run build`.
4. Push `dist/` again if you had deployed real mode.

Do not commit real-mode test changes unless a future task explicitly requires it.

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
pnpm run clasp:push
pnpm run clasp:open
```

## Future clasp Deploy Or Update Plan

Deployment automation should stay separate from CI and should be added only when explicitly needed. Required work:

- Keep `pnpm-lock.yaml` committed and require frozen-lockfile installs.
- Decide whether automation should run on manual dispatch only or on tagged releases.
- Store clasp credentials and the Apps Script script ID as GitHub secrets.
- Generate `.clasp.json` during the workflow with `rootDir` set to `dist/`.
- Run `pnpm install --frozen-lockfile`, `pnpm run check`, and then `pnpm run clasp:push`.
- Add a dry-run or staging script target if production and test Apps Script projects are both used.
- Document which secrets are required, who can rotate them, and how deployment is reviewed.
- Keep deployment workflows from running on untrusted pull requests.

## Security And Privacy

EmailSummary should process only the currently opened Gmail thread after explicit user action, avoid raw email logging, and keep secrets in Apps Script Script Properties. Mock mode does not call Gemini. Real mode sends cleaned thread text to Gemini and should be used only for controlled personal testing at this stage.
