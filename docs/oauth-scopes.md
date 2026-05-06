# OAuth Scopes

No Gmail scopes are declared yet.

Future scopes must be added only when a feature requires them and must be documented with the reason, user-facing behavior, and least-permission alternative considered.

## Current Position

- No Gmail read scope.
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
https://www.googleapis.com/auth/gmail.addons.current.message.readonly

Reason:
Allows EmailSummary to read only the currently opened Gmail message/thread after the user opens the add-on.

Scope:
https://www.googleapis.com/auth/gmail.addons.current.action.compose

Reason:
Allows EmailSummary to compose a response based on the summary.

Scope:
https://www.googleapis.com/auth/script.external_request

Reason:
Allows EmailSummary be used.

Scope:
"https://www.googleapis.com/auth/gmail.addons.execute"

Reason:
Allows EmailSummary execute.