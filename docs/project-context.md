# ThreadBrief Project Context

## Purpose of this document

This document gives context to make changes to ThreadBrief in a way that preserves the product intent, architecture, privacy boundaries, and Marketplace-readiness of the project.

The goal is to prevent accidental scope creep, broad OAuth permissions, privacy regressions, or over-engineered implementation choices.

---

# 1. Product intent

ThreadBrief is a personal Google Workspace Gmail Add-on that may later become Marketplace-ready.

The add-on appears when the user opens a Gmail thread. The user can click a button to summarize the currently opened thread using AI. The add-on then displays a structured decision-support summary.

The product is not just an email summarizer. Its main value is helping the user understand what the email means in practical terms.

ThreadBrief should help identify:

* What the email/thread is about
* What is explicitly being asked
* What might need attention but is not directly requested
* What reply points may be useful
* Whether a calendar event may be relevant
* Whether a label may be appropriate
* Whether follow-up is needed
* What is uncertain or ambiguous

The intended user experience is calm, minimal, and trustworthy. The add-on should avoid making the user feel that AI is silently reading or acting on their inbox.

---

# 2. MVP behavior

The MVP flow is:

1. User opens a Gmail thread.
2. Gmail Add-on contextual card appears.
3. User sees a short privacy notice.
4. User clicks `Summarize thread`.
5. Add-on reads only the currently opened Gmail thread.
6. Add-on cleans and truncates the thread text.
7. Add-on sends the cleaned text to Gemini API.
8. Gemini returns structured JSON.
9. Add-on parses and validates the JSON.
10. Add-on renders a result card with structured sections.

The result card should include:

* Summary
* Explicit action items
* Things to consider / think about
* Suggested reply points
* Suggested calendar event
* Suggested label
* Follow-up recommendation
* Risks / ambiguities

Real write actions should be limited in the MVP.

Allowed in MVP:

* Read the currently opened Gmail thread after user action
* Call Gemini API after user action
* Display AI-generated analysis
* Create a draft reply only after explicit user click
* Open a prefilled Google Calendar URL
* Suggest a label without applying it
* Suggest follow-up without modifying Gmail state

Not allowed in MVP unless explicitly requested later:

* Scan the mailbox
* Read unrelated threads
* Automatically summarize emails without user click
* Automatically send emails
* Automatically apply Gmail labels
* Automatically create Calendar events
* Automatically create Google Tasks
* Analyze attachments
* Store email bodies
* Log email bodies, prompts, or AI responses

---

# 3. Product framing

ThreadBrief should frame AI output carefully.

Use the phrase:

> Things to consider / think about

instead of:

> Implicit action items

This matters because the model may infer too much. The product should not turn weak social signals or vague context into false obligations.

Preferred framing:

* Explicit action item: a direct request or clear obligation
* Thing to consider: a possible implication, clarification, concern, or decision point
* Risk / ambiguity: something that may require user judgment

The add-on should not pretend that AI understands the full social, emotional, legal, or business context of the email.

---

# 4. Architecture overview

ThreadBrief uses this architecture:

```text
GitHub repository
  → TypeScript source in src/
  → build step with Rollup or equivalent bundler
  → generated Apps Script-compatible JavaScript in dist/
  → clasp pushes dist/ to Google Apps Script
  → Google Apps Script powers Gmail Add-on
  → Gmail Add-on uses CardService UI
  → Gemini API is called through UrlFetchApp
```

Source of truth:

* `src/` contains TypeScript source code.
* `dist/` contains generated Apps Script output.
* Apps Script runs JavaScript, not TypeScript.
* TypeScript must be compiled/bundled before `clasp push`.
* `clasp` should push from `dist/`, not directly from `src/`.

The project should not rely on `clasp` to transpile TypeScript.

---

# 5. Runtime and language choices

The source language is TypeScript.

The runtime target is Google Apps Script V8 JavaScript.

TypeScript should be configured strictly. Prefer explicit types and safe parsing over loose assumptions.

Avoid:

* `any`
* implicit `any`
* broad untyped objects
* runtime module imports in generated Apps Script output
* complex framework-style abstractions

