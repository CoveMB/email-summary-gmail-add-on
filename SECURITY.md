# Security Policy

## Current Security Posture

EmailSummary runs Gemini analysis in mock mode by default. Real Gemini calls are implemented but remain disabled unless the Apps Script `USE_MOCK_GEMINI` Script Property is set to `false`. The app must not store email text or declare broad OAuth scopes.

Free-tier Gemini API use should be treated as personal testing only. Verify Google's current terms,
quota limits, and data handling requirements before testing, and do not use free-tier testing as a
substitute for Marketplace, shared, production, or security review readiness.

## Secrets

- Do not commit secrets to git.
- Do not create fake API keys.
- Store the Gemini API key in Apps Script Script Properties using `GEMINI_API_KEY`.
- Do not place API keys in source files, manifests, tests, or documentation examples.
- The configuration UI may show whether `GEMINI_API_KEY` is configured, but it must never display the key value.

## Data Handling

- Do not log raw email bodies.
- Do not log prompts or model responses by default.
- Do not log Gemini request bodies, response bodies, API keys, or access tokens.
- In real Gemini mode, cleaned text from the currently opened Gmail thread is sent to Gemini after user action.
- Do not use raw personal, confidential, client, financial, medical, legal, credential, or regulated emails for early real-mode tests.
- Do not persist email content unless a future feature explicitly requires it and documents the reason.
- Prefer least-permission OAuth scopes.

## Real Mode Testing Controls

- Keep the Apps Script `USE_MOCK_GEMINI` Script Property unset or set to `true` for normal development.
- Set the Apps Script `USE_MOCK_GEMINI` Script Property to `false` only for controlled manual real-mode tests.
- Set `GEMINI_API_KEY` in Apps Script Script Properties before a real-mode test.
- Switch the Apps Script `USE_MOCK_GEMINI` Script Property back to `true` immediately after testing.
- Run the project checks after switching modes.

## Dependencies

- Keep dependencies current.
- Run `npm run check` before deployment.
- Review dependency changes before merging.

## Type Safety

The project uses strict TypeScript settings to reduce runtime surprises. Future parsing of external input should use `unknown` and explicit validation instead of unsafe casts.

## Responsible Disclosure

For personal/testing use, report security concerns directly to the project owner. Add a public contact process before Marketplace submission.
