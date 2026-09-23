-- Run via: supabase db query --linked --project-ref <ref> --file supabase/tests/spot_permissions.sql
-- Fixtures and edits are ALWAYS rolled back. Sequence gaps may remain, by design.
begin;
insert into auth.users(id, aud, role, email) values
 ('00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated', 'spot-test-a@example.invalid'),
 ('00000000-0000-4000-8000-0000000000b2', 'authenticated', 'authenticated', 'spot-test-b@example.invalid');
insert into public.spots(id,name,area,category,note,lat,lng,owner_id) values
 (-901, '__test_A', 'test', 'test', 'test', 35, 139, '00000000-0000-4000-8000-0000000000a1'),
 (-902, '__test_B', 'test', 'test', 'test', 35, 139, '00000000-0000-4000-8000-0000000000b2'),
 (-903, '__test_guest', 'test', 'test', 'test', 35, 139, null);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$
declare denied boolean; invalid boolean; new_id bigint; entry jsonb;
begin
  assert public.count_spots() >= 3, 'anonymous public count failed';
  select to_jsonb(s) into entry from public.list_spots(1,0) s limit 1;
  assert entry is not null, 'anonymous public read failed';
  assert not (entry ? 'owner_id'), 'owner UUID leaked';
  assert not (entry ? 'legacy_owner_id'), 'legacy owner leaked';
  new_id := public.create_spot('__test_anon_create', 'test', 'test', 'test', 35, 139);
  assert new_id > 0, 'guest create failed';
  denied := false;
  begin perform public.my_spots(); exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous my_spots allowed';
  denied := false;
  begin perform public.update_spot(-903,'x','x','x','x'); exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous update allowed';
  denied := false;
  begin perform public.delete_spot(-903); exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous delete allowed';
  denied := false;
  begin perform id from public.spots limit 1; exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous direct table read allowed';
  denied := false;
  begin insert into public.spots(name,area,category,note,lat,lng,owner_id) values ('x','x','x','x',35,139,'00000000-0000-4000-8000-0000000000a1'); exception when insufficient_privilege then denied := true; end;
  assert denied, 'anonymous owner spoof via table allowed';
  invalid := false;
  begin perform public.create_spot('x','x','x','x',91,139); exception when check_violation then invalid := true; end;
  assert invalid, 'out-of-range latitude allowed';
  invalid := false;
  begin perform public.create_spot('x','x','x','x',35,181); exception when check_violation then invalid := true; end;
  assert invalid, 'out-of-range longitude allowed';
  invalid := false;
  begin perform public.create_spot('   ','x','x','x',35,139); exception when check_violation then invalid := true; end;
  assert invalid, 'blank name allowed';
  invalid := false;
  begin perform public.create_spot('x','x','x',repeat('x',2001),35,139); exception when check_violation then invalid := true; end;
  assert invalid, 'oversized note allowed';
end;
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$
declare denied boolean; owned_count integer; new_id bigint;
begin
  select count(*) into owned_count from public.my_spots();
  assert owned_count = 1, 'my_spots includes foreign or guest rows';
  assert public.update_spot(-901,'__test_A_edited','test','test','updated'), 'owner update failed';
  denied := false;
  begin perform public.update_spot(-902,'x','x','x','x'); exception when insufficient_privilege then denied := true; end;
  assert denied, 'foreign row update allowed';
  denied := false;
  begin perform public.delete_spot(-902); exception when insufficient_privilege then denied := true; end;
  assert denied, 'foreign row delete allowed';
  denied := false;
  begin perform public.update_spot(-903,'x','x','x','x'); exception when insufficient_privilege then denied := true; end;
  assert denied, 'guest row claim allowed';
  denied := false;
  begin update public.spots set owner_id = auth.uid() where id = -902; exception when insufficient_privilege then denied := true; end;
  assert denied, 'direct owner reassignment allowed';
  new_id := public.create_spot('__test_authed_create','test','test','test',35,139);
  assert new_id > 0, 'authenticated create failed';
  assert public.delete_spot(-901), 'owner delete failed';
end;
$$;
reset role;

do $$
begin
  assert (select owner_id is null from public.spots where name='__test_anon_create' limit 1), 'guest owner is not NULL';
  assert (select owner_id='00000000-0000-4000-8000-0000000000a1'::uuid from public.spots where name='__test_authed_create' limit 1), 'authenticated owner is not auth.uid';
  assert (select name='__test_B' from public.spots where id=-902 limit 1), 'foreign row was modified';
  assert not exists(select 1 from public.spots where id=-901 limit 1), 'deleted owner row remains';
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$
begin
  assert (select count(*)=1 from public.my_spots()), 'user B sees another user rows';
  assert public.update_spot(-902,'__test_B_edited','test','test','updated'), 'user B cannot edit own row';
end;
$$;
reset role;
rollback;
select 'PASS: 28 assertions; fixtures rolled back; guest/owner/foreign access boundaries verified' as result limit 1;
