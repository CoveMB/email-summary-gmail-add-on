# ThreadBrief

ThreadBrief is a personal Google Workspace Gmail Add-on scaffold for summarizing the currently opened Gmail thread.

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

`dist/` is generated and gitignored to keep source review clean and avoid committing build artifacts. Run `pnpm run build` before any clasp push.

## Local Setup

```sh
pnpm install
```

## Development Commands

```sh
pnpm run format
pnpm run format:check
pnpm run lint
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

This scaffold does not read Gmail content, call Gemini, store email text, or declare broad OAuth scopes. Future implementation should process only the currently opened Gmail thread after explicit user action, avoid raw email logging, and keep secrets in Apps Script Script Properties.
