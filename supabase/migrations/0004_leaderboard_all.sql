-- Imparo — ümumi liqa: bütün real qeydiyyatlı istifadəçilər (ümumi XP üzrə).
-- profiles + user_stats own-rows RLS ilə qorunur; bu funksiya security definer ilə
-- yalnız (ad + ümumi xp) qaytarır (şəxsi məlumat açılmır). Supabase SQL Editor-da işə salınır.

create or replace function get_leaderboard(p_limit int default 50)
returns table(user_id uuid, name text, xp int)
language sql
security definer
set search_path = public
as $$
  select p.id, p.name, coalesce(s.total_xp, 0)::int
  from profiles p
  left join user_stats s on s.user_id = p.id
  order by coalesce(s.total_xp, 0) desc, p.created_at asc
  limit p_limit;
$$;

grant execute on function get_leaderboard(int) to authenticated, anon;
