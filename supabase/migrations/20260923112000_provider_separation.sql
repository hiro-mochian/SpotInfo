begin;
create schema if not exists app_private;
revoke all on schema app_private from public,anon,authenticated;
create table if not exists app_private.verified_logins (
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check(provider in ('google','github')),
 provider_subject text not null,
 verified_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create table if not exists app_private.staff_allowlist (
 github_user_id text primary key check(github_user_id ~ '^[0-9]+$'),
 role text not null check(role in ('owner','admin')),
 enabled boolean not null default true,
 created_at timestamptz not null default now()
);
alter table app_private.verified_logins enable row level security;
alter table app_private.staff_allowlist enable row level security;
revoke all on all tables in schema app_private from public,anon,authenticated;

-- Called only by the server after validating the upstream provider token.
create or replace function public.bind_verified_login(p_session_id uuid,p_user_id uuid,p_provider text,p_subject text)
returns boolean language plpgsql security definer set search_path='' as $$
begin
 if p_provider not in ('google','github') or not exists(
  select 1 from auth.sessions s where s.id=p_session_id and s.user_id=p_user_id and (s.not_after is null or s.not_after>now()) limit 1
 ) or not exists(
  select 1 from auth.identities i where i.user_id=p_user_id and i.provider=p_provider and i.provider_id=p_subject limit 1
 ) then raise exception 'invalid_provider_binding' using errcode='42501'; end if;
 insert into app_private.verified_logins(session_id,user_id,provider,provider_subject,expires_at)
 values(p_session_id,p_user_id,p_provider,p_subject,now()+interval '1 hour')
 on conflict(session_id) do update set user_id=excluded.user_id,provider=excluded.provider,provider_subject=excluded.provider_subject,verified_at=now(),expires_at=excluded.expires_at;
 return true;
end;$$;
revoke all on function public.bind_verified_login(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.bind_verified_login(uuid,uuid,text,text) to service_role;

create or replace function app_private.access_context()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare v app_private.verified_logins%rowtype; staff_role text;
begin
 select vl.* into v from app_private.verified_logins vl join auth.sessions s on s.id=vl.session_id and s.user_id=vl.user_id
 where vl.session_id::text=auth.jwt()->>'session_id' and vl.user_id=auth.uid() and vl.expires_at>now() and (s.not_after is null or s.not_after>now()) limit 1;
 if not found then return jsonb_build_object('provider',null,'role','none','canPost',false,'canAdmin',false); end if;
 if v.provider='google' then return jsonb_build_object('provider','google','role','member','canPost',true,'canAdmin',false,'expiresAt',v.expires_at); end if;
 select a.role into staff_role from app_private.staff_allowlist a where a.github_user_id=v.provider_subject and a.enabled limit 1;
 return jsonb_build_object('provider','github','role',coalesce(staff_role,'denied'),'canPost',false,'canAdmin',staff_role is not null,'expiresAt',v.expires_at);
end;$$;
revoke all on function app_private.access_context() from public,anon,authenticated;

create or replace function public.session_access()
returns jsonb language sql stable security definer set search_path='' as $$ select app_private.access_context(); $$;
revoke all on function public.session_access() from public,anon,authenticated;
grant execute on function public.session_access() to authenticated;

create or replace function public.auth_policy()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('member_provider','google','staff_provider','github','anonymous_write',false,'owner_configured',exists(select 1 from app_private.staff_allowlist where role='owner' and enabled limit 1));
$$;
revoke all on function public.auth_policy() from public,anon,authenticated;
grant execute on function public.auth_policy() to anon,authenticated;

create or replace function app_private.require_google_member()
returns void language plpgsql stable security definer set search_path='' as $$
begin
 if (app_private.access_context()->>'canPost')::boolean is not true then raise exception 'google_sign_in_required' using errcode='42501'; end if;
end;$$;
revoke all on function app_private.require_google_member() from public,anon,authenticated;

create or replace function public.create_spot(p_name text,p_area text,p_category text,p_note text,p_lat numeric,p_lng numeric)
returns bigint language plpgsql security definer set search_path='' as $$
declare new_id bigint;
begin
 perform app_private.require_google_member();
 insert into public.spots(name,area,category,note,lat,lng,owner_id) values(btrim(p_name),btrim(p_area),btrim(p_category),btrim(p_note),p_lat,p_lng,auth.uid()) returning id into new_id;
 return new_id;
end;$$;
revoke all on function public.create_spot(text,text,text,text,numeric,numeric) from public,anon,authenticated;
grant execute on function public.create_spot(text,text,text,text,numeric,numeric) to authenticated;

create or replace function public.my_spots()
returns table(id bigint,name text,area text,category text,note text,lat numeric,lng numeric,created_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
 perform app_private.require_google_member();
 return query select s.id,s.name,s.area,s.category,s.note,s.lat,s.lng,s.created_at from public.spots s where s.owner_id=auth.uid() order by s.created_at desc,s.id;
end;$$;

create or replace function public.update_spot(p_id bigint,p_name text,p_area text,p_category text,p_note text)
returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 perform app_private.require_google_member();
 update public.spots set name=btrim(p_name),area=btrim(p_area),category=btrim(p_category),note=btrim(p_note) where id=p_id and owner_id=auth.uid();
 get diagnostics affected=row_count;
 if affected=0 then raise exception 'not_found_or_not_owned' using errcode='42501';end if;
 return true;
end;$$;

create or replace function public.delete_spot(p_id bigint)
returns boolean language plpgsql security definer set search_path='' as $$
declare affected integer;
begin
 perform app_private.require_google_member();
 delete from public.spots where id=p_id and owner_id=auth.uid();
 get diagnostics affected=row_count;
 if affected=0 then raise exception 'not_found_or_not_owned' using errcode='42501';end if;
 return true;
end;$$;

create or replace function public.admin_summary()
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare access jsonb;
begin
 access:=app_private.access_context();
 if (access->>'canAdmin')::boolean is not true then raise exception 'approved_github_staff_required' using errcode='42501';end if;
 return jsonb_build_object('role',access->>'role','spot_count',(select count(*) from public.spots),'unassigned_legacy_count',(select count(*) from public.spots where legacy_owner_id is not null and owner_id is null));
end;$$;
revoke all on function public.admin_summary() from public,anon,authenticated;
grant execute on function public.admin_summary() to authenticated;
comment on function public.create_spot(text,text,text,text,numeric,numeric) is 'Google-verified members only. No anonymous writes. Ownership inferred server-side.';
commit;
