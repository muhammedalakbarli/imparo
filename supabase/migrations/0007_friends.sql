-- Imparo — dostlar + friend streak. Supabase SQL Editor-da işə salınır.

create table if not exists friendships (
  a uuid not null references profiles(id) on delete cascade,
  b uuid not null references profiles(id) on delete cascade,
  streak int not null default 0,
  streak_day date,
  created_at timestamptz not null default now(),
  primary key (a, b),
  check (a < b)
);

alter table friendships enable row level security;
drop policy if exists "read own friendships" on friendships;
create policy "read own friendships" on friendships
  for select using (auth.uid() = a or auth.uid() = b);
drop policy if exists "write own friendships" on friendships;
create policy "write own friendships" on friendships
  for all using (auth.uid() = a or auth.uid() = b)
  with check (auth.uid() = a or auth.uid() = b);

-- Dost əlavə et (username → id, kanonik cüt).
create or replace function add_friend(p_username text)
returns void language plpgsql security definer set search_path = public as $$
declare fid uuid; me uuid;
begin
  me := auth.uid();
  if me is null then return; end if;
  select id into fid from profiles where lower(username) = lower(p_username);
  if fid is null or fid = me then return; end if;
  insert into friendships(a, b) values (least(me, fid), greatest(me, fid))
  on conflict do nothing;
end; $$;
grant execute on function add_friend(text) to authenticated;

-- Mənim dostlarım (public məlumat + friend streak).
create or replace function get_friends()
returns table(
  friend_id uuid, name text, username text, avatar jsonb,
  total_xp int, streak_days int, friend_streak int
)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.username, p.avatar,
    coalesce(s.total_xp, 0)::int, coalesce(s.streak_days, 0)::int, f.streak::int
  from friendships f
  join profiles p on p.id = case when f.a = auth.uid() then f.b else f.a end
  left join user_stats s on s.user_id = p.id
  where auth.uid() in (f.a, f.b)
  order by f.streak desc, p.name;
$$;
grant execute on function get_friends() to authenticated;

-- Mən bu gün aktivəm: o biri dost da bu gün aktivdirsə friend streak-ı yenilə.
create or replace function touch_friend_streaks()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid; today date := (now() at time zone 'utc')::date;
begin
  me := auth.uid();
  if me is null then return; end if;
  update friendships f set
    streak = case when f.streak_day = today - 1 then f.streak + 1 else 1 end,
    streak_day = today
  from user_stats os
  where (f.a = me or f.b = me)
    and os.user_id = case when f.a = me then f.b else f.a end
    and os.last_active_date = today
    and (f.streak_day is distinct from today);
end; $$;
grant execute on function touch_friend_streaks() to authenticated;

-- Dostluğu sil.
create or replace function remove_friend(p_friend uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return; end if;
  delete from friendships
  where a = least(me, p_friend) and b = greatest(me, p_friend);
end; $$;
grant execute on function remove_friend(uuid) to authenticated;
