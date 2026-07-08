# Staging release checklist

## Repository

- Recover the existing remote repository, or explicitly approve a new Git history.
- Protect the default branch and require the CI workflow.
- Review the first complete snapshot before pushing it to a remote.

## Supabase staging project

- Create a dedicated staging project in the intended production region.
- Keep the database password, secret key, service-role key, and SMTP credentials out of the web runtime.
- Link the CLI only after confirming the staging project reference.
- Apply migrations with the Supabase migration workflow; do not run the deterministic local seed.
- Create the first platform administrator through a reviewed database-owner operation.
- Add only approved academic domains and reviewed invite-code hashes. Never add `spark.test` or local test invite codes outside local development.

## Authentication and email

- Set the Site URL to the exact staging origin.
- Allow only the required confirmation and recovery callback URLs.
- Configure an approved SMTP provider and sender domain.
- Verify academic signup, invited personal-email signup, invalid invite rejection, confirmation, expired links, recovery, and enumeration-resistant responses.
- Review password, OTP expiration, and email-rate-limit settings.

## Web application

- Configure only the Supabase URL, publishable key, and exact site URL.
- Confirm that no secret or service-role key exists in build logs, runtime variables, or client bundles.
- Deploy from a CI-validated revision.
- Verify the Content Security Policy and other response headers against the deployed origin.

## Database operations

- Schedule `select private.purge_due_accounts();` as the database owner at least daily.
- Test deletion, cancellation, due purge, and repeated purge execution in staging.
- Configure backups and perform a restore exercise before beta invitations.
- Define who can assign roles, review reports, and respond to operational alerts.

## Acceptance gate

- Run database reset, lint, pgTAP, unit tests, lint, type checking, and production build in CI.
- Run Chromium, Firefox, and WebKit against staging-safe test accounts.
- Verify 390px, 768px, and desktop layouts with keyboard-only navigation.
- Confirm exports contain only the requesting member's permitted data.
- Confirm member, moderator, institution-admin, and platform-admin route isolation.
- Record the deployed revision, migration list, environment owner, and rollback decision.

## Beta launch

- Begin with one institution and 10–30 invited members.
- Publish support, privacy, deletion, and report-response expectations.
- Monitor signup failures, request completion, reports, restrictions, deletion jobs, and application errors.
- Hold expansion until the first operational review is complete.