Prefer:

* `unknown` for external input
* explicit normalization/parsing functions
* small pure functions
* clear data types
* strict compiler settings
* Apps Script globals isolated to runtime-facing modules

Because Apps Script requires globally callable functions, entry points must remain accessible after bundling.

Expected global entry points include:

* `buildHomePage`
* `buildGmailContextualCard`

If the bundler wraps code in a closure, ensure these entry points are attached to `globalThis` or otherwise exposed in a way Apps Script can call.

---

# 6. Code organization

Expected source layout:

```text
src/
  Code.ts
  Cards.ts
  Config.ts
  PrivacyNotice.ts
  GmailReader.ts
  GeminiClient.ts
  PromptBuilder.ts
  ResponseParser.ts
  Actions.ts
  ThreadCleaner.ts
  types.ts
  globals.d.ts
```

Responsibilities:

## `Code.ts`

Apps Script entry points and high-level request handlers.

Should:

* expose global Apps Script functions
* coordinate flow between GmailReader, ThreadCleaner, PromptBuilder, GeminiClient, ResponseParser, and Cards
* catch errors and render safe error cards

Should not:

* contain large UI-building logic
* contain Gemini request details
* contain thread-cleaning details

## `Cards.ts`

All Google CardService UI construction.

Should:

* build homepage card
* build Gmail contextual card
* build summary/result card
* build error card
* render confidence labels
* render privacy footer

Should not:

* read Gmail data directly
* call Gemini directly
* contain business logic beyond display formatting

## `GmailReader.ts`

Gmail-specific read logic.

Should:

* use the Gmail add-on current-message access token
* read the currently opened message/thread only
* extract thread metadata and message bodies into internal types

Should not:

* scan the mailbox
* search Gmail
* read unrelated threads
* log message bodies
* store message bodies

## `ThreadCleaner.ts`

Pure functions for preparing thread text for AI.

Should:

* strip quoted replies where reasonably safe
* trim common signatures
* preserve meaningful content
* cap number of messages
* cap total characters
* report truncation metadata

Should be testable outside Apps Script.

## `PromptBuilder.ts`

Pure functions for building AI prompts.

Should:

* build the email analysis prompt
* define task categories clearly
* request strict JSON output
* include truncation notices when relevant

Should not call Gemini directly.

## `GeminiClient.ts`

All Gemini API integration.

Should:

* support mock mode by default
* read API key from Apps Script Script Properties only when real mode is enabled
* call Gemini API through `UrlFetchApp`
* avoid logging prompts or responses
* return raw model text to the parser

Should not:

* hardcode secrets
* store prompts/responses
* decide how to render output

## `ResponseParser.ts`

Pure parsing and normalization of AI output.

Should:

* strip Markdown code fences if needed
* parse JSON safely
* normalize unknown input
* fill defaults
* validate confidence values
* truncate long display fields
* return safe fallback analysis on parse failure

Should not throw raw parse errors into UI handlers.

## `Actions.ts`

User-triggered action helpers.

MVP actions:

* create draft reply after user click
* build Google Calendar create-event URL
* support label/follow-up suggestions as UI-only recommendations

Should not:

* send email automatically
* create Calendar events directly in v1
* apply Gmail labels in v1
* modify Gmail state in v1

## `Config.ts`

Typed application configuration.

Should include:

* app name
* mock Gemini mode
* model name
* max thread characters
* max messages
* max output tokens
* temperature

Should not contain secrets.

## `types.ts`

Shared TypeScript types.

Should include:

* app config types
* Gmail event types
* thread data types
* clean thread types
* AI analysis types
* confidence types
* action owner types

---

# 7. OAuth and permissions approach

ThreadBrief should use the narrowest practical OAuth scopes.

The MVP should prefer add-on current-message scopes over broad Gmail API scopes.

Desired initial behavior:

* read only the currently opened Gmail thread
* only after user clicks `Summarize thread`

Avoid broad scopes unless explicitly required and reviewed:

* `gmail.readonly`
* `gmail.modify`
* `mail.google.com`
* `calendar`
* `calendar.events`
* broad mailbox search scopes

