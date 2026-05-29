# Tech Stack and Architecture

## Stack decision

Use TypeScript across the app.

```txt
Frontend/dashboard: Next.js App Router + TypeScript + Tailwind + shadcn/ui
Backend API: Next.js Route Handlers
Database: Supabase Postgres
Auth: Supabase Auth
Collector: Node.js TypeScript local worker
Phone parsing: libphonenumber-js
Validation: zod
Package manager: pnpm
Monorepo: pnpm workspaces + Turborepo
Deployment test: Vercel for dashboard, Supabase for DB, local collector on laptop
```

## Why this stack

- Next.js is fast for dashboard building.
- Supabase gives Auth + Postgres + Realtime-ready DB quickly.
- Local collector avoids serverless timeout problems.
- TypeScript is easier for AI agents to maintain than mixed JS/Python.
- The collector is isolated so TikTok can later be replaced by another source.

## High-level architecture

```txt
TikTok LIVE
  ↓
Local Node collector
  ↓
Supabase service role insert/upsert
  ↓
Postgres tables
  ↓
Next.js dashboard
  ↓
Operators manually call clients
```

## App separation

### apps/web

Responsible for login, dashboard UI, live sessions, lead table, status updates, notes, CSV export, and user admin.

### apps/collector

Responsible for TikTok LIVE connection, comment events, phone extraction, lead upsert, comment append, reconnect, and logs.

### packages/shared

Responsible for phone extraction utilities, status enum, zod schemas, and shared TypeScript types.

## Critical rule

Never expose the Supabase service role key to the frontend.
