# Security and Privacy

## Data minimization

Collect only comments that contain valid phone numbers. Do not store all live comments.

## Live notice

The seller should say and pin something like:

```txt
To order, write your phone number in the comments only if you agree that our team contacts you to confirm your order. We use your number only for order confirmation and delete it after 7 days.
```

Arabic/Tunisian version:

```txt
باش تطلب، اكتب رقم هاتفك في التعليقات كانك موافق نتصلو بيك لتأكيد الطلبية. نستعملو الرقم كان للتأكيد ويتنحى بعد 7 أيام.
```

French version:

```txt
Pour commander, écrivez votre numéro seulement si vous acceptez que notre équipe vous contacte pour confirmer la commande. Le numéro est utilisé uniquement pour la confirmation et supprimé après 7 jours.
```

## Secrets

Never expose `SUPABASE_SERVICE_ROLE_KEY`. Do not commit `.env` files. Commit only `.env.example`.

## Access control

Roles: admin, manager, operator.

## Retention

Phone numbers must be deleted/anonymized after 7 days.

## Audit fields

Keep: created_at, updated_at, last_called_at, last_called_by, call_attempts.

## Production hardening later

- encrypt phone_e164
- keep phone_hash for dedupe
- add stricter RLS policies
- add admin activity logs
- add rate limits to API routes
- add backup policy
- add consent wording to live script
