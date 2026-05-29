# AGENTS.md

## Project

Internal TikTok LIVE sales lead dashboard for a Tunisian clothing seller.

## Non-negotiable rules

1. Do not expose secrets to frontend.
2. Do not store comments without valid Tunisian phone numbers.
3. Deduplicate by live_session_id + phone_hash.
4. Store every valid comment for the same phone in lead_comments.
5. Split phone from comment content.
6. Manual calls only. No in-app calling required.
7. Track called leads and new comments after call.
8. Support English, Arabic, French.
9. Delete/anonymize phone numbers after 7 days.
10. Keep TikTok collector isolated from dashboard.

## Preferred style

- TypeScript
- Simple, readable code
- Small components
- zod validation
- Server-only service role usage
- Mobile-friendly UI
- RTL support for Arabic

## Done means

- pnpm typecheck passes
- pnpm lint passes
- app runs locally
- no service key in browser bundle
- README updated
