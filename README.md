# Spark

Spark is a peer-to-peer skill exchange for university communities. Verified students can share practical skills, discover approachable peers, and coordinate focused learning sessions without marketplace or popularity mechanics.

Phase 3 extends the durable multi-user beta with operational tooling, account lifecycle controls, and cross-browser acceptance coverage.

## Product capabilities

- Academic email-and-password sign-up, confirmation, sign-in, sign-out, and password recovery
- Trusted university membership derived from confirmed authentication data
- Authenticated, privacy-aware member discovery with URL-backed filters
- Database-backed profiles, curated teaching and learning skills, and saved profiles
- Participant-only learning requests with enforced lifecycle transitions and cancellation
- Durable in-app notifications with read state
- Discoverability and location privacy settings
- Blocking, profile reporting, and private post-session feedback
- Responsive layouts, keyboard-accessible dialogs, inline validation, and in-person safety guidance
- Moderator case queues, case notes, audited transitions, and temporary or indefinite restrictions
- Institution-scoped domain administration with platform-admin overrides
- Participant-approved request rescheduling
- In-app notification preferences
- Authenticated JSON data export
- Password-confirmed account deletion with a seven-day cancellation window
- Chromium, Firefox, and WebKit acceptance coverage in CI

## Technology

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, and Supabase SSR
- Zod validation
- Vitest, pgTAP, and Playwright
- Supabase CLI with Docker-compatible local services

## Repository structure

```text
.
├── docs/
├── supabase/
│   ├── migrations/
│   ├── tests/database/
│   ├── config.toml
│   └── seed.sql
├── web/
│   ├── src/actions/
│   ├── src/app/
│   ├── src/components/
│   ├── src/lib/
│   └── src/types/database.ts
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js 20.9 or newer
- npm
- Docker Desktop or another Docker-compatible engine

## Local setup

From the repository root:

```powershell
cd web
npm.cmd install
.\node_modules\.bin\playwright.cmd install chromium firefox webkit
cd ..
.\web\node_modules\.bin\supabase.cmd start
.\web\node_modules\.bin\supabase.cmd status
Copy-Item web\.env.example web\.env.local
```

Update `web/.env.local` with the local API URL and publishable key printed by `supabase status`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_local_publishable_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Only the publishable browser key belongs in the web environment. Do not add a secret or service-role key.

Recreate the database and start the application:

```powershell
.\web\node_modules\.bin\supabase.cmd db reset
cd web
npm.cmd run dev
```

Open `http://localhost:3000`. Local confirmation and recovery emails appear in Mailpit at `http://127.0.0.1:54324`.

## Local development accounts

These accounts exist only in the deterministic local seed:

| Member | Email | Password |
| --- | --- | --- |
| Anita | `anita@spark.test` | `SparkLocal!2026` |
| Maya Chen | `maya@spark.test` | `SparkLocal!2026` |
| Moderator | `moderator@spark.test` | `SparkLocal!2026` |
| Institution admin | `institution-admin@spark.test` | `SparkLocal!2026` |
| Platform admin | `admin@spark.test` | `SparkLocal!2026` |

The `spark.test` domain is explicitly marked as development-only. Never reuse these credentials or seed users in a production project.

## Database and validation commands

Run Supabase commands from the repository root:

```powershell
.\web\node_modules\.bin\supabase.cmd db reset
.\web\node_modules\.bin\supabase.cmd db lint --local --level warning
.\web\node_modules\.bin\supabase.cmd test db
.\web\node_modules\.bin\supabase.cmd gen types typescript --local
```

Run application validation from `web`:

```powershell
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

The generated database types are checked in at `web/src/types/database.ts`. Regenerate them after every schema migration.

`npm.cmd run test:e2e` resets only the local Supabase database, starts the Next.js development server, and exercises authentication email flows through local Mailpit. Never point this command at a production environment.

## Authentication behavior

The public landing and authentication routes do not expose member records. Community routes require a valid cookie-based session and a trusted membership created from a confirmed allowlisted email domain. Confirmed members without a complete profile are directed to onboarding. The Next.js proxy refreshes sessions and provides optimistic redirects; every data mutation independently authenticates the caller and remains subject to PostgreSQL authorization.

## Security model

- Every exposed user-data table has Row Level Security.
- Column-level grants prevent members from writing ownership, moderation, immutable request, notification event, and server-managed timestamp fields.
- Membership verification is created by an Auth-linked database trigger and cannot be edited through profile data.
- Location is stored in a separate table with visibility-specific policy checks.
- Request participants, offered skills, active-request uniqueness, blocking, and lifecycle transitions are enforced in PostgreSQL.
- Notifications are created transactionally from request changes.
- Reports expose no moderation controls to members.
- Session feedback is private, participant-scoped, and limited to completed requests.
- Operational roles and institution assignments are server-controlled and protected by RLS.
- Restrictions immediately remove community mutation access and hide the affected profile.
- Moderation snapshots, internal notes, restriction reasons, and audit records are role-scoped.
- Rescheduling requires both participants: one proposes and the other accepts or declines.
- Account deletion requires recent password verification and uses a delayed, owner-only purge routine.
- No secret or service-role key is used by the application.

See [docs/auth-and-security.md](docs/auth-and-security.md) for detailed trust boundaries.

## Phase 1 data

Supabase is the sole source of truth. The application does not dual-write or silently import Phase 1 browser data. Seeded demo requests are intentionally not migrated into real accounts. Existing browser-only profile edits and saves can be reviewed manually, but are not automatically trusted or copied to a verified account.

## Current limitations

- Academic verification is domain-based rather than institution-issued identity proof.
- Notifications are in-app only and refresh on navigation.
- Blocked-member settings use a non-identifying reference because blocked profiles are not readable.
- There is no chat, calendar integration, file upload, external notification delivery, or production deployment configuration.
- Account purge scheduling must be configured in the production database scheduler; the repository supplies the owner-only purge function and runbook.
- `npm audit` reports the moderate PostCSS advisory GHSA-qx2v-qp2m-jg93 through Next.js 16.2.10. Next.js pins PostCSS 8.4.31 and has no non-breaking patched release as of this audit. Spark does not stringify user-controlled CSS; the dependency remains pinned pending an upstream Next.js release.

Production operational steps are documented in [docs/phase-three-operations.md](docs/phase-three-operations.md).
Staging preparation and release gates are documented in [docs/staging-release-checklist.md](docs/staging-release-checklist.md).
