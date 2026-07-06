# Architecture

## Runtime boundaries

The Next.js application uses Server Components for authenticated reads and Server Actions for mutations. Interactive filters, dialogs, request controls, and profile forms remain Client Components.

`@supabase/ssr` stores the session in cookies. `src/proxy.ts` refreshes sessions and performs early route redirection, but it is not an authorization boundary. Server Actions call `auth.getUser()` and PostgreSQL applies Row Level Security to every request.

Row policies control which records a member can access. Column-level grants separately restrict which fields may be supplied through the data API. Profile content is written through one transactional RPC, while direct profile updates are limited to the two privacy columns. Request updates are limited to status and cancellation reason, and notification updates are limited to read state.

`getViewer` resolves the authenticated profile, membership, operational roles, active restriction, and pending deletion state once per server render. Community pages redirect restricted or deletion-pending accounts to a safe status page. Moderator and institution routes additionally require an explicit database-backed role; the same checks are repeated by security-definer RPCs and RLS.

## Data access

Focused modules separate profile, request, and notification queries. They select only fields required by their consumers and map database rows into presentation-safe domain objects. Hidden location values are not fetched because location is protected in a separate table.

Moderation cases retain report, subject, and optional request snapshots so safety evidence can survive later account deletion. Internal notes, restriction reasons, and audit events never enter member DTOs. Institution administrators see only assigned institutions; platform administrators have global operational scope.

## Mutation flow

```text
Form or control
  → Server Action validation
  → authenticated Supabase client
  → PostgreSQL constraints, triggers, and RLS
  → transactional notification or status event
  → Next.js path revalidation
```

Onboarding and profile edits use the `save_my_profile` database function. The function replaces skill relationships and marks onboarding complete in one transaction, preventing partially completed profiles.

Rescheduling is a proposal state machine. An accepted learning request can have one pending proposal; only the other participant can accept or decline it. Acceptance updates the request time and format transactionally.

Deletion is a delayed state machine. Recent password verification precedes the deletion RPC, which hides the profile and cancels active requests. The user can cancel during the seven-day window. The database-owner purge routine removes the Auth account and cascading personal records while anonymizing retained safety evidence.

## Configuration behavior

The application compiles without Supabase environment variables. At runtime, missing configuration renders a clear setup state rather than mock data. Authenticated data never falls back to static modules or browser storage.

## Acceptance testing

Vitest covers validation and DTO behavior, pgTAP exercises database authorization, and Playwright runs the local email-confirmation, password-recovery, role isolation, export, deletion cancellation, responsive, keyboard, and isolated multi-user request workflows in Chromium, Firefox, and WebKit. Playwright resets only the local Supabase database before a run.
