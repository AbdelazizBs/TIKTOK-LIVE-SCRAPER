alter table public.leads
  add column if not exists phone_is_potential_typo boolean not null default false,
  add column if not exists raw_phone_candidate text;

alter table public.lead_comments
  add column if not exists phone_is_potential_typo boolean not null default false,
  add column if not exists raw_phone_candidate text;
