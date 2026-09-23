begin;
insert into auth.users(id,email,aud,role,created_at,updated_at) values('30000000-0000-0000-0000-000000000001','binding-test@auth-test.invalid','authenticated','authenticated',now(),now());
insert into auth.identities(id,provider_id,user_id,identity_data,provider,created_at,updated_at) values('30000000-0000-0000-0000-000000000002','google-binding-test','30000000-0000-0000-0000-000000000001','{"sub":"google-binding-test","email":"binding-test@auth-test.invalid","email_verified":true}','google',now(),now());
insert into auth.sessions(id,user_id,created_at,updated_at,aal) values('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001',now(),now(),'aal1');
create function pg_temp.binding_denied(p_user uuid,p_provider text,p_subject text) returns boolean language plpgsql as $$begin perform public.bind_verified_login('30000000-0000-0000-0000-000000000003',p_user,p_provider,p_subject);return false;exception when insufficient_privilege then return true;end;$$;
do $$begin
 assert public.bind_verified_login('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','google','google-binding-test');
 assert pg_temp.binding_denied('30000000-0000-0000-0000-000000000001','github','google-binding-test');
 assert pg_temp.binding_denied('30000000-0000-0000-0000-000000000001','google','different-google-subject');
 assert pg_temp.binding_denied('30000000-0000-0000-0000-000000000099','google','google-binding-test');
end;$$;
update auth.sessions set not_after=now()-interval '1 minute' where id='30000000-0000-0000-0000-000000000003';
do $$begin
 assert pg_temp.binding_denied('30000000-0000-0000-0000-000000000001','google','google-binding-test');
end;$$;
select 'provider binding tests passed; all fixtures roll back' as result;
rollback;
