# UI and UX Specification

## Screenshot review

The reference screenshot shows:

- Brand logo: SHOPA.OVH
- Arabic landing page copy
- Login button top-right
- Social icons
- Blue/cyan gradient button
- Soft background
- Live preview card with collected numbers and statuses
- Feature cards
- Footer
- Arabic/French mixture

Use this style direction, but build an internal dashboard first.

## Public landing page

Route: `/`

Content:

- Logo
- Language selector
- Login button
- Hero headline
- Short explanation
- CTA button
- Live preview card
- Feature cards

Example Arabic headline:

```txt
حوّل تعليقات اللايف إلى قائمة أرقام منظمة
```

Example French subtitle:

```txt
Collecte les numéros depuis les commentaires TikTok Live, groupe les doublons, puis confirme les commandes manuellement.
```

## Dashboard layout

Routes:

```txt
/login
/dashboard
/live-sessions
/live-sessions/[id]
/admin/users
/settings
```

## Live session detail UI

Top stats:

```txt
Collected numbers
New
Called
Confirmed
No answer
New comments after call
```

Table:

```txt
Phone
Latest content
Comments
Status
Last comment
Last call
Operator
Actions
```

## Important filter

Add a visible filter: `New comment after call`.

## Mobile behavior

On phone screen, show lead cards instead of a wide table. Keep action buttons large. Copy phone must be one tap.

## Languages

Use keys, not hardcoded labels. Arabic must use RTL:

```tsx
<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
```
