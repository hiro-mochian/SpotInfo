-- Run against the migrated project. All fixtures roll back, including allowlist entries.
begin;
insert into auth.users(id,email,aud,role,created_at,updated_at) values
('10000000-0000-0000-0000-000000000001','member1@auth-test.invalid','authenticated','authenticated',now(),now()),
('10000000-0000-0000-0000-000000000002','member2@auth-test.invalid','authenticated','authenticated',now(),now()),
('10000000-0000-0000-0000-000000000003','staff@auth-test.invalid','authenticated','authenticated',now(),now()),
('10000000-0000-0000-0000-000000000004','outsider@auth-test.invalid','authenticated','authenticated',now(),now()),
('10000000-0000-0000-0000-000000000005','linked@auth-test.invalid','authenticated','authenticated',now(),now());
insert into auth.sessions(id,user_id,created_at,updated_at,aal) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',now(),now(),'aal1'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002',now(),now(),'aal1'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003',now(),now(),'aal1'),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004',now(),now(),'aal1'),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005',now(),now(),'aal1'),
('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000005',now(),now(),'aal1'),
('20000000-0000-0000-0000-000000000007','10000000-0000-0000-0000-000000000001',now(),now(),'aal1');
insert into app_private.verified_logins(session_id,user_id,provider,provider_subject,expires_at) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','google','google-1',now()+interval '1 hour'),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','google','google-2',now()+interval '1 hour'),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','github','90000001',now()+interval '1 hour'),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000004','github','90000002',now()+interval '1 hour'),
('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000005','google','google-linked',now()+interval '1 hour'),
('20000000-0000-0000-0000-000000000006','10000000-0000-0000-0000-000000000005','github','90000003',now()+interval '1 hour');
insert into app_private.staff_allowlist(github_user_id,role) values('90000001','owner'),('90000003','admin');
insert into public.spots(id,name,area,category,note,lat,lng,owner_id) values(-99991,'test spot','test area','test','test note',35,139,'10000000-0000-0000-0000-000000000001');
create function pg_temp.denied(q text) returns boolean language plpgsql as $$begin execute q;return false;exception when insufficient_privilege then return true;end;$$;

set local role anon;
do $$begin
 assert public.count_spots()>=1;
 assert pg_temp.denied($q$select public.create_spot('a','b','c','d',35,139)$q$),'anonymous create';
 assert pg_temp.denied($q$select public.my_spots()$q$),'anonymous mine';
 assert pg_temp.denied($q$select public.admin_summary()$q$),'anonymous admin';
 assert pg_temp.denied($q$select * from public.spots$q$),'direct table';
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","session_id":"20000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='member';
 assert (public.session_access()->>'canPost')::boolean;
 assert not (public.session_access()->>'canAdmin')::boolean;
 assert (select count(*) from public.my_spots())=1;
 assert public.update_spot(-99991,'updated','area','category','note');
 assert public.create_spot('new','area','category','note',35,139)>0;
 assert pg_temp.denied($q$select public.admin_summary()$q$),'google admin';
 assert pg_temp.denied($q$select public.bind_verified_login('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','github','90000001')$q$),'self attestation';
 assert pg_temp.denied($q$insert into app_private.staff_allowlist(github_user_id,role) values('99','owner')$q$),'self role grant';
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000002","session_id":"20000000-0000-0000-0000-000000000002","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert pg_temp.denied($q$select public.update_spot(-99991,'x','a','b','c')$q$),'other user update';
 assert pg_temp.denied($q$select public.delete_spot(-99991)$q$),'other user delete';
 assert (select count(*) from public.my_spots())=0;
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000003","session_id":"20000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='owner';
 assert public.admin_summary()->>'role'='owner';
 assert not (public.session_access()->>'canPost')::boolean;
 assert pg_temp.denied($q$select public.create_spot('a','b','c','d',35,139)$q$),'github cannot post';
 assert pg_temp.denied($q$select public.my_spots()$q$),'github cannot use user route';
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000004","session_id":"20000000-0000-0000-0000-000000000004","role":"authenticated","user_metadata":{"role":"owner"}}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='denied';
 assert pg_temp.denied($q$select public.admin_summary()$q$),'unapproved Github';
 assert pg_temp.denied($q$select public.create_spot('a','b','c','d',35,139)$q$),'unapproved Github posting';
end;$$;
reset role;
-- Same Supabase user, two different upstream-authenticated sessions.
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000005","session_id":"20000000-0000-0000-0000-000000000005","role":"authenticated","app_metadata":{"provider":"github"}}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='member';
 assert pg_temp.denied($q$select public.admin_summary()$q$),'linked google cannot administer';
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000005","session_id":"20000000-0000-0000-0000-000000000006","role":"authenticated","app_metadata":{"provider":"google"}}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='admin';
 assert public.admin_summary()->>'role'='admin';
end;$$;
reset role;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000001","session_id":"20000000-0000-0000-0000-000000000007","role":"authenticated","app_metadata":{"provider":"google"},"user_metadata":{"role":"owner"}}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='none';
 assert pg_temp.denied($q$select public.create_spot('a','b','c','d',35,139)$q$),'unverified or password session';
 assert pg_temp.denied($q$select public.admin_summary()$q$),'forged metadata';
end;$$;
reset role;
update app_private.verified_logins set expires_at=now()-interval '1 minute' where session_id='20000000-0000-0000-0000-000000000003';
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000003","session_id":"20000000-0000-0000-0000-000000000003","role":"authenticated"}',true);
set local role authenticated;
do $$begin
 assert public.session_access()->>'role'='none';
 assert pg_temp.denied($q$select public.admin_summary()$q$),'expired proof';
end;$$;
reset role;
select 'provider permissions passed; all fixtures will roll back' as result;
rollback;
