# AGENTS.md

## Project: EmailSummary

EmailSummary is a personal Google Workspace Gmail Add-on designed to remain Marketplace-ready.

The add-on will eventually:

- appear when a user opens a Gmail thread
- summarize only the currently opened thread after explicit user action
- identify explicit action items
- identify “things to consider / think about”
- suggest reply points
- suggest calendar events
- suggest labels
- suggest follow-up needs
- optionally create a user-reviewed Gmail draft reply

The project must prioritize:

- least-permission OAuth design
- privacy-preserving Gmail access
- Marketplace readiness
- strict TypeScript safety
- small, reviewable changes
- clean, functional, testable code

---

# Agent collaboration and maintainability rules

## AI-friendly code clarity

Write code so another AI agent can quickly understand it, safely modify it, and build on it.

Prefer:

- Fully spelled, descriptive names for variables, functions, types, constants, and files.
- Names that reveal intent, domain meaning, and usage.
- Small functions with one clear responsibility.
- Clear separation of concerns.
- Explicit types, interfaces, and schemas when they improve clarity.
- Documentation that explains intent, assumptions, constraints, side effects, and non-obvious decisions.

Avoid:

- Vague or abbreviated names unless they are standard and unmistakable.
- Generic names like `data`, `value`, `item`, `result`, `handle`, `process`, `manager`, `helper`, or `util` when a more specific name is possible.
- Large multi-purpose functions.
- Tiny wrapper functions that add indirection without adding meaning.
- Comments that merely restate the code.

When naming:

- Prefer intention-revealing names over short names.
- Prefer domain language over generic placeholders.
- Make names specific enough that another agent can infer purpose without reading the whole project.

When documenting:

- Explain why, not just what.
- Document inputs, outputs, constraints, side effects, and failure modes when useful.
- Mention important design decisions and tradeoffs.

## Search and reuse before creating new code

Before creating a new function, utility, type, component, config object, prompt, schema, or business rule, first check whether an equivalent or related implementation already exists in the codebase.

Prefer:

- Reusing existing utilities when they already fit the need.
- Extending existing abstractions when the new behavior clearly belongs there.
- Refactoring duplicated logic into a shared helper when the same pattern appears more than once.
- Following existing naming, file placement, and architectural conventions.

Avoid:

- Creating a new helper just because it is faster.
- Duplicating logic with slightly different names.
- Creating parallel abstractions that solve the same problem.
- Adding a new dependency when existing code already provides the needed behavior.

Before implementing new logic, search for:

- Similar function names.
- Similar business rules.
- Similar UI components.
- Existing constants or config values.
- Existing types, schemas, validators, or API wrappers.
- Existing tests that describe the intended behavior.

If an existing implementation is found, decide whether to:

1. Reuse it directly.
2. Extend it safely.
3. Refactor it into a more general shared utility.
4. Leave it unchanged and explain why a new implementation is necessary.

When creating something new, document briefly why reuse was not appropriate.

Before finishing a change, verify:

- No equivalent function, utility, type, component, config, or business rule already existed.
- No duplicated business rule, prompt fragment, string value, or model setting was introduced.
- Existing abstractions were reused where appropriate.
- Any new abstraction has a clear reason to exist.
- The new code is placed where future agents would naturally look for it.
- ***
- 
## Clear and simple implementation

Prefer clear, simple implementations that make complexity visible instead of hiding it behind clever abstractions.

The goal is not to make code look short; the goal is to make behavior easy to understand, verify, modify, and debug.

Prefer:
- Straightforward control flow.
- Explicit data transformations.
- Small, named steps for complex logic.
- Simple abstractions that match real project concepts.
- Code that makes edge cases and tradeoffs visible.
- Clear error handling instead of silent failure.
- Readability over cleverness.

Avoid:
- Clever one-liners that compress important logic.
- Overly generic abstractions before they are needed.
- Hidden side effects.
- Deeply nested logic.
- Magic behavior that depends on implicit conventions.
- Premature optimization.
- Hiding complexity inside vague helpers like `processData`, `handleLogic`, or `doEverything`.

When complexity is necessary:
- Surface it with clear names, comments, types, and function boundaries.
- Explain why the complexity exists.
- Keep the complex part isolated from simpler surrounding code.
- Add tests around the complex behavior when possible.

