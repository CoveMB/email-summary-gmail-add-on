# AGENTS.md

This file has two layers:

1. **General AI agent and coding rules** — reusable across projects.
2. **Project-specific rules** — specific to this repository and product.

Project-specific rules are additive. When a project-specific rule is stricter than a general rule, follow the stricter project-specific rule.

---

# Section 1 — General AI agent and coding rules

## Purpose

This file guides AI coding agents and human contributors toward small, safe, reviewable changes.

It is intended to help agents:

- protect user data and secrets
- preserve existing behavior unless change is requested
- avoid unnecessary abstractions and broad rewrites
- keep code typed, testable, readable, and maintainable
- validate changes before reporting completion
- clearly communicate what changed, what was validated, and what remains uncertain

---

## Rule levels

Rules in this file have different levels of strictness.

### Non-negotiable rules

These must not be violated unless the user explicitly changes the requirement.

Examples:

- protect user data, secrets, credentials, and private content
- avoid logging private or sensitive content
- do not weaken security, privacy, or type safety to make a task easier
- preserve product boundaries unless the task explicitly changes them

### Default rules

These should be followed unless there is a clear, task-specific reason not to.

Examples:

- make the smallest safe change
- search existing code before creating new abstractions
- preserve existing behavior unless the task requires changing it
- run available validation commands before finishing

### Preferences

These guide implementation style, but should not create unnecessary complexity.

Examples:

- favor functional style where practical
- prefer descriptive names
- prefer simple abstractions that match real project concepts
- avoid premature optimization

When rules conflict, follow this order:

1. Non-negotiable project-specific rules
2. Non-negotiable general rules
3. Explicit task requirements
4. Default project-specific rules
5. Default general rules
6. Preferences

When a preference conflicts with clarity, platform constraints, or the smallest safe change, prefer clarity, platform constraints, and the smallest safe change.

---

## Highest-priority general rules

Always prioritize:

1. Protect user data, secrets, credentials, and private content.
2. Make the smallest safe change that satisfies the task.
3. Preserve existing behavior unless the task explicitly requires changing it.
4. Search existing code before creating new functions, utilities, types, components, prompts, schemas, configuration, or abstractions.
5. Prefer clear, simple, typed, testable code over clever abstractions.
6. Keep reusable configuration, constants, prompts, labels, model settings, limits, and business rules centralized.
7. Validate changes with the project’s available check, test, lint, typecheck, or build commands.
8. Clearly report what changed, what was validated, and what remains uncertain.

---

## Standard agent workflow

Before making non-trivial changes:

1. Identify the files likely involved.
2. Read existing related code before editing.
3. Check for existing utilities, types, schemas, prompts, constants, and tests.
4. Form a brief implementation plan.
5. Make the smallest coherent change.
6. Validate the change.
7. Provide a concise handoff summary.

For complex tasks, write the plan in a concise checklist before editing. Update the plan if discovery shows the first approach was wrong.

When unsure, be explicit about:

- what was confirmed from the code
- what was inferred
- what remains uncertain
- what assumptions were made
- what should be verified by tests, manual QA, or human review

Avoid presenting guesses as facts.

---

## Search, reuse, centralization, and change discipline

Before creating any new function, file, type, helper, component, config object, prompt, schema, or business rule:

1. Search the existing codebase.
2. Check whether similar logic already exists.
3. Reuse or extend existing code when appropriate.
4. Place new code in the most appropriate existing module.
5. Create a new module only when the responsibility is clearly distinct.

Search by meaning, not only by exact name.

For example, before adding `formatUserNotification`, also search for existing notification formatting, message rendering, alert builders, and user-facing copy helpers.

Prefer centralized definitions for:

- prompt text
- model names
- model parameters
- user-facing labels
- action definitions
- feature flags
- API URLs
- limits
- validation rules
- error messages
- business rules
- privacy or consent copy
- permission or authorization rules
- OAuth scope declarations

Avoid:

- duplicate helpers with slightly different names
- parallel abstractions that solve the same problem
- scattered copies of the same string, prompt fragment, business rule, or model setting
- adding dependencies when existing code already solves the problem
- generic dumping-ground utility files

