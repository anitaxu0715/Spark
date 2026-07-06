# Phase 2 scope

## In scope

- Cookie-based Supabase email and password authentication
- Confirmed academic-domain membership
- PostgreSQL persistence for profiles, skills, requests, saves, notifications, blocks, reports, and feedback
- Privacy-aware discovery and profile visibility
- Request acceptance, decline, cancellation, completion, and private feedback
- In-app notifications
- Deterministic local seed accounts and data
- Database and application security tests
- Local Chromium acceptance tests for authentication, responsive behavior, keyboard interaction, and the two-user workflow

## Out of scope

- Social login, university single sign-on, and multi-factor authentication
- Chat, video calls, email product notifications, and calendar integration
- Payments, credits, public reviews, rankings, or recommendations
- Administrative dashboards and automated moderation
- File uploads, maps, geolocation, analytics services, and production deployment

## Acceptance criteria

- Confirmed allowlisted email membership is required for community access.
- Verification cannot be created or edited by normal members.
- Discovery excludes hidden, unverified, current-user, and blocked profiles.
- Location is unreadable when a member hides it.
- Request rows are participant-only and transitions follow actor-specific rules.
- Blocking prevents discovery, saves, and new requests in both directions.
- Notifications, reports, and feedback remain owner- or participant-scoped.
- Migrations and seed data reproduce the environment.
- Database lint, pgTAP, unit tests, integration tests, Playwright, lint, type checking, and build pass.

## Future backlog

- Moderation case management
- Account deletion and data export
- Notification preferences
- Session rescheduling
- Cross-browser automation in continuous integration
- Institution-managed membership policies