Before finishing a change, ask:
- Is this implementation easy for another agent to understand?
- Is the complexity essential or accidental?
- Would a simpler implementation be easier to maintain?
- Are edge cases visible and intentionally handled?
- Would debugging this be straightforward?

## Scope control

Make the smallest safe change that fully satisfies the task.

Prefer:
- Focused changes directly related to the request.
- Preserving existing behavior unless the task explicitly requires changing it.
- Updating nearby tests and documentation when behavior changes.
- Separating refactors from feature changes unless the refactor is necessary.

Avoid:
- Unrelated cleanup.
- Rewriting large areas of code without a clear reason.
- Changing architecture casually.
- Renaming files, functions, or types unless it improves clarity and is worth the migration cost.
- Introducing new patterns when existing project patterns are good enough.

If a broader issue is discovered, mention it as follow-up instead of fixing it inside an unrelated task.

## Plan before changing code

Before making non-trivial changes, first understand the relevant flow.

The agent should:
1. Identify the files likely involved.
2. Read existing related code before editing.
3. Check for existing utilities, types, schemas, prompts, constants, and tests.
4. Form a brief implementation plan.
5. Make the smallest coherent change.
6. Validate the change.

For complex tasks, write the plan in a concise checklist before editing. Update the plan if discovery shows the first approach was wrong.

## Small reviewable changes

Prefer changes that are easy to review, test, and revert.

When possible:
- Make one conceptual change at a time.
- Keep diffs small and localized.
- Avoid mixing formatting-only changes with logic changes.
- Avoid broad file rewrites unless necessary.
- Preserve existing public APIs unless there is a clear reason to change them.
- Keep migration work explicit and documented.

A future reviewer or AI agent should be able to understand the diff without reconstructing the whole project.

## Validation and quality gates

After changing code, run the most relevant validation commands available in the project.

Prefer running:
- Type checking.
- Linting.
- Formatting checks.
- Unit tests.
- Integration tests when affected behavior crosses module boundaries.
- Build checks when configuration, imports, bundling, or deployment files change.

If validation cannot be run, explain why and describe what should be checked manually.

Do not claim that code works unless it was validated or the reasoned confidence is clearly stated.

## Tests for behavior changes

When changing behavior, add or update tests whenever practical.

Prefer tests that:
- Cover the main expected path.
- Cover important edge cases.
- Capture bugs before fixing them.
- Test observable behavior instead of implementation details.
- Use clear test names that describe the scenario and expected result.

Avoid:
- Overly brittle tests.
- Tests that only verify mocks were called without checking meaningful behavior.
- Large test rewrites unrelated to the change.

## Error handling and edge cases

Handle errors explicitly and make failure modes understandable.

Prefer:
- Clear validation near system boundaries.
- Typed errors or structured error objects when useful.
- User-safe error messages.
- Developer-useful logs that do not expose secrets.
- Explicit handling for null, undefined, empty arrays, missing config, API failures, and permission failures.

Avoid:
- Silent failures.
- Catch blocks that ignore errors.
- Throwing vague errors like `Something went wrong`.
- Assuming external services always return valid data.

When an edge case is intentionally not handled, document why.

## Dependency discipline

Do not add a new dependency unless it is clearly justified.

Before adding a dependency, check:
- Whether the project already has a dependency that solves the problem.
- Whether the task can be solved simply without a dependency.
- The package size, maintenance status, security posture, and API stability.
- Whether the dependency fits the existing architecture.

Prefer standard library features and existing project utilities for small tasks.

If a new dependency is added, explain why it is needed.

## Security and privacy

Treat user data, email content, API keys, tokens, credentials, and private configuration as sensitive.

Never:
- Log secrets or private user content unnecessarily.
- Commit API keys, tokens, credentials, or local environment files.
- Expose private data in error messages.
- Send sensitive data to external services unless the feature explicitly requires it and the data flow is understood.

Prefer:
- Environment variables for secrets.
- Minimal data sent to external APIs.
- Clear permission boundaries.
- Safe defaults.
- Explicit handling of authorization and authentication errors.

## Configuration and environment clarity

Keep environment-specific values centralized and documented.

Prefer:
- A clear example environment file when appropriate.
- Typed configuration parsing.
- Validation for required environment variables.
- Safe defaults for local development.
- Clear separation between development, test, staging, and production behavior.