If new code is needed despite similar existing code, document briefly why reuse was not appropriate.

### Refactoring duplicated logic

The “smallest safe change” rule is usually stricter than the “centralize duplicated logic” rule.

When duplicated logic is found:

- If the duplication is directly involved in the requested change, prefer a small shared helper.
- If the duplication is outside the touched area, do not refactor it during the current task.
- If refactoring would make the diff broad or risky, mention it as follow-up instead.
- Do not perform unrelated cleanup while implementing a feature or bug fix.

A good change usually touches one concern:

- types only
- parser only
- prompt builder only
- API client only
- UI only
- docs only
- tests only

Before introducing a new pattern, inspect how the project currently handles:

- file naming
- folder structure
- imports and exports
- error handling
- logging
- testing
- types and schemas
- UI components
- API wrappers
- configuration

Prefer consistency over personal preference.

---

## Code clarity and implementation style

Write code so another AI agent or human developer can quickly understand it, safely modify it, and build on it.

Prefer:

- clear, simple implementations
- fully spelled, descriptive names
- small functions with one clear responsibility
- explicit inputs and outputs
- straightforward control flow
- explicit data transformations
- clear separation of concerns
- explicit types, interfaces, and schemas
- readable code over clever code
- simple abstractions that match real project concepts

Avoid:

- vague or abbreviated names unless they are standard and unmistakable
- generic names like `data`, `value`, `item`, `result`, `handle`, `process`, `manager`, `helper`, or `util` when a more specific name is possible
- large multi-purpose functions
- clever one-liners that compress important logic
- excessive indirection through tiny wrappers
- overly generic abstractions before they are needed
- hidden side effects
- deeply nested logic
- premature optimization
- comments that merely restate the code

Good naming examples:

```ts
const normalizedUserProfile = normalizeUserProfile(rawUserProfile);
const activeSubscriptionCount = subscriptions.filter(isSubscriptionActive).length;
const maximumDescriptionCharacterCount = CONFIG.MAXIMUM_DESCRIPTION_CHARACTER_COUNT;
const parsedProviderResponse = parseProviderResponse(rawProviderResponseText);
```

Avoid:

```ts
const data = getData();
const res = callApi();
const temp = value;
const result = process(x);
const parsed = parse(raw);
```

Acceptable short names:

- `id` when the meaning is obvious
- `url`
- `json`
- `html`
- `api`
- `ui`

When complexity is necessary:

- surface it with clear names, comments, types, and function boundaries
- explain why the complexity exists
- isolate complex logic from simpler surrounding code
- add tests around complex behavior when possible

---

## Type and schema safety

Use the strictest practical type safety for the project.

Avoid unsafe escape hatches such as:

```ts
any;
```

Prefer:

```ts
unknown;
```

for untrusted external input, then parse, validate, and normalize explicitly.

Use clear domain types for important concepts.

Examples:

- external API request and response shapes
- parsed provider responses
- normalized internal models
- UI rendering models
- configuration objects
- user action models
- stored data models
- permission or authorization models

Never loosen type settings to make an error disappear.

Do not use type assertions unless there is a strong reason. If a type assertion is necessary, add a short comment explaining why it is safe.

---

## Functional programming preference

Favor a functional style where practical.

Prefer:

- pure functions for parsing, formatting, cleaning, validation, and transformation
- immutable data where reasonable
- explicit inputs and outputs
- minimal hidden state
- no mutation unless it improves clarity or is required by a framework/runtime API
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
function mutateUserProfile(userProfile: UserProfile): void {
  userProfile.displayName = userProfile.displayName.trim();
}
```

Prefer returning normalized copies:

```ts
function normalizeUserProfile(userProfile: UserProfile): UserProfile {
  return {
    ...userProfile,
    displayName: userProfile.displayName.trim(),
  };
}
```

Do not force functional style when it makes framework integration or runtime code harder to understand.

---

## Architecture and module boundaries

Keep responsibilities separated.

Prefer modules with clear ownership:

```txt
EntryPoint.ts
  Application entry points and top-level orchestration.

