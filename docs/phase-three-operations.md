# Phase 3 operations

## Operational roles

Roles are stored in `user_roles`; institution scope is stored separately in `institution_admin_assignments`. Only a platform administrator can call `platform_set_role`. Do not manage these tables through browser credentials or copy seeded role assignments to production.

Local operational accounts are documented in the root README. They are deterministic test fixtures, not production bootstrap instructions.

## Moderation

Every member report opens one moderation case with durable snapshots. Moderators can move a case through the enforced transition graph, add internal notes, and apply or revoke a restriction. Escalation requires an internal reason. A restriction hides the subject profile and disables community mutations immediately.

Internal report state, snapshots, notes, restriction reasons, and audit events must never be copied into member-facing support responses or analytics exports.

## Account deletion

The web flow re-verifies the current password before requesting deletion. A request immediately hides the profile and cancels pending or accepted learning requests. The account owner can cancel for seven days.

Production must invoke the following as the database owner on a recurring schedule:

```sql
select private.purge_due_accounts();
```

Run at least daily. The function locks due rows, skips work already claimed by another run, marks the request purged, deletes the Auth user, and returns the number of purged accounts. Calling it again is safe. It is intentionally unavailable to PostgREST clients, including the service role.

Before enabling the schedule in production:

1. Verify backups and retention obligations.
2. Confirm the grace period and privacy language with the product owner.
3. Run a deletion request and cancellation in a staging project.
4. Run a due purge in staging and verify Auth, profile, request, report, moderation, and audit behavior.
5. Monitor purge counts and database errors without logging personal export data.

## Data export

The authenticated export route returns a no-store JSON attachment containing the caller's account, profile, membership, location, skills, participant requests, saved profiles, notifications, blocks, submitted reports, private feedback, notification preferences, and deletion history. It does not include moderation decisions, internal notes, restriction reasons, other members' private data, or audit events.

## Institution changes

Disabling a domain prevents future signups but does not revoke existing verified memberships. Disabling an institution prevents future signups for all of its domains. Development domains can be added or changed only by a platform administrator.

## Release checks

From the repository root, reset and validate the database, then run the application suite from `web`. CI repeats the same checks and runs Playwright in Chromium, Firefox, and WebKit. Never point local acceptance automation at a production Supabase project.
