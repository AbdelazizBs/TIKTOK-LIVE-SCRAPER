# TikTok Live Sales Leads App - Agent-Ready Build Plan

## Goal

Build a new internal app similar in business idea to SHOPA.OVH:

- Seller starts a TikTok LIVE.
- Clients comment their Tunisian phone number and maybe product details, size, color, or text.
- The app captures only comments containing valid Tunisian phone numbers.
- The dashboard deduplicates by phone number.
- If the same phone comments many times, the app keeps one lead and stores all comment contents.
- Operators manually call from their own phones, then update the lead status.
- Phone numbers are deleted automatically after 7 days.
- UI languages: English, Arabic, French.
- MVP can run with the dashboard deployed/free while the TikTok collector runs locally.

## Biggest technical constraint

There is no stable official public TikTok Developer API for real-time LIVE comments. For the MVP, use an unofficial connector locally. Keep the collector isolated so it can be replaced later by an approved provider or another social media collector.

## Tonight MVP scope

Build only:

1. Login
2. Admin-created users
3. Live session creation
4. Local TikTok collector
5. Phone extraction for Tunisia only
6. Deduplication by phone per live session
7. Lead table
8. All comments for each phone
9. Manual call tracking
10. Status filters
11. CSV export
12. 7-day phone retention cleanup

Do not build inventory, delivery integration, online payment, AI classification, or TikTok Shop integration tonight.

## Recommended folder structure

```txt
tiktok-live-sales/
  apps/
    web/
      app/
      components/
      lib/
      messages/
    collector/
      src/
  packages/
    shared/
      src/
  supabase/
    migrations/
  docs/
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  turbo.json
```