Config.ts
  Typed configuration constants and configuration parsing.

types.ts
  Shared domain types.

shared/
  Reusable pure helpers that are not specific to one feature.

features/<feature-name>/
  Feature-specific orchestration, domain logic, UI, and tests.

clients/
  External API clients only.

parsers/
  Parsing, validation, and normalization of untrusted input.

ui/
  UI rendering and presentation logic only.
```

Avoid mixing unrelated responsibilities in the same function or module.

For example, do not mix:

- external API access
- business logic
- persistence
- UI rendering
- analytics/logging
- prompt construction
- response parsing

unless the function is explicitly a top-level orchestration function.

Prefer domain-specific modules over vague utility containers.

For example, prefer:

```txt
src/orders/normalizeOrder.ts
src/ai/parseModelResponse.ts
src/config/AppConfig.ts
src/shared/text/truncateText.ts
src/shared/validation/normalizeConfidence.ts
```

over:

```txt
src/utils/StringUtils.ts
src/utils/ObjectUtils.ts
src/utils/MiscUtils.ts
```

Do not create speculative architecture.

Architecture maps describe intended ownership. They are not instructions to create empty files, speculative abstractions, or complete folder trees before the current task needs them.

---

## AI prompt and response contract

AI prompts and response schemas are part of the application contract.

Keep prompts, schemas, and model settings centralized and versioned when practical.

When changing prompts or response schemas:

- update parser tests
- update malformed-response fallback tests
- update example mock responses
- document behavior changes
- preserve backward compatibility where practical

The parser must not assume the model follows instructions perfectly.

When parsing AI output:

- accept malformed output gracefully
- fallback safely
- normalize missing fields
- limit long text fields
- never render raw malformed AI output directly

Do not treat AI output as reliable unless validated by deterministic code or confirmed by the user.

---

## Documentation rules

Document exported functions when they are public API, non-obvious, security-sensitive, privacy-sensitive, or called by a runtime/framework entry point.

Use concise JSDoc for non-trivial functions:

```ts
/**
 * Builds a normalized, bounded representation of an external provider response.
 * The returned object is safe for internal rendering and should not contain raw provider payloads.
 */
