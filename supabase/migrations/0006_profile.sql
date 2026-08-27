-- Imparo — sosial profil: username + avatar + public profil funksiyası.
-- Supabase SQL Editor-da işə salınır.

alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists avatar jsonb;

-- İctimai profil (giriş tələb etmir) — yalnız açıq sahələr: ad, username, avatar,
-- üzvlük tarixi, ümumi XP, streak, liqa pilləsi. Email/şəxsi məlumat açılmır.
create or replace function get_public_profile(p_username text)
returns table(
  name text,
  username text,
  avatar jsonb,
  created_at timestamptz,
  total_xp int,
  streak_days int,
  tier int
)
language sql
security definer
set search_path = public
as $$
  select p.name, p.username, p.avatar, p.created_at,
    coalesce(s.total_xp, 0)::int,
    coalesce(s.streak_days, 0)::int,
    coalesce(l.tier, 0)::int
  from profiles p
  left join user_stats s on s.user_id = p.id
  left join league l on l.user_id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

grant execute on function get_public_profile(text) to authenticated, anon;
