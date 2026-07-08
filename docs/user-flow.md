# User flow

## Primary journey

1. A visitor signs up with an allowlisted academic email or a personal email plus invite code.
2. They confirm the email and complete onboarding.
3. They discover verified members through URL-backed filters.
4. They open `/people/[slug]`, review privacy-safe profile details, and send a request.
5. The recipient sees an incoming request and notification, then accepts or declines.
6. The sender sees the durable status update.
7. Either participant completes or cancels an accepted request.
8. Each participant may submit private feedback after completion.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction and featured profiles |
| `/discover` | Search and filter community profiles |
| `/people/[id]` | Review a skill profile, save it, or send a request |
| `/requests` | Manage incoming and sent requests |
| `/profile` | View and edit the current-user profile |
| `/onboarding` | Create the current-user profile |
| `/notifications` | Review request events and read state |
| `/settings/privacy` | Manage discoverability, location, and blocks |
| `/auth/*` | Sign-up, confirmation, sign-in, and recovery |

## Request lifecycle

```text
Pending → Accepted → Completed
   │          └──→ Cancelled
   ├─────────────→ Declined
   └─────────────→ Cancelled
```

Incoming pending requests can be accepted or declined. Accepted requests can be marked completed or cancelled. Status updates and new sent requests persist in PostgreSQL and remain participant-only.

## Alternate and error paths

- Discovery with no matches shows a clear-filter action.
- An unknown profile ID shows a dedicated not-found state.
- Incomplete request fields show inline validation without losing entered data.
- A database or network failure leaves the form open and displays an actionable error.
- Empty request filters explain why there are no matching items.
- Profile editing and onboarding validate required identity, skill, and availability fields.
- Blocked or hidden profiles use the same unavailable state to avoid disclosing their existence.
- Every in-person request displays: “Meet in a public place and tell someone you trust.”