function buildNormalizedProviderResponse(
  rawProviderResponse: unknown,
): NormalizedProviderResponse {
  // ...
}
```

Document:

- application entry points
- public APIs
- non-obvious exported functions
- functions that touch private or sensitive data
- functions that call external services
- functions that parse untrusted input
- functions that handle security-sensitive behavior
- important assumptions, constraints, side effects, and failure modes

Do not over-document obvious one-line helpers.

Do not add JSDoc that merely repeats the function name or TypeScript signature.

Explain why, not just what.

---

## Privacy and security

Treat user data, private content, API keys, tokens, credentials, and private configuration as sensitive.

Never log:

- secrets
- API keys
- OAuth tokens
- credentials
- private user content
- raw external provider responses containing private data
- prompts containing private data
- full request or event objects containing private data

Safe logs may include:

- error type
- non-sensitive status code
- operation name
- feature flag state
- mock mode enabled/disabled

Do not store private user content unless explicitly required by the feature.

Do not add persistent storage without documenting:

- what is stored
- why it is stored
- how long it is retained
- how users can delete it
- whether it affects privacy, security, compliance, or review requirements

Never commit:

- local environment files
- API keys
- OAuth secrets
- credentials
- private user data
- prompt logs containing private content
- response logs containing private content

Use environment/configuration mechanisms instead of hardcoded secrets.

---

## Error handling and edge cases

Handle errors explicitly and make failure modes understandable.

Prefer:

- clear validation near system boundaries
- typed errors or structured error objects when useful
- user-safe error messages
- developer-useful logs that do not expose secrets or private content
- explicit handling for null, undefined, empty arrays, missing config, API failures, and permission failures
- typed, predictable fallback objects where possible

Avoid:

- silent failures
- catch blocks that ignore errors
- throwing vague errors like `Something went wrong`
- exposing stack traces, raw API responses, prompts, private content, API keys, or OAuth tokens
- assuming external services always return valid data

Prefer user-facing messages like:

```txt
The request could not be completed. Please try again.
```

over messages that expose internals, private data, or raw provider responses.

When an edge case is intentionally not handled, document why.

---

## Configuration and environment clarity

Keep environment-specific values centralized and documented.

Prefer:

- typed configuration parsing
- validation for required environment variables or runtime properties
- safe defaults for local development
- clear separation between development, test, staging, and production behavior
- a clear example environment file when appropriate

Avoid:

- reading environment variables or runtime properties throughout the codebase
- hardcoding model names, API URLs, secrets, limits, or feature flags in business logic
- letting missing config fail much later in unrelated code

---

## Testing and validation

Write tests for pure logic and behavior changes whenever practical.

Good test targets:

- response parsing
- schema validation
- malformed input fallback
- prompt construction
- text cleaning
- normalization
- truncation
- URL generation
- type guards and validators
- permission or capability mapping
- configuration parsing

Prefer tests that:

- cover the main expected path
- cover important edge cases
- capture bugs before fixing them
- test observable behavior instead of implementation details
- use clear test names that describe the scenario and expected result

Avoid:

- overly brittle tests
- tests that only verify mocks were called without checking meaningful behavior
- large test rewrites unrelated to the change
- deeply unit-testing framework/runtime behavior

Before finishing:

1. Inspect available scripts if command availability is uncertain.
2. Prefer the project’s standard check command when available.
3. If no standard check command exists, run the closest relevant commands: typecheck, lint, test, or build.
4. Report exactly what was run and what was not run.
5. If validation cannot be run, explain why and describe what should be checked manually.

Example commands:

```bash
npm run check
npm run typecheck
npm run lint
npm run test
npm run build
```

Use the commands actually available in the project.

Do not claim that code works unless it was validated or confidence is clearly qualified.

---

## Dependency discipline

Do not add a new dependency unless it is clearly justified.

Before adding a dependency, check:

- whether the project already has a dependency that solves the problem
- whether the task can be solved simply without a dependency
- the package size
- maintenance status
- security posture
- API stability
- runtime compatibility
- bundling impact

Prefer standard library features and existing project utilities for small tasks.

If a new dependency is added, explain why it is needed and why a simpler built-in alternative is not enough.

---

## Public API and backward compatibility

Be careful when changing exported functions, public types, API contracts, config names, storage formats, routes, or user-visible behavior.

Before changing a public contract:

- search for all usages
- check tests and documentation
- consider backward compatibility
- add migration notes if needed
- prefer additive changes when possible

Breaking changes must be explicit and justified.

---

## Handoff summary

After completing a non-trivial task, provide a concise handoff summary:

```md
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
```

---

## General review checklist before finishing a task

Before reporting completion, verify:

```txt
[ ] I searched for existing code before adding new functions.
[ ] I reused or extended existing logic where appropriate.
[ ] I kept the change small and focused.
[ ] I preserved existing behavior unless the task required changing it.
[ ] I did not log or expose secrets, credentials, or private user content.
[ ] I kept functions small and clearly named.
[ ] I used strict typing without unnecessary assertions.
[ ] I favored pure functions for transformation logic where practical.
[ ] I centralized repeated constants, prompts, labels, model settings, scopes, and business rules.
[ ] I documented new public, exported, runtime, or sensitive functions when needed.
[ ] I added or updated tests for pure logic when practical.
[ ] I updated relevant docs when behavior, configuration, privacy, or architecture changed.
[ ] I ran relevant validation commands, or explained why they could not be run.
[ ] I summarized files changed, validation steps, decisions, and follow-up work.
```

---

# Section 2 — Project-specific rules: EmailSummary

## Project summary

EmailSummary is a personal Google Workspace Gmail Add-on designed to remain Marketplace-ready.

The add-on will eventually:

- appear when a user opens a Gmail thread
- summarize only the currently opened thread after explicit user action
- identify explicit action items
- identify “things to consider / think about”
- identify risks and ambiguities
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

## EmailSummary non-negotiable rules

For this project, the non-negotiable rules are:

1. Protect Gmail content and user privacy.
2. Do not add OAuth scopes, Gmail write actions, Calendar write actions, Drive access, persistent storage, new network destinations, or new AI provider integrations unless explicitly requested.
3. Keep the MVP Marketplace-ready.
4. Run AI analysis only after explicit user action.
5. Prefer opened-thread access only.
6. Prefer suggestions and user-reviewed drafts over direct modifications.
7. Never directly send email.
8. Never automatically create Calendar events.
9. Never automatically apply labels.
10. Never persist email content unless explicitly requested and documented.

---

## EmailSummary action policy

| Capability | MVP policy |
| --- | --- |
| Display Gmail contextual card | Allowed when a user opens a Gmail thread |
| Summarize opened thread | Allowed only after explicit user click |
| Read current thread | Allowed only for the opened Gmail context and only as needed |
| Send opened-thread content to AI | Allowed only after explicit user click |
| Send email | Forbidden |
| Create Gmail draft | Allowed only as a user-reviewed draft |
| Create Calendar event | Forbidden by default; suggest event details or Calendar URL instead |
| Apply Gmail label | Forbidden by default; suggest label instead |
| Archive, delete, or modify Gmail messages | Forbidden by default |
| Persist email body | Forbidden unless explicitly requested and documented |
| Cache prompts or AI responses | Forbidden unless explicitly requested and documented |
| Add OAuth scope | Forbidden unless explicitly requested |
| Add AI provider | Forbidden unless explicitly requested |
| Add new network destination | Forbidden unless explicitly requested |
| Log prompt, AI response, or Gmail content | Forbidden |

---

## Non-negotiable product boundaries

### Do not expand scope silently

Do not add any new OAuth scope, Gmail capability, Calendar capability, Drive capability, storage mechanism, network destination, or AI provider integration unless the task explicitly asks for it.

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
- no persistent storage of email content

### Approved MVP AI destination

The configured Gemini integration is the approved MVP AI destination.

Do not add a different provider, endpoint, request shape, or network destination unless explicitly requested and reviewed for:

- privacy impact
- OAuth or permission impact
- Marketplace review impact
- data disclosure changes
- user consent clarity

### No automatic side effects

Opening a Gmail thread may display a contextual card, but it must not automatically:

- send thread content to AI
- create drafts
- create Calendar events
- apply labels
- archive, delete, or modify Gmail messages
- store email content
- call external services with Gmail content

AI analysis must run only after the user explicitly clicks a summarization action.

Draft creation must open a user-reviewed Gmail draft. The add-on must not send messages directly.

---

## Gmail contextual trigger behavior

The Gmail contextual trigger may run when a user opens a Gmail message or thread, but it must only render a safe initial card.

The contextual trigger must not:

- call Gemini
- send Gmail content over the network
- create drafts
- create Calendar events
- apply labels
- archive, delete, or modify Gmail messages
- persist email content
- log Gmail content, prompts, or AI responses

The initial card may explain what the add-on can do and present a user action button.

Full analysis starts only from an explicit user action, such as clicking a summarize button.

---

## Apps Script manifest source of truth

`appsscript.json` is security-sensitive configuration and should be treated as a project source of truth.

Do not change `appsscript.json` unless the task explicitly requires manifest behavior changes.

Manifest changes must be reviewed for:

- OAuth scopes
- Gmail contextual triggers
- homepage triggers
- allowed external URLs
- logo URLs
- callback function names
- add-on metadata
- Marketplace review impact
- privacy policy impact

Any OAuth scope change must update:

```txt
docs/oauth-scopes.md
PRIVACY.md if data access changes
docs/marketplace-readiness.md if review posture changes
```

Every OAuth scope must have a one-sentence justification.

Do not add broad scopes when a narrower scope or opened-thread access is sufficient.

If a manifest value must be duplicated elsewhere because of Apps Script or Marketplace constraints, document:

- where the source of truth lives
- where duplicate values exist
- why duplication is necessary

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

Do not manually edit generated build output. If generated output changes, explain which source change produced it.

---

## Apps Script constraints

Apps Script entry points must remain globally callable after bundling.

Required global functions include:

```ts
buildHomePage;
buildGmailContextualCard;
```

Do not break these entry points.

When bundling, ensure Apps Script entry points are exposed on `globalThis` or otherwise emitted as global functions compatible with the manifest callback names.

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

Pure functions should not depend on Apps Script services.

---

## EmailSummary architecture and module responsibilities

Keep responsibilities separated.

The architecture map describes intended ownership. Do not create all modules upfront unless the current task needs them.

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

types.ts
  Shared domain types.

PrivacyNotice.ts
  Short privacy notice text used in the UI.

shared/
  Reusable pure helpers that are not specific to one feature.
```