Labels and Calendar events are suggestions in v1.

Do not add `gmail.modify` just to apply labels unless the product explicitly moves into a v2 feature.

Do not add Calendar write scopes in v1. Use a prefilled Google Calendar URL instead.

Every OAuth scope must be documented in `docs/oauth-scopes.md` with:

* scope value
* why it is needed
* what feature uses it
* why a narrower scope is not enough
* whether it is MVP or future-only

---

# 8. Privacy and data handling

ThreadBrief deals with email content, so privacy boundaries are core product behavior.

Rules:

* Do not read email content until the user clicks `Summarize thread`.
* Do not scan the mailbox.
* Do not summarize automatically when a thread opens.
* Do not store email bodies by default.
* Do not log email bodies.
* Do not log AI prompts.
* Do not log AI responses.
* Do not log API keys.
* Do not log OAuth tokens.
* Do not include raw email content in error messages.

The UI should clearly say that the opened thread is sent to Gemini when real Gemini mode is enabled.

Mock mode should remain the default during early development.

Free-tier Gemini is acceptable for personal testing if the user accepts the data-handling implications. A public Marketplace version should be designed to move to paid Gemini API or Vertex AI with clearer production controls.

---

# 9. Gemini and AI design

Gemini integration should be isolated behind `GeminiClient.ts`.

The rest of the app should not care whether the model is:

* mock Gemini
* Gemini free tier
* paid Gemini API
* Vertex AI Gemini
* another provider in the future

The app should use a structured JSON prompt and a robust parser.

The model should be instructed to return JSON only.

The parser must assume the model may return malformed output.

AI output must include evidence and confidence where possible.

The model should distinguish:

* facts from interpretation
* explicit action items from things to consider
* high-confidence items from uncertain ones

Never trust the model to make irreversible changes.

For MVP:

* AI can suggest
* user decides
* user confirms any draft/send/calendar action

---

# 10. Expected AI response shape

Internal TypeScript should use camelCase.

External model JSON may use snake_case if that is easier for prompting.

The normalized internal shape should resemble:

```ts
type Confidence = 'high' | 'medium' | 'low';

type EmailAnalysis = {
  summary: {
    short: string;
    threadState: string;
  };
  explicitActionItems: ExplicitActionItem[];
  thingsToConsider: ThingToConsider[];
  suggestedReplyPoints: string[];
  suggestedCalendarEvent: SuggestedCalendarEvent | null;
  suggestedLabel: SuggestedLabel | null;
  followUp: FollowUpRecommendation;
  risksOrAmbiguities: string[];
};
```

ResponseParser should normalize unknown external input into this internal structure.

If parsing fails, return a safe fallback analysis rather than throwing into the UI.

---

# 11. UI principles

Gmail Add-ons use CardService. Do not try to build a custom React/HTML interface inside Gmail.

The UI should be:

* minimal
* readable
* calm
* sectioned clearly
* explicit about uncertainty
* explicit about privacy

Result card section order:

1. Summary
2. Explicit action items
3. Things to consider / think about
4. Suggested reply points
5. Suggested calendar event
6. Suggested label
7. Follow-up
8. Risks / ambiguities
9. Privacy footer

Use concise text. Gmail cards can become visually crowded quickly.

Prefer showing fewer high-quality items rather than many weak inferred items.

---

# 12. Error handling

All user-facing errors should be safe.

Never show:

* raw stack traces
* raw email content
* raw prompt
* raw AI response
* API key
* OAuth token

Use friendly messages such as:

* `Could not read the opened thread.`
* `Gemini API key is missing.`
* `AI response could not be parsed. Try again.`
* `The thread may be too long. Try summarizing the latest messages only.`

Errors can include non-sensitive metadata such as:

* error type
* whether mock mode is enabled
* whether API key is configured

Logs should be minimal and non-sensitive.

---

# 13. Testing approach

Unit-test pure functions only.

Good test targets:

* response parsing
* confidence normalization
* malformed JSON fallback
* fenced JSON handling
* thread cleaning
* quote stripping
* truncation
* prompt building
* calendar URL generation

