# Live Leads

Internal TikTok LIVE sales lead dashboard for a Tunisian clothing seller.

## MVP Scope

- Capture TikTok LIVE comments through an isolated local collector.
- Store only comments containing valid Tunisian phone numbers.
- Normalize phones to E.164 and deduplicate by `live_session_id + phone_hash`.
- Keep every valid comment for the same phone in `lead_comments`.
- Support manual call tracking and a `new comment after call` workflow.
- Support English, Arabic, and French with RTL layout for Arabic.
- Delete or anonymize phone numbers after 7 days.

## Stack

- TypeScript
- Next.js App Router dashboard
- Supabase Postgres/Auth
- Local Node.js collector
- pnpm workspaces and Turborepo

## Project Layout

```txt
apps/
  web/          Next.js dashboard
  collector/    Local TikTok LIVE collector CLI
packages/
  shared/       Shared schemas, types, and utilities
supabase/
  migrations/   Database migrations
docs/           Supporting docs
```

## Local Setup

```bash
pnpm install
pnpm dev:web
```

Collector placeholder:

```bash
pnpm --filter collector start -- --session LIVE_SESSION_ID --mock
```

## Environment

Copy examples before running real integrations:

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/collector/.env.example apps/collector/.env
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Supabase Setup

Project values currently used locally:

```txt
Project URL: https://rqsrptyeipageiklmatc.supabase.co
Admin email: bensalemabdelaziz97@gmail.com
Organization: Bs society
TikTok username: lella.khadija.fashion
```

Manual setup:

1. Open Supabase Dashboard.
2. Open project `rqsrptyeipageiklmatc`.
3. Go to `SQL Editor`.
4. Run `supabase/migrations/0001_initial_schema.sql`.
5. Go to `Authentication` -> `Users` -> `Add user`.
6. Create `bensalemabdelaziz97@gmail.com` with a password you control.
7. Copy the new user UUID.
8. Open `supabase/seed_admin_template.sql`.
9. Replace every `PUT_AUTH_USER_ID_HERE` with that UUID.
10. Run the edited seed SQL in `SQL Editor`.

The seed creates:

- organization `Bs society`
- admin profile for `bensalemabdelaziz97@gmail.com`
- draft live session for `lella.khadija.fashion`

Keep the service role key only in local env files and deployment environment variables.

To find the live session ID after seeding:

```sql
select id, tiktok_username, title, status
from public.live_sessions
order by created_at desc;
```

Then test collector mock mode:

```bash
pnpm --filter collector start -- --session LIVE_SESSION_ID --mock
```

Expected database result:

- `leads` has one row for `+216 98 421 295`
- `lead_comments` has four rows
- comment `prix svp` is skipped
- lead `comment_count` is `4`

To test a real TikTok LIVE:

```bash
pnpm --filter collector start -- --username lella.khadija.fashion --session LIVE_SESSION_ID
```

The TikTok collector is unofficial and depends on TikTok's internal LIVE services.
If the account is offline, private, region-blocked, or TikTok changes its service,
the connector may fail or reconnect repeatedly. Keep this collector local and
isolated from the dashboard.

## Current State

Phase 0 bootstrap is complete: monorepo structure, package scripts, and placeholder app entry points are in place.

Phase 1 has started with the shared Tunisia phone extractor:

- accepts 8-digit local numbers, `216` prefix, `+216` prefix, spaces, dashes, dots, and Arabic digits
- normalizes valid phones to `+216XXXXXXXX`
- returns display format as `+216 XX XXX XXX`
- removes the matched phone from comment content
- rejects comments without a valid Tunisian phone number

## Verification Commands

After dependency changes, run:

```bash
pnpm install
pnpm --filter @live-leads/shared test
pnpm typecheck
pnpm lint
```
