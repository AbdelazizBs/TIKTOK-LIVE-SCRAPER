-- 1. Create this auth user manually first:
--    Supabase Dashboard -> Authentication -> Users -> Add user
--    Email: bensalemabdelaziz97@gmail.com
--
-- 2. Prepared auth user UUID:
--    923de556-62eb-4a02-bd90-b112e4fedb28
--
-- 3. Run this SQL in Supabase SQL Editor.

with inserted_org as (
  insert into public.organizations (name, default_country, retention_days)
  values ('Bs society', 'TN', 7)
  returning id
)
insert into public.profiles (
  org_id,
  auth_user_id,
  username,
  full_name,
  role,
  active
)
select
  inserted_org.id,
  '923de556-62eb-4a02-bd90-b112e4fedb28'::uuid,
  'abdelaziz',
  'Abdelaziz Bensalem',
  'admin',
  true
from inserted_org;

insert into public.live_sessions (
  org_id,
  tiktok_username,
  title,
  status,
  started_at,
  created_by
)
select
  p.org_id,
  'lella.khadija.fashion',
  'Lella Khadija Fashion live',
  'draft',
  null,
  p.id
from public.profiles p
where p.auth_user_id = '923de556-62eb-4a02-bd90-b112e4fedb28'::uuid;
