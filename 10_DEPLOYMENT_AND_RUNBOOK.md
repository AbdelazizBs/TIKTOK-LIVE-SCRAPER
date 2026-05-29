# Deployment and Runbook

## Free test deployment

Use:

```txt
Dashboard: Vercel
Database/Auth: Supabase
Collector: local laptop during live
```

Do not run TikTok collector in a Vercel serverless route. The collector is long-running and should stay local or move later to a worker/VPS.

## Supabase setup

1. Create Supabase project.
2. Copy Project URL, anon public key, service role key.
3. Run SQL migration.
4. Create first organization.
5. Create first admin auth user.
6. Create matching profile row.

## Vercel setup

Set environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEFAULT_COUNTRY=TN
APP_URL=
```

Use Vercel monorepo settings:

```txt
Root directory: apps/web
Build command: pnpm build
Install command: pnpm install
Output: .next
```

## Local collector run during live

Start a live session in dashboard. Copy command:

```bash
cd apps/collector
pnpm start -- --username your_tiktok_username --session LIVE_SESSION_ID
```

Keep terminal open.

## During live checklist

- Dashboard open.
- Collector terminal running.
- Live session status is running.
- New leads appearing.
- Operators use filter `New`.
- After manual call, mark status.
- Watch `New comment after call`.

## Production upgrade later

Options:

1. Paid always-on worker/VPS for collector.
2. Approved third-party TikTok LIVE API provider.
3. TikTok Shop official integrations for orders.
4. Social source abstraction for Instagram/Facebook later.
