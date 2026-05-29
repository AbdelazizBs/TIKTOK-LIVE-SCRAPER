# AI Agent Phases

## How to use this with Codex or other agents

Give the agent only one phase at a time. After each phase: run the app, run typecheck, fix errors, commit, continue.

## Phase 0 - Repository bootstrap

Goal: create monorepo, web app, collector app, shared package, scripts.

Acceptance:

```bash
pnpm install
pnpm dev:web
pnpm --filter collector typecheck
```

## Phase 1 - Shared phone parsing package

Goal: Tunisia-only phone extractor, E.164 normalization, clean content splitting, Arabic digit support.

Acceptance examples:

```txt
"98421295" -> +21698421295, clean ""
"robe rouge 98421295 taille M" -> +21698421295, clean "robe rouge taille M"
"+216 98 421 295 noir L" -> +21698421295, clean "noir L"
"21698421295" -> +21698421295
"٩٨٤٢١٢٩٥ robe" -> +21698421295, clean "robe"
```

## Phase 2 - Supabase schema

Goal: create migration, tables, indexes, retention function.

## Phase 3 - Supabase clients and auth

Goal: browser client, server client, login page, protected dashboard, logout.

Decision: use email/password for stable MVP login. Add `profiles.username` for display.

## Phase 4 - Admin users

Goal: admin creates operator users using server-only route with service role.

## Phase 5 - Live sessions

Goal: create sessions, list sessions, detail page, collector command.

## Phase 6 - Collector MVP

Goal: connect to TikTok LIVE, listen comments, extract phone, upsert lead, append comment, reconnect.

## Phase 7 - Lead dashboard

Goal: poll leads every 2 seconds, filters, comments drawer.

## Phase 8 - Manual call workflow

Goal: copy phone, mark called, confirmed, no answer, cancelled, wrong number, add note.

## Phase 9 - i18n and UI polish

Goal: English/Arabic/French, RTL for Arabic, style inspired by screenshot.

## Phase 10 - Export and retention

Goal: CSV export, retention cleanup action.

## Phase 11 - Deploy test

Goal: Vercel dashboard, Supabase DB, local collector.