Do not mix Gmail access, AI calls, and UI rendering in the same function unless it is a top-level orchestration function.

Prefer domain-specific modules over generic dumping-ground utility files.

For example, prefer:

```txt
src/thread/ThreadCleaner.ts
src/ai/ResponseParser.ts
src/config/Config.ts
src/shared/text/truncateText.ts
src/shared/validation/normalizeConfidence.ts
```

over:

```txt
src/utils/StringUtils.ts
src/utils/ObjectUtils.ts
```

---

## EmailSummary TypeScript domain types

Use clear domain types for:

- Gmail event data
- thread data
- cleaned thread text
- Gemini request shapes
- Gemini response shapes
- parsed AI analysis
- explicit action items
- things to consider / think about
- risks and ambiguities
- suggested reply points
- suggested calendar events
- suggested labels
- follow-up suggestions
- UI rendering models

Never loosen TypeScript settings to make Gmail, Gemini, or Apps Script typing easier.

---

## EmailSummary AI safety and response parsing

Do not treat Gemini output as reliable.

AI-generated action items must be displayed as suggestions, not facts.

The UI should distinguish:

```txt
Explicit action items
Things to consider / think about
Risks / ambiguities
```

The model must not invent obligations.

Prefer evidence-based output:

```txt
Task
Evidence
Confidence
```