Avoid:
- Reading environment variables throughout the codebase.
- Hardcoding model names, API URLs, secrets, limits, or feature flags in business logic.
- Letting missing config fail much later in unrelated code.

## Consistent project conventions

Follow existing project conventions unless there is a strong reason to change them.

Before introducing a new pattern, inspect how the project currently handles:
- File naming.
- Folder structure.
- Imports and exports.
- Error handling.
- Logging.
- Testing.
- Types and schemas.
- UI components.
- API wrappers.
- Configuration.

Prefer consistency over personal preference.

## Handoff summary after changes

After completing a non-trivial task, provide a concise handoff summary.

Use this format:

### Handoff summary

Changed:
- <what changed>

Files touched:
- `path/to/file.ts`

Validation:
- <commands run and results>

Important decisions:
- <decision and reason>

Follow-up:
- <remaining work, risks, or `None`>

## Do not hide uncertainty

When unsure, be explicit.

The agent should clearly state:
- What it confirmed from the code.
- What it inferred.
- What remains uncertain.
- What assumptions it made.
- What should be verified by tests, manual QA, or a human reviewer.

Avoid presenting guesses as facts.

## Public API and backward compatibility

Be careful when changing exported functions, public types, API contracts, config names, storage formats, routes, or user-visible behavior.

Before changing a public contract:
- Search for all usages.
- Check tests and documentation.
- Consider backward compatibility.
- Add migration notes if needed.
- Prefer additive changes when possible.

Breaking changes must be explicit and justified.


## Non-negotiable rules

### Do not expand scope silently

Do not add any new OAuth scope, Gmail capability, Calendar capability, Drive capability, storage mechanism, network call, or AI provider integration unless the task explicitly asks for it.

Especially avoid adding these unless explicitly requested:

```txt
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.modify
https://mail.google.com/
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/gmail.labels
```

The MVP should prefer:

- opened-thread access only
- suggestions instead of direct modifications
- user-confirmed draft creation
- no direct send
- no direct Calendar event creation
- no automatic label application

---

## First step before writing code

Before creating any new function, file, type, helper, or abstraction:

1. Search the existing codebase.
2. Check whether similar logic already exists.
3. Reuse or extend existing code when appropriate.
4. Move reusable helpers into a shared utility module or folder instead of keeping them inside feature modules.
5. Avoid duplicate helpers with slightly different names.
6. If a new function is needed, place it in the most appropriate existing module.
7. If no good module exists, create a new one only if the new responsibility is clearly distinct.

Prefer improving existing code over adding parallel implementations.

---

## Shared utility placement

Feature modules should contain feature-specific orchestration and domain logic.

Reusable pure helpers should live in a shared utility module or folder, with names that describe the value being validated, normalized, or transformed.

Examples:

```txt
src/utils/StringUtils.ts
src/utils/DateUtils.ts
src/utils/ObjectUtils.ts
```

Do not leave reusable helpers buried inside modules.

Before adding a utility, search existing utility files and reuse or extend them when appropriate.

---

## Source of truth and build model

TypeScript source lives in:

```txt
src/
```

Apps Script-compatible build output lives in:

```txt
dist/
```

Apps Script runs JavaScript, not TypeScript. Do not rely on `clasp` to transpile TypeScript.

Expected flow:

```txt
src/ TypeScript
  → build
  → dist/ Apps Script-compatible JavaScript
  → clasp push
  → Google Apps Script runtime
```

Do not write source code directly into `dist/`.

---

## TypeScript standards

Use strict TypeScript.

Avoid:

```ts
any;
```

Prefer:

```ts
unknown;
```

for untrusted external input, then parse and validate explicitly.

Use clear domain types for:

- Gmail event data
- thread data
- cleaned thread text
- Gemini request/response shapes
- parsed AI analysis
- UI rendering models

Never loosen TypeScript settings to make an error disappear.

Do not use type assertions unless there is a strong reason. If a type assertion is necessary, add a short comment explaining why it is safe.

---

## Naming standards

Use fully spelled-out, context-rich names.

Prefer:

```ts
const cleanedThreadText = buildCleanThreadText(threadData);
const openedThreadMessageCount = threadData.messages.length;
const suggestedCalendarEventConfidence = suggestedCalendarEvent.confidence;
```

Avoid vague names:

