create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  default_country text not null default 'TN',
  retention_days integer not null default 7 check (retention_days > 0),
  created_at timestamptz not null default now()
);

create type public.app_role as enum ('admin', 'manager', 'operator');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid not null unique,
  username text not null,
  full_name text,
  role public.app_role not null default 'operator',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (org_id, username)
);

create type public.live_status as enum ('draft', 'running', 'ended', 'error');

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  tiktok_username text not null,
  title text,
  status public.live_status not null default 'draft',
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create type public.lead_status as enum (
  'new',
  'called',
  'confirmed',
  'no_answer',
  'cancelled',
  'wrong_number',
  'duplicate',
  'archived'
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  phone_e164 text not null,
  phone_hash text not null,
  display_phone text not null,
  first_comment text,
  latest_comment text,
  latest_clean_content text,
  comment_count integer not null default 1 check (comment_count > 0),
  tiktok_username text,
  tiktok_user_id text,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles(id),
  last_called_by uuid references public.profiles(id),
  last_called_at timestamptz,
  last_comment_at timestamptz not null default now(),
  has_new_comment_after_call boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (live_session_id, phone_hash)
);

create table public.lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  original_comment text not null,
  clean_content text,
  phone_e164 text not null,
  tiktok_username text,
  tiktok_user_id text,
  comment_timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.call_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  operator_id uuid references public.profiles(id),
  result public.lead_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table public.product_keywords (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  keyword text not null,
  product_name text not null,
  sku text,
  price numeric(10, 3),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_profiles_org on public.profiles(org_id);
create index idx_live_sessions_org_status on public.live_sessions(org_id, status);
create index idx_leads_org_created on public.leads(org_id, created_at desc);
create index idx_leads_session_status on public.leads(live_session_id, status);
create index idx_leads_session_new_after_call
  on public.leads(live_session_id, has_new_comment_after_call);
create index idx_leads_phone_hash on public.leads(phone_hash);
create index idx_lead_comments_lead_created
  on public.lead_comments(lead_id, created_at desc);
create index idx_call_attempts_lead_created
  on public.call_attempts(lead_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create or replace function public.anonymize_old_phone_numbers()
returns void as $$
begin
  update public.leads
  set
    phone_e164 = '[deleted]',
    display_phone = '[deleted]',
    notes = concat_ws(
      E'\n',
      nullif(notes, ''),
      '[system] Phone number deleted by retention policy.'
    ),
    updated_at = now()
  where created_at < now() - interval '7 days'
    and phone_e164 <> '[deleted]';

  update public.lead_comments
  set phone_e164 = '[deleted]'
  where created_at < now() - interval '7 days'
    and phone_e164 <> '[deleted]';
end;
$$ language plpgsql;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.live_sessions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_comments enable row level security;
alter table public.call_attempts enable row level security;
alter table public.product_keywords enable row level security;

create policy "profiles can read own organization"
on public.profiles
for select
to authenticated
using (
  org_id in (
    select p.org_id
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.active = true
  )
);

create policy "members can read own organization"
on public.organizations
for select
to authenticated
using (
  id in (
    select p.org_id
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.active = true
  )
);

create policy "members can read own live sessions"
on public.live_sessions
for select
to authenticated
using (
  org_id in (
    select p.org_id
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.active = true
  )
);

create policy "members can read own leads"
on public.leads
for select
to authenticated
using (
  org_id in (
    select p.org_id
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.active = true
  )
);

create policy "members can read own lead comments"
on public.lead_comments
for select
to authenticated
using (
  exists (
    select 1
    from public.leads l
    join public.profiles p on p.org_id = l.org_id
    where l.id = lead_comments.lead_id
      and p.auth_user_id = auth.uid()
      and p.active = true
  )
);

create policy "members can read own call attempts"
on public.call_attempts
for select
to authenticated
using (
  exists (
    select 1
    from public.leads l
    join public.profiles p on p.org_id = l.org_id
    where l.id = call_attempts.lead_id
      and p.auth_user_id = auth.uid()
      and p.active = true
  )
);

create policy "members can read own product keywords"
on public.product_keywords
for select
to authenticated
using (
  org_id in (
    select p.org_id
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.active = true
  )
);
