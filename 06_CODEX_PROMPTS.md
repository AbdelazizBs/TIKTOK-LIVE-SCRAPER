# Codex Prompts

## Master instruction for every Codex task

```txt
You are building an internal TikTok LIVE sales lead dashboard for a Tunisian clothing seller.

Rules:
- TypeScript only.
- Keep code simple and production-clean.
- Do not expose secrets in frontend.
- Do not collect comments unless they contain a valid Tunisian phone number.
- Deduplicate by live_session_id + phone_hash.
- Store all comments for the same phone.
- Split phone from comment content.
- Manual call workflow only. No in-app calling required.
- Support English, Arabic, French.
- Phone numbers must be anonymized after 7 days.
- Do not add features outside the requested phase.
```

## Prompt 1 - Bootstrap

```txt
Create a pnpm monorepo with apps/web Next.js, apps/collector Node TypeScript CLI, and packages/shared TypeScript package. Add package scripts for dev, build, lint, typecheck. Add README and environment examples. Do not implement business logic yet.
```

## Prompt 2 - Phone extraction

```txt
Implement packages/shared phone extraction for Tunisia only.

Function:
extractTunisiaPhoneLead(input: string): {
  phoneE164: string;
  displayPhone: string;
  cleanContent: string;
  originalContent: string;
} | null

Accept direct 8-digit Tunisian numbers, 216 prefix, +216 prefix, spaces, dashes, dots, Arabic digits. Normalize to +216XXXXXXXX. Validate with libphonenumber-js. Return cleanContent with the phone removed. Add tests.
```

## Prompt 3 - Database migration

```txt
Create Supabase SQL migration for organizations, profiles, live_sessions, leads, lead_comments, call_attempts, product_keywords. Include enums, indexes, updated_at trigger, and retention anonymization function. Enable RLS but keep policies simple for MVP.
```

## Prompt 4 - Auth

```txt
Implement Supabase Auth login in apps/web. Use email/password. Create protected dashboard layout, logout, server and browser clients, and current profile loader.
```

## Prompt 5 - Admin users

```txt
Implement admin user management at /admin/users. Admin creates users with role admin/manager/operator. Use server route with SUPABASE_SERVICE_ROLE_KEY. Never expose service key.
```

## Prompt 6 - Live sessions

```txt
Implement live sessions list, create modal with TikTok username, session detail page, status, stats, and collector command.
```

## Prompt 7 - Collector

```txt
Build apps/collector CLI: pnpm start -- --username <tiktok_username> --session <live_session_id>. Use tiktok-live-connector. On each comment, extract phone, hash phone, upsert lead, append comment, increment comment_count, update new-comment-after-call flag. Add mock mode.
```

## Prompt 8 - Lead dashboard

```txt
Implement live session lead dashboard with polling every 2 seconds, filters, search, comments drawer, copy phone, status badges, and responsive layout.
```

## Prompt 9 - Manual call workflow

```txt
Add actions: Mark called, confirmed, no answer, cancelled, wrong number, add note. Mark called sets status called, last_called_by, last_called_at, and has_new_comment_after_call=false. Insert call_attempts row for each result.
```

## Prompt 10 - i18n UI

```txt
Add English, Arabic, French dictionaries and language switcher. Use RTL for Arabic. Match clean landing/dashboard style inspired by screenshot.
```

## Prompt 11 - Export

```txt
Add CSV export of current filtered leads with phone,status,latest_clean_content,comment_count,last_comment_at,last_called_at,operator,notes.
```

## Prompt 12 - Final hardening

```txt
Review for secrets exposure, TypeScript errors, failed imports, RLS issues, duplicate logic, phone parsing edge cases, UI responsiveness, README accuracy. Fix all issues.
```
