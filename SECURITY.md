# Security Policy

## Current Security Posture

EmailSummary currently contains only scaffold code. It does not read Gmail content, call external APIs, store email text, or declare broad OAuth scopes.

## Secrets

- Do not commit secrets to git.
- Do not create fake API keys.
- Store a future Gemini API key in Apps Script Script Properties.
- Do not place API keys in source files, manifests, tests, or documentation examples.

## Data Handling

- Do not log raw email bodies.
- Do not log prompts or model responses by default.
- Do not persist email content unless a future feature explicitly requires it and documents the reason.
- Prefer least-permission OAuth scopes.

## Dependencies

- Keep dependencies current.
- Run `npm run check` before deployment.
- Review dependency changes before merging.

## Type Safety

The project uses strict TypeScript settings to reduce runtime surprises. Future parsing of external input should use `unknown` and explicit validation instead of unsafe casts.

## Responsible Disclosure

For personal/testing use, report security concerns directly to the project owner. Add a public contact process before Marketplace submission.
