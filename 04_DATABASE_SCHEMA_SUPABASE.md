# Supabase Database Schema

## Migration file

Create:

```txt
supabase/migrations/0001_initial_schema.sql
```

## SQL

```sql
create extension if not exists pgcrypto;

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_country text not null default 'TN',
  retention_days integer not null default 7,
  created_at timestamptz not null default now()
);

create type app_role as enum ('admin', 'manager', 'operator');

create table profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid not null unique,
  username text not null,
  full_name text,
  role app_role not null default 'operator',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(org_id, username)
);

create type live_status as enum ('draft', 'running', 'ended', 'error');

create table live_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  tiktok_username text not null,
  title text,
  status live_status not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create type lead_status as enum (
  'new',
  'called',
  'confirmed',
  'no_answer',
  'cancelled',
  'wrong_number',
  'duplicate',
  'archived'
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  live_session_id uuid not null references live_sessions(id) on delete cascade,
  phone_e164 text not null,
  phone_hash text not null,
  display_phone text not null,
  first_comment text,
  latest_comment text,
  latest_clean_content text,
  comment_count integer not null default 1,
  tiktok_username text,
  tiktok_user_id text,
  status lead_status not null default 'new',
  assigned_to uuid references profiles(id),
  last_called_by uuid references profiles(id),
  last_called_at timestamptz,
  last_comment_at timestamptz not null default now(),
  has_new_comment_after_call boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(live_session_id, phone_hash)
);

create table lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  original_comment text not null,
  clean_content text,
  phone_e164 text not null,
  tiktok_username text,
  tiktok_user_id text,
  comment_timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table call_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  operator_id uuid references profiles(id),
  result lead_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table product_keywords (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  keyword text not null,
  product_name text not null,
  sku text,
  price numeric(10, 3),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_profiles_org on profiles(org_id);
create index idx_live_sessions_org_status on live_sessions(org_id, status);
create index idx_leads_org_created on leads(org_id, created_at desc);
create index idx_leads_session_status on leads(live_session_id, status);
create index idx_leads_session_new_after_call on leads(live_session_id, has_new_comment_after_call);
create index idx_leads_phone_hash on leads(phone_hash);
create index idx_lead_comments_lead_created on lead_comments(lead_id, created_at desc);
create index idx_call_attempts_lead_created on call_attempts(lead_id, created_at desc);
```

## Updated-at trigger

```sql
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_leads_updated_at
before update on leads
for each row execute function set_updated_at();
```

## Retention cleanup

For MVP, create a function that anonymizes old phone data.

```sql
create or replace function anonymize_old_phone_numbers()
returns void as $$
begin
  update leads
  set
    phone_e164 = '[deleted]',
    display_phone = '[deleted]',
    notes = coalesce(notes, '') || E'
[system] Phone number deleted by 7-day retention policy.',
    updated_at = now()
  where created_at < now() - interval '7 days'
    and phone_e164 <> '[deleted]';

  update lead_comments
  set phone_e164 = '[deleted]'
  where created_at < now() - interval '7 days'
    and phone_e164 <> '[deleted]';
end;
$$ language plpgsql;
```

Enable RLS for all tables before production. The collector uses the service role key and bypasses RLS.
