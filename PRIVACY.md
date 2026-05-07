# Privacy Policy Draft

EmailSummary is currently a personal/testing Gmail Add-on. This draft must be reviewed and completed before any public Google Workspace Marketplace submission.

## Intended Data Use

EmailSummary is intended to process only the Gmail thread currently opened by the user. Email content should only be processed after a user action, such as clicking `Summarize thread`.

## Storage

Email content should not be stored by default. The app should not log raw email bodies, prompts, or AI responses by default.

## AI Processing

Mock mode does not send email content to Gemini. When real Gemini mode is manually enabled, cleaned text from the currently opened Gmail thread is sent to the Gemini API for analysis after the user clicks `Summarize thread`.

Free-tier Gemini API use should be treated as personal testing only and is subject to Google's current terms, quota limits, and data handling requirements. Early tests should use synthetic or non-sensitive threads. Do not use raw personal, confidential, client, financial, medical, legal, credential, or regulated emails for early real-mode tests.

Users should review all AI-generated summaries, action items, suggested replies, calendar suggestions, labels, and risk notes before acting on them.

## User Control

The app should use least-permission OAuth scopes and request only permissions needed for implemented features.

Real Gemini mode is controlled by `CONFIG.USE_MOCK_GEMINI`. Keep it set to `true` for normal development, set it to `false` only for a controlled manual test, and switch it back to `true` immediately after testing.

## Status

This is a draft for personal/testing use and is not final legal text.
