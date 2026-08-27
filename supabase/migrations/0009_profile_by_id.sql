-- Imparo — public profili username VƏ YA user_id ilə aç (hər kəs kliklənən olsun);
-- dostu id ilə əlavə et (username olmayanlar da). Supabase SQL Editor-da işə salınır.

-- get_public_profile: id qaytarır, username və ya id ilə tapır.
drop function if exists get_public_profile(text);
create or replace function get_public_profile(p_key text)
returns table(
  id uuid, name text, username text, avatar jsonb, created_at timestamptz,
  total_xp int, streak_days int, tier int
)
language sql security definer set search_path = public as $$
  select p.id, p.name, p.username, p.avatar, p.created_at,
    coalesce(s.total_xp, 0)::int, coalesce(s.streak_days, 0)::int, coalesce(l.tier, 0)::int
  from profiles p
  left join user_stats s on s.user_id = p.id
  left join league l on l.user_id = p.id
  where lower(p.username) = lower(p_key) or p.id::text = lower(p_key)
  limit 1;
$$;
grant execute on function get_public_profile(text) to authenticated, anon;

-- add_friend: user_id ilə (username tələb etmir).
drop function if exists add_friend(text);
create or replace function add_friend(p_friend uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null or p_friend is null or p_friend = me then return; end if;
  insert into friendships(a, b) values (least(me, p_friend), greatest(me, p_friend))
  on conflict do nothing;
end; $$;
grant execute on function add_friend(uuid) to authenticated;