Avoid trying to deeply unit-test Apps Script services such as:

* `CardService`
* `GmailApp`
* `UrlFetchApp`
* `PropertiesService`

Those should be covered mostly by manual testing in Apps Script/Gmail.

`npm run check` should run:

* format check
* lint
* tests
* build

No change should be considered complete unless `npm run check` passes or the failure is explicitly documented.

---

# 14. Linting and formatting approach

ThreadBrief uses:

* TypeScript strict mode
* ESLint flat config
* TypeScript-aware ESLint rules
* Prettier for formatting
* `eslint-config-prettier` to prevent conflicts

Prettier is the formatting source of truth.

ESLint should enforce correctness and maintainability, not compete with Prettier over formatting.

Expected standards:

* no `var`
* prefer `const`
* avoid `any`
* use `unknown` for external input
* explicit parsing for unknown data
* no unused variables except intentionally underscore-prefixed variables
* no `console.log`
* allow `console.warn` and `console.error` only for non-sensitive metadata
* small functions
* clear names
* no clever abstractions for simple Apps Script flows

---

# 15. Marketplace-readiness principles

Even though ThreadBrief starts as a personal add-on, it should be structured as if it may later be submitted to Google Workspace Marketplace.

This means:

* document every OAuth scope
* keep scopes narrow
* include privacy and security documentation
* avoid storing email content
* avoid hidden background processing
* avoid broad Gmail permissions
* keep AI data-processing behavior transparent
* keep user confirmation for write actions
* maintain a manual test plan
* keep a future demo-script document

Marketplace readiness does not mean implementing every feature now. It means avoiding architectural choices that make later review harder.

---

# 16. Future v2 features

These are intentionally postponed:

* Apply Gmail labels directly
* Create Calendar events directly
* Create Google Tasks
* Analyze attachments
* Search mailbox
* Summarize multiple unrelated threads
* Per-user settings UI
* Team/admin settings
* Cloud Run backend
* Paid Vertex AI provider
* Multi-provider AI abstraction
* Usage tracking
* Billing
* Marketplace publication flow

If implementing any v2 feature, update:

* `docs/project-context.md`
* `docs/oauth-scopes.md`
* `docs/architecture.md`
* `docs/manual-test-plan.md`
* `PRIVACY.md`
* `SECURITY.md`

---

# 17. Development workflow for coding agents

For each coding task:

1. Read `AGENTS.md`.
2. Read this document.
3. Read relevant docs in `docs/`.
4. Make the smallest possible change.
5. Do not add unrelated features.
6. Do not broaden OAuth scopes unless the prompt explicitly asks.
7. Do not add sensitive logging.
8. Run `npm run check`.
9. Summarize files changed.
10. Explain how to test.
11. List assumptions or TODOs.
12. Stop.

If a task appears to require a broader scope, do not silently add it. Instead:

* document why it may be needed
* propose the minimal scope
* explain the review/privacy impact
* stop for explicit confirmation

---

# 18. Non-negotiable rules

The following rules should not be violated without explicit human approval:

* Do not scan the mailbox.
* Do not read unrelated emails.
* Do not summarize automatically without user click.
* Do not store email bodies by default.
* Do not log email bodies.
* Do not log AI prompts.
* Do not log AI responses.
* Do not commit API keys.
* Do not commit `.clasprc.json`.
* Do not add `gmail.modify` casually.
* Do not add Calendar write scopes casually.
* Do not auto-send email.
* Do not create irreversible actions from AI output without user confirmation.

---

# 19. Short project summary for agents

ThreadBrief is a privacy-conscious Gmail Add-on that summarizes only the currently opened thread after the user clicks a button. It uses TypeScript source code bundled into Apps Script-compatible JavaScript, rendered through Google CardService, and calls Gemini API through an isolated client. The MVP is suggestion-first: it may create a draft reply after user confirmation, but calendar events, labels, and follow-up markers remain suggestions only. The project should remain Marketplace-ready by keeping OAuth scopes narrow, avoiding sensitive logging/storage, validating AI output, and documenting all permission/data-processing decisions.
