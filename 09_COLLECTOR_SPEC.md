# Collector Specification

## Purpose

The collector is a local CLI worker that listens to TikTok LIVE comments and writes valid phone leads to Supabase.

## Command

```bash
cd apps/collector
pnpm start -- --username <tiktok_username> --session <live_session_id>
```

Mock mode:

```bash
pnpm start -- --session <live_session_id> --mock
```

## Required environment

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DEFAULT_COUNTRY=TN
LOG_LEVEL=info
```

## CLI arguments

```txt
--username   TikTok unique ID without @
--session    Supabase live_sessions.id
--mock       Use fake comments instead of TikTok
```

## Events

On TikTok comment event:

1. Read comment text, TikTok username, user ID if available, timestamp.
2. Extract phone.
3. Skip if no valid phone.
4. Hash normalized phone.
5. Upsert lead.
6. Append comment.
7. Log result.

## Reconnect

If connection fails: log error, wait 3 seconds, retry, increase delay up to 30 seconds, and do not crash forever unless config is invalid.

## Mock comments

```txt
"98421295"
"robe noire taille M 98421295"
"+216 98 421 295 rouge L"
"prix svp"
"21698421295 confirm"
```

Expected: one lead for +21698421295, comment_count increases, comments list stores all phone comments, no lead for "prix svp".
