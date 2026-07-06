# Data model

## Identity and verification

- `universities` stores active institutions.
- `university_domains` stores allowlisted domains and marks development-only entries.
- `memberships` is the trusted verification record linked to `auth.users`.
- `profiles` stores public and preference data, not authentication credentials.
- `profile_locations` isolates the location field behind visibility-specific RLS.

An Auth hook rejects new users outside the allowlist. An `auth.users` trigger creates the base profile and creates membership only after email confirmation.

## Skills and profiles

`skills` is a curated, case-normalized catalog. `profile_skills` joins a profile to a skill in either teaching or learning mode. Members cannot create arbitrary catalog entries.

## Learning requests

`learning_requests` stores participants, requested and offered skills, meeting format, UTC preferred time, status, and cancellation metadata. A partial unique index prevents duplicate active requests. A trigger enforces immutable request details and actor-specific transitions.

`request_status_events` records lifecycle changes. `notifications` is populated by the same request transaction.

## Safety and privacy

- `saved_profiles` is private to its owner.
- `blocks` is private to the blocker and removes related saved-profile rows.
- `reports` is visible to the reporter; moderation status is not member-editable.
- `session_feedback` is private to its author and requires a completed request.

All foreign keys used by common participant, discovery, and notification queries are indexed.
