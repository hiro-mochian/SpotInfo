-- Public live snapshot retrieved 2026-09-23. Original owner IDs remain private and unmapped.
begin;
insert into public.spots(id,name,area,category,note,lat,lng,legacy_owner_id,created_at) values (1,'上野公園','東京 台東区','公園','都会の中の自然界隈','35.7148','139.7713',NULL,'2026-09-22T08:24:39.000Z') on conflict(id) do nothing;
insert into public.spots(id,name,area,category,note,lat,lng,legacy_owner_id,created_at) values (2,'錦糸公園','東京都 墨田区','公園','駅に近く、子どもが遊んでいて、休日はフリマも多い','35.6964','139.8153',NULL,'2026-09-22T08:24:39.000Z') on conflict(id) do nothing;
insert into public.spots(id,name,area,category,note,lat,lng,legacy_owner_id,created_at) values (3,'フォード博物館','US ミシガン州','博物館','素敵な博物館','42.3031','-83.2342',NULL,'2026-09-22T08:24:39.000Z') on conflict(id) do nothing;
insert into public.spots(id,name,area,category,note,lat,lng,legacy_owner_id,created_at) values (30001,'セーチェーニ温泉 Széchenyi Gyógyfürdő és Uszoda','中欧','温泉','水着を着て温泉に浸かってチェスを楽しむこともできる','35.6812','139.7671',1,'2026-09-22T13:35:56.000Z') on conflict(id) do nothing;
select setval('public.spots_id_seq', greatest(coalesce((select max(id) from public.spots), 1), 1), true);
commit;
