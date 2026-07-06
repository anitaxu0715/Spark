# Phase 1 historical scope

This document records the original prototype boundary. Phase 2 replaced its browser-only data model with authenticated Supabase persistence; it is not a description of the current runtime.

## In scope

- Responsive frontend built with Next.js, TypeScript, and Tailwind CSS
- Landing page and shared navigation
- Eight sample university student profiles
- Skill discovery search and filters
- Dynamic profile pages and saved profiles
- Validated learning request submission
- Incoming and sent request management
- Pending, accepted, completed, and declined request statuses
- Current-user profile viewing and editing
- Guided onboarding
- Browser-only prototype persistence
- Relevant safety guidance, accessible controls, and useful empty states

## Out of scope

- Authentication and university identity verification
- Databases and cross-device synchronization
- Chat, realtime updates, email, and push notifications
- Video calls, maps, geolocation, and scheduling integrations
- Payments, credits, or token systems
- Recommendations, ranking algorithms, or automated mentors
- Administrative dashboards

## Acceptance criteria

- Every navigation and call-to-action link resolves to a working route.
- Discovery controls can be combined and cleared.
- Every profile card opens the correct profile.
- Unknown profile IDs show a useful recovery path.
- A valid learning request persists and appears under sent requests.
- Incoming requests can be accepted or declined; accepted requests can be completed.
- Request status changes survive a refresh.
- Profile edits and onboarding data survive a refresh.
- Forms expose labels, inline errors, visible focus, and keyboard-reachable actions.
- In-person requests include the required safety reminder.
- The layout remains usable at mobile, tablet, and desktop widths.
- Lint and production build validation pass.

## Originally deferred

Most of these items were delivered in Phases 2 and 3. They remain here only to preserve the original project boundary.

- Authenticated accounts and durable profile ownership
- University community verification and privacy controls
- Notifications and calendar-aware scheduling
- Request cancellation and rescheduling
- Blocking, reporting, and moderation workflows
- Post-session feedback and trust signals
- Research-backed discovery improvements
- Product analytics with clear consent and data retention policies