When parsing Gemini output:

- accept malformed output gracefully
- fallback safely
- normalize missing fields
- default invalid confidence values to `low`
- limit long text fields
- never render raw malformed AI output directly

Prompts and response schemas are part of the application contract.

When changing prompts or response schemas:

- keep them centralized
- update parser tests
- update malformed-response fallback tests
- update mock responses
- document behavior changes
- preserve backward compatibility where practical

---

## EmailSummary privacy and security

Treat Gmail content, API keys, tokens, credentials, and private configuration as sensitive.

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

Use Apps Script Script Properties or another approved configuration mechanism instead of hardcoded secrets.

---

## EmailSummary Marketplace readiness

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

## EmailSummary testing expectations

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

Before finishing:

1. Inspect `package.json` scripts if command availability is uncertain.
2. Prefer `npm run check` when available.
3. If unavailable, run the closest relevant commands: typecheck, lint, test, or build.
4. Report exactly what was run and what was not run.
5. If validation cannot be run, explain why and what should be checked manually.

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

## EmailSummary user-facing error handling

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

## EmailSummary project-specific review checklist

Before reporting completion, verify:

```txt
[ ] I searched for existing code before adding new functions.
[ ] I reused or extended existing logic where appropriate.
[ ] I did not add broad OAuth scopes, Gmail write actions, Calendar write actions, storage, network destinations, or AI providers.
[ ] I did not send Gmail content to AI except after explicit user action.
[ ] I did not log Gmail content, prompts, responses, keys, or tokens.
[ ] I did not store email content.
[ ] I kept functions small and clearly named.
[ ] I used strict TypeScript without unnecessary assertions.
[ ] I favored pure functions for transformation logic where practical.
[ ] I centralized repeated constants, prompts, labels, model settings, OAuth scopes, and business rules.
[ ] I documented new public, exported, runtime, or sensitive functions when needed.
[ ] I added or updated tests for pure logic when practical.
[ ] I updated relevant docs when behavior, scopes, privacy posture, or Marketplace readiness changed.
[ ] I ran npm run check, or explained why it could not be run.
[ ] I summarized files changed, validation steps, decisions, and follow-up work.
```
