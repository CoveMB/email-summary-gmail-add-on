# OAuth Scopes

Future scopes must be added only when a feature requires them and must be documented with the reason, user-facing behavior, and least-permission alternative considered.

## Current Position

- Uses only the current-message Gmail add-on readonly scope for Gmail content access.
- Uses the current Gmail add-on compose/action scope for user-reviewed draft reply creation.
- No Gmail modify scope.
- No Calendar scope.
- No mail send scope.
- No broad Workspace scope.

## Future Review Rules

- Prefer contextual add-on access before broad mailbox access.
- Avoid broad Gmail scopes unless a narrower option cannot support the feature.
- Postpone Calendar write scopes until calendar event creation is implemented.
- Postpone Gmail modify scopes until label application or thread mutation is implemented.

## Scopes

Scope:
https://www.googleapis.com/auth/gmail.addons.current.action.compose

Reason:
Allows EmailSummary to create a user-reviewed reply draft from the currently opened Gmail context after explicit user action. This does not allow sending email automatically.

Scope:
https://www.googleapis.com/auth/gmail.addons.current.message.readonly

Reason:
Allows EmailSummary to read metadata for only the currently opened Gmail message/thread after user action in the add-on.

Scope:
https://www.googleapis.com/auth/gmail.addons.execute

Reason:
Allows the Gmail add-on to execute inside Gmail.

## Draft Reply Status

The current `Create draft reply` path creates a deterministic reply draft from suggested reply points when available. The add-on does not send email; the user must review, edit, and send manually.
