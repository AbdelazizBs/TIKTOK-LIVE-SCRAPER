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

To run the collector as a background local worker:

```bash
pnpm --filter collector start -- --watch
```

Then use the dashboard to start live sessions from a TikTok LIVE URL or username.
The collector will pick up the newest running session.

To test a real TikTok LIVE with an explicit session:

```bash
pnpm --filter collector start -- --username lella.khadija.fashion --session LIVE_SESSION_ID
```

The TikTok collector is unofficial and depends on TikTok's internal LIVE services.
If the account is offline, private, region-blocked, or TikTok changes its service,
the connector may fail or reconnect repeatedly. Keep this collector local and
isolated from the dashboard.

The frontend live dashboard is available at:

```txt
/live-sessions
```

It polls the server every 2 seconds and shows:

- one card per phone number
- latest clean content
- comments for the selected number only
- comment counts and new-comment-after-call status
- active leads separated from confirmed clients

The browser calls a server-only Next.js route. The Supabase service role key is
never exposed to client code.

## Business Logic

- Operators manually call numbers from the active list.
- When the client is confirmed, check `Confirmed client`.
- Confirmed clients move out of the active list into `Confirmed clients`.
- The cleanup cron deletes confirmed leads, their comments, and call attempts
  after the live is ended or after 30 seconds. This short delay is for testing.

Run the second migration in Supabase before enabling cleanup:

```txt
supabase/migrations/0002_confirmed_cleanup.sql
```

Vercel cron is configured to call every minute:

```txt
/api/cron/cleanup-confirmed
```

The dashboard lead list polls every 2 seconds. That API reads Supabase, not
TikTok. TikTok is read only by the local collector. For scale, the lead list
returns at most 500 lead summaries and does not include all comment history.
Comments are fetched separately only when a phone number is selected.

## Operator Flow

1. Seller opens TikTok LIVE.
2. Operator opens `/live-sessions`.
3. Operator pastes TikTok LIVE URL or username.
4. Operator clicks `Start live session`.
5. Local collector running in `--watch` mode connects to that live session.
6. Valid Tunisian phone comments appear in the active call list.
7. Operator manually calls each number.
8. Operator checks `Confirmed client`.
9. Confirmed clients disappear from the active list.
10. Operator clicks `Stop live session` when done.
11. To search the live again later, paste the URL or username and click
    `Start live session` again.
12. Cleanup cron removes confirmed lead data.

Text-only follow-up comments:

- A comment without a phone number never creates a lead.
- If the same TikTok account has exactly one recent active lead in the current
  live session, the text-only comment is appended to that lead.
- If the same TikTok account has multiple recent numbers, the collector skips
  the text-only comment instead of guessing which phone/order it belongs to.
- The UI flags leads when one TikTok account used multiple numbers.

Phone typo handling:

- Exact valid Tunisian phone numbers are stored normally.
- If a comment contains a mixed typo such as `98f253621`, `22545965za`, or
  `98 d214 222`, the parser tries to recover a valid Tunisian phone number.
- Recovered numbers are shown with a `Possible typo` badge so the operator can
  confirm the number manually before calling.

The stat cards are filters:

- `Active numbers` shows unconfirmed leads.
- `Waiting` shows uncalled active leads.
- `Confirmed` shows confirmed leads for review.
- `All comments` shows every lead in the current session.

For testing, confirmed leads in one live session can be deleted immediately with:

```txt
/api/cron/cleanup-confirmed?force=1&session=LIVE_SESSION_ID
```

The dashboard button uses this scoped cleanup automatically for the currently
loaded live session.

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
