-- Imparo — izləmə (follow) sistemi: izləyici/izlənilən sayı. Qarşılıqlı izləmə = dost.
-- Supabase SQL Editor-da işə salınır.

create table if not exists follows (
  follower uuid not null references profiles(id) on delete cascade,
  following uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, following),
  check (follower <> following)
);
alter table follows enable row level security;
drop policy if exists "public read follows" on follows;
create policy "public read follows" on follows for select using (true);
drop policy if exists "own follow write" on follows;
create policy "own follow write" on follows for all
  using (auth.uid() = follower) with check (auth.uid() = follower);
create index if not exists follows_following_idx on follows(following);

-- İzlə: me → target. Qarşılıqlıdırsa friendship yarat (friend streak üçün).
create or replace function follow_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or p_target is null or p_target = me then return; end if;
  insert into follows(follower, following) values (me, p_target) on conflict do nothing;
  if exists (select 1 from follows where follower = p_target and following = me) then
    insert into friendships(a, b) values (least(me, p_target), greatest(me, p_target))
    on conflict do nothing;
  end if;
end; $$;
grant execute on function follow_user(uuid) to authenticated;

create or replace function unfollow_user(p_target uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return; end if;
  delete from follows where follower = me and following = p_target;
  delete from friendships where a = least(me, p_target) and b = greatest(me, p_target);
end; $$;
grant execute on function unfollow_user(uuid) to authenticated;

-- get_public_profile: + izləyici/izlənilən sayı + am_following.
drop function if exists get_public_profile(text);
create or replace function get_public_profile(p_key text)
returns table(
  id uuid, name text, username text, avatar jsonb, created_at timestamptz,
  total_xp int, streak_days int, tier int,
  followers int, following int, am_following boolean
)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.username, p.avatar, p.created_at,
    coalesce(s.total_xp, 0)::int, coalesce(s.streak_days, 0)::int, coalesce(l.tier, 0)::int,
    (select count(*) from follows f where f.following = p.id)::int,
    (select count(*) from follows f where f.follower = p.id)::int,
    exists (select 1 from follows f where f.follower = auth.uid() and f.following = p.id)
  from profiles p
  left join user_stats s on s.user_id = p.id
  left join league l on l.user_id = p.id
  where lower(p.username) = lower(p_key) or p.id::text = lower(p_key)
  limit 1;
$$;
grant execute on function get_public_profile(text) to authenticated, anon;
