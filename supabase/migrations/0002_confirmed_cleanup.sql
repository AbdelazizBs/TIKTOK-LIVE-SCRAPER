create index if not exists idx_leads_session_status_updated
  on public.leads(live_session_id, status, updated_at desc);

create index if not exists idx_leads_session_last_comment
  on public.leads(live_session_id, last_comment_at desc);

create or replace function public.cleanup_confirmed_leads(force_delete boolean default false)
returns integer as $$
declare
  deleted_count integer;
begin
  with deleted as (
    delete from public.leads l
    using public.live_sessions s
    where l.live_session_id = s.id
      and l.status = 'confirmed'
      and (
        force_delete
        or
        s.status = 'ended'
        or l.updated_at < now() - interval '30 seconds'
      )
    returning l.id
  )
  select count(*) into deleted_count
  from deleted;

  return deleted_count;
end;
$$ language plpgsql security definer;