```ts
const data = getData();
const res = callApi();
const msg = item;
const temp = value;
const result = process(x);
```

Acceptable short names:

- `id` when the meaning is obvious
- `url`
- `json`
- `html`
- `api`
- `ui`

Do not use abbreviations unless they are widely understood in context.

Examples:

```ts
// Good
const gmailThreadMessages = threadData.messages;
const maximumThreadCharacterCount = CONFIG.MAX_THREAD_CHARS;
const parsedEmailAnalysis = parseGeminiAnalysis(rawGeminiResponseText);

// Avoid
const msgs = thread.messages;
const max = CONFIG.MAX_THREAD_CHARS;
const parsed = parse(raw);
```

---

## Function design

Functions should be small, named clearly, and have one responsibility.

Prefer:

```ts
function stripQuotedReplyFromEmailBody(emailBody: string): string;
function buildCleanThreadText(threadData: ThreadData): CleanThreadText;
function normalizeConfidence(value: unknown): Confidence;
function buildSummaryCard(emailAnalysis: EmailAnalysis): GoogleAppsScript.Card_Service.Card;
```

Avoid:

```ts
function processData(data: unknown): unknown;
function handleEverything(event: unknown): unknown;
function doStuff(): void;
```

A function name should make the function’s purpose obvious without needing to read the implementation.

---

## Functional programming preference

Favor a functional style where practical:

- pure functions for parsing, formatting, cleaning, validation, and transformation
- immutable data where reasonable
- explicit inputs and outputs
- minimal hidden state
- no mutation unless it improves clarity or is required by Apps Script APIs
- no side effects in helper functions

Good:

```ts
function truncateText(text: string, maximumCharacterCount: number): string {
  if (text.length <= maximumCharacterCount) {
    return text;
  }

  return `${text.slice(0, maximumCharacterCount - 1)}…`;
}
```

Avoid unnecessary mutation:

```ts
function mutateAnalysis(analysis: EmailAnalysis): void {
  analysis.summary.short = analysis.summary.short.trim();
}
```

Prefer returning normalized copies:

```ts
function normalizeEmailAnalysis(emailAnalysis: EmailAnalysis): EmailAnalysis {
  return {
    ...emailAnalysis,
    summary: {
      ...emailAnalysis.summary,
      short: emailAnalysis.summary.short.trim(),
    },
  };
}
```

---

## Module responsibilities

Keep responsibilities separated.

```txt
Code.ts
  Apps Script entry points and top-level orchestration.

Cards.ts
  CardService UI rendering only.

GmailReader.ts
  GmailApp access and opened-thread extraction only.

ThreadCleaner.ts
  Pure functions for cleaning/truncating email thread text.

GeminiClient.ts
  Gemini API client and mock Gemini behavior only.

PromptBuilder.ts
  Prompt construction only.

ResponseParser.ts
  Safe parsing and normalization of AI responses only.

Actions.ts
  User-triggered helper actions, such as draft reply and calendar URL helpers.

Config.ts
  Typed configuration constants.

utils/
  Shared reusable pure helpers.

types.ts
  Shared domain types.

PrivacyNotice.ts
  Short privacy notice text used in the UI.
```

Do not mix Gmail access, AI calls, and UI rendering in the same function unless it is a top-level orchestration function.

---

## Apps Script constraints

Apps Script entry points must remain globally callable after bundling.

Required global functions include:

```ts
buildHomePage;
buildGmailContextualCard;
```

Do not break these entry points.

Do not use runtime imports in the final Apps Script output.

Do not use browser APIs, Node-only APIs, or DOM APIs in Apps Script runtime code.

Apps Script services such as these are only available in Apps Script runtime:

```ts
CardService;
GmailApp;
UrlFetchApp;
PropertiesService;
Utilities;
ScriptApp;
```

Pure functions should not depend on these services.

---

## Privacy and security rules

Never log:

```txt
raw email bodies
cleaned email bodies
AI prompts
AI responses
Gemini API keys
OAuth tokens
full Gmail event objects
```

Safe logs may include:

```txt
error type
non-sensitive status code
operation name
mock mode enabled/disabled
```

Do not store email bodies by default.

Do not cache prompts or AI responses unless explicitly requested.

Do not add persistent storage without documenting:

- what is stored
- why it is stored
- how long it is retained
- how users can delete it
- whether it affects Marketplace review

