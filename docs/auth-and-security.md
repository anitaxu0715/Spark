# Authentication and security

## Trust model

Supabase Auth owns credentials, email confirmation, and sessions. The application uses only the project URL and publishable key. No service-role or secret key is needed.

Verification is not profile metadata. The trusted `memberships` row is derived from either a confirmed `auth.users.email` whose domain belongs to an active university or a confirmed invited account that redeemed a valid invite code. Members have no insert or update grant on memberships.

## Authorization boundaries

- Anonymous users can read active institution domains and the curated skill catalog, but not member profiles.
- Unverified authenticated users can read only their own base profile.
- Verified members can read discoverable, onboarded, non-blocked profiles.
- Owners can update only their own editable profile fields.
- Request rows and history are limited to their two participants.
- Saved profiles, notifications, blocks, reports, and feedback are owner-scoped.
- Operational roles are assigned only through a platform-admin RPC.
- Institution administrators are limited to explicitly assigned institutions.
- Moderators can read case snapshots and internal notes but cannot access private session feedback.
- Restricted and deletion-pending accounts cannot browse or mutate community data.

Security-definer helper functions live in the unexposed `private` schema, use an empty search path, and have narrowly granted execution. Business invariants are additionally protected by constraints and triggers.

Column privileges provide an additional boundary:

- Profile content is changed through `save_my_profile`; direct updates are limited to discoverability and location visibility.
- Request inserts exclude server-managed timestamps and state, while updates are limited to status and cancellation reason.
- Members can change only a notification's read timestamp.
- Report creation cannot set moderation state.
- Saved profiles, blocks, and private feedback cannot set server-managed timestamps.
- Clients cannot directly insert or update roles, moderation cases, restrictions, audit events, reschedule state, or deletion state.

## Authentication flows

- Sign-up validates form structure, checks the public allowlist or invite-code hash for useful feedback, and remains authoritatively enforced by the before-user-created Auth hook.
- Confirmation and recovery callbacks exchange one-time tokens for cookie sessions.
- Password recovery responses do not reveal whether an account exists.
- Intended destinations accept only same-origin path values.
- Proxy refreshes sessions, while pages and actions repeat authentication close to data access.

## Operational assumptions

Production must configure an approved SMTP provider, exact redirect URLs, institution domains, invite-code issuance procedures, secure environment management, and a database-owner schedule for `private.purge_due_accounts()`. The purge function is not executable by anonymous, authenticated, or service-role clients. The development `spark.test` domain, local invite code, and seed credentials are local-only.

Audit events capture role changes, moderation transitions, case notes, restrictions, institution changes, deletion requests, cancellations, and purges. Audit rows are append-only to application clients. Moderators can read moderation-linked events; institution administrators can read events for assigned institutions; platform administrators can read all audit events.

## Dependency audit

The current npm advisory report traces two moderate findings to one transitive PostCSS advisory inside Next.js 16.2.10. Next.js pins PostCSS 8.4.31 exactly, and npm offers no compatible patched Next.js release. Spark processes only repository-controlled CSS and does not stringify member-provided CSS. A forced downgrade or untested override was therefore rejected; the dependency should be updated when Next.js publishes a compatible fix.
