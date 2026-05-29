# Product Requirements

## Product name

Working name: **Live Leads**

## Target user

A clothing brand seller doing TikTok LIVE sales in Tunisia.

## Countries

MVP supports **Tunisia only**.

Accepted phone formats:

- `98421295`
- `98 421 295`
- `98-421-295`
- `21698421295`
- `216 98 421 295`
- `+21698421295`
- `+216 98 421 295`

All valid numbers must be normalized to E.164:

```txt
+21698421295
```

## Main workflow

1. Admin logs in.
2. Admin creates staff/operator accounts.
3. Admin creates a live session with TikTok username.
4. App shows a local collector command.
5. Operator starts the collector locally.
6. Collector listens to TikTok LIVE comments.
7. When a valid phone number appears:
   - normalize the phone
   - remove the phone from the comment text
   - create or update one lead for that phone
   - append the clean comment content to the comments list
8. Operator manually calls from their own phone.
9. Operator updates status after the call.
10. Dashboard can filter:
   - New
   - Called
   - Confirmed
   - No answer
   - Cancelled
   - Wrong number
   - New comment after call
11. Export CSV.
12. After 7 days, numbers are automatically deleted or anonymized.

## Lead status

Use these statuses:

```txt
new
called
confirmed
no_answer
cancelled
wrong_number
duplicate
archived
```

## Important status behavior

If a lead is already `called`, `confirmed`, `no_answer`, or `cancelled` and the same phone comments again:

- do not create a new lead
- increment comment count
- append the new clean comment content
- update `last_comment_at`
- set `has_new_comment_after_call = true` when `last_comment_at > last_called_at`

This gives the team a filter for people who were already called but commented again.

## Lead table columns

MVP columns:

```txt
Phone
Status
Clean latest comment
Comment count
Last comment time
Last called time
Has new comment after call
Operator
Actions
```

Row actions:

```txt
Copy phone
Open comments drawer
Mark called
Mark confirmed
Mark no answer
Mark cancelled
Mark wrong number
Add note
```

No in-app calling is required.

## Admin features

Admin can:

- create users
- disable users
- create live sessions
- stop live sessions
- view all leads
- export CSV
- change retention settings

## Operator features

Operator can:

- view live session leads
- filter leads
- copy phone number
- manually call from their phone
- mark call result
- add note
- export visible leads if allowed

## Languages

Dashboard must support:

- English
- Arabic
- French

MVP can use static dictionaries:

```txt
apps/web/messages/en.json
apps/web/messages/ar.json
apps/web/messages/fr.json
```

Arabic pages should support RTL.
