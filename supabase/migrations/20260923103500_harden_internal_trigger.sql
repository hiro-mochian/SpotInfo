-- Supabase's auto-RLS DDL event trigger must not be callable through the Data API.
-- Existing event-trigger execution remains with its owner.
begin;
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='rls_auto_enable'
      and p.pronargs=0 and p.prorettype='event_trigger'::regtype
    limit 1
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
commit;
