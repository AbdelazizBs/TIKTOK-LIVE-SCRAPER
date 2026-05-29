# Research Notes

## TikTok official API

TikTok official developer documentation lists API v2 capabilities such as OAuth 2.0, user info, list videos, and query videos. It does not provide a stable public endpoint for real-time LIVE comments in the general developer API.

TikTok Research API has a video comment endpoint, but it is for research-style access and queries comments by video_id or comment_id. It is not a live chat ingestion API.

## Unofficial LIVE libraries

The Node package `tiktok-live-connector` receives realtime TikTok LIVE events such as comments by connecting to TikTok internal Webcast services. This is useful for an MVP but should be isolated because it is unofficial.

The Python `TikTokLive` package is also unofficial and reverse-engineered. We are choosing Node for this project to keep TypeScript across the stack.

## Deployment

Dashboard can be tested on Vercel. Long-running TikTok collectors should not run in Vercel serverless functions. Run the collector locally for MVP or later move it to a worker/VPS.

## Architecture decision

Dashboard deployed/free + Supabase hosted DB + local collector is the fastest safe MVP path.