API keys must come from Apps Script Script Properties.

Never commit:

- `.clasprc.json`
- `.env`
- Gemini API keys
- OAuth secrets
- raw email examples
- prompt logs
- response logs

---

## AI safety and hallucination handling

Do not treat AI output as reliable.

AI-generated action items must be displayed as suggestions, not facts.

The UI should distinguish:

```txt
Explicit action items
Things to consider / think about
Risks / ambiguities
```

The model must not invent obligations.

When parsing AI output:

- accept malformed output gracefully
- fallback safely
- normalize missing fields
- default invalid confidence values to `low`
- limit long text fields
- never render raw malformed AI output directly

Prefer evidence-based output:

```txt
Task
Evidence
Confidence
```

---

## Marketplace readiness rules

Every change should preserve a future Marketplace publication path.

Before adding any feature, consider:

- Does this require a new OAuth scope?
- Is the scope sensitive or restricted?
- Can this be done as a suggestion instead of a write action?
- Does this require a privacy policy update?
- Does this require a Marketplace review explanation?
- Does this increase risk of exposing Gmail content?
- Can the user clearly understand what data is being sent to AI?

If a new scope is added, update:

```txt
docs/oauth-scopes.md
PRIVACY.md if data access changes
docs/marketplace-readiness.md if review posture changes
```

Every OAuth scope must have a one-sentence justification.

---

## Documentation requirements

Document all exported functions.

Use concise JSDoc for non-trivial functions:

```ts
/**
 * Builds a cleaned, bounded text representation of the opened Gmail thread for AI analysis.
 * The returned text is intended for one-time in-memory processing and should not be logged.
 */
function buildCleanThreadText(threadData: ThreadData): CleanThreadText {
  // ...
}
```

Document:

- public/exported functions
- Apps Script entry points
- functions that touch Gmail data
- functions that call external services
- functions that parse untrusted AI output
- functions that handle security-sensitive behavior

Do not over-document obvious one-line helpers.

---

## Testing expectations

Write tests for pure logic.

Good test targets:

- response parsing
- confidence normalization
- malformed JSON fallback
- prompt construction
- email body cleaning
- quote stripping
- truncation
- calendar URL generation
- type guards and validators

Avoid trying to deeply unit-test `CardService`, `GmailApp`, or Apps Script runtime behavior.

Manual test Apps Script UI behavior and document it in:

```txt
docs/manual-test-plan.md
```

---

## Error handling

Errors shown to users must be safe and understandable.

Never expose:

- stack traces
- raw API responses
- OAuth tokens
- prompts
- email bodies
- API keys

Prefer:

```txt
The summary could not be generated. Please try again.
```

over:

```txt
Gemini returned raw response: ...
```

Use typed, predictable fallback objects where possible.

---

## Formatting and linting

Follow existing formatting.

Run before finishing:

```bash
npm run check
```

The project uses:

- TypeScript strict mode
- ESLint
- Prettier
- Vitest
- Rollup
- clasp

Prettier is the formatting source of truth.

ESLint should enforce quality rules, not conflict with Prettier.

Do not disable lint rules unless there is a strong reason. If disabling is necessary, use the narrowest possible disable comment and explain why.

---

## Change discipline

Make small, reviewable changes.

A good change usually touches one concern:

- types only
- parser only
- prompt builder only
- card UI only
- Gemini client only
- docs only
- tests only

Avoid large mixed changes.

Do not refactor unrelated code while implementing a feature.

Do not rename files or move modules unless the task requires it.

Do not add dependencies without explaining:

- why the dependency is needed
- why a simpler built-in alternative is not enough
- whether it affects Apps Script bundling

---

## Review checklist before finishing a task

Before reporting completion, verify:

```txt
[ ] I searched for existing code before adding new functions.
[ ] I reused or extended existing logic where appropriate.
[ ] I did not add broad OAuth scopes.
[ ] I did not log Gmail content, prompts, responses, keys, or tokens.
[ ] I did not store email content.
[ ] I kept functions small and clearly named.
[ ] I used fully spelled-out variable names.
[ ] I favored pure functions for transformation logic.
[ ] I documented new exported or sensitive functions.
[ ] I added or updated tests for pure logic.
[ ] I updated relevant docs.
[ ] I ran npm run check.
[ ] I summarized files changed and testing steps.
```

---
