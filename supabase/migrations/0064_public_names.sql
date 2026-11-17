-- ══════════════════════════════════════════════════════════════════════════════
-- UŞAQ MƏXFİLİYİ: başqalarına yalnız "Ad S." göstərilir
-- ------------------------------------------------------------------------------
-- Problem: Google ilə daxil olan azyaşlı şagirdin TAM adı və soyadı avtomatik
-- olaraq liqada, ümumi reytinqdə, dostlar siyahısında və açıq profildə görünürdü.
-- Üstəlik `league` və `leaderboard` cədvəllərində "public read" siyasəti var —
-- tam ad yalnız ekranda yox, açıq API-da da oxunurdu (girişsiz də).
--
-- Həll (yalnız ekranda gizlətmək kifayət DEYİL — məlumatın özü qısalır):
--   1. public_name(): "Aysel Məmmədova" → "Aysel M."; tək söz olduğu kimi qalır.
--   2. league/leaderboard-a trigger: ad HANSI yolla yazılırsa yazılsın (RPC, birbaşa
--      REST upsert) saxlanmazdan əvvəl qısaldılır. Mövcud sətirlər də qısaldılır.
--   3. Başqa istifadəçinin adını qaytaran funksiyalar (reytinq, açıq profil,
--      dostlar) public_name() qaytarır.
--
-- QƏSDƏN TOXUNULMAYAN: müəllimin sinif reyestri (class_roster,
-- class_student_detail) — müəllim şagirdini tam adla tanımalıdır; admin funksiyaları;
-- istifadəçinin öz profili (profiles cədvəlində tam ad qalır, yalnız sahibi oxuyur).
-- Liqa botları (lib/bots.ts) da eyni formatdadır — real istifadəçidən ayırd edilməsin.
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function public_name(p text)
returns text language sql immutable set search_path = public as $$
  with t as (
    select regexp_split_to_array(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g')), ' ') as w
  )
  select case
    when coalesce(btrim(p), '') = '' then 'İstifadəçi'
    when array_length(w, 1) = 1 then left(w[1], 24)
    else left(w[1], 24) || ' ' || upper(left(w[2], 1)) || '.'
  end
  from t;
$$;
grant execute on function public_name(text) to anon, authenticated;

-- ── Saxlanan adlar: trigger + mövcud sətirlər ────────────────────────────────
create or replace function enforce_public_name()
returns trigger language plpgsql set search_path = public as $$
begin
  new.name := public_name(new.name);
  return new;
end; $$;

drop trigger if exists league_public_name on league;
create trigger league_public_name
  before insert or update of name on league
  for each row execute function enforce_public_name();

drop trigger if exists leaderboard_public_name on leaderboard;
create trigger leaderboard_public_name
  before insert or update of name on leaderboard
  for each row execute function enforce_public_name();

update league      set name = public_name(name) where name is distinct from public_name(name);
update leaderboard set name = public_name(name) where name is distinct from public_name(name);

-- ── Başqasının adını qaytaran funksiyalar ────────────────────────────────────
-- Qaytarma tipləri DƏYİŞMİR (create or replace kifayətdir); yalnız ad sütunu.

create or replace function get_leaderboard(p_limit int default 50)
returns table(user_id uuid, name text, xp int)
language sql security definer set search_path = public as $$
  select p.id, public_name(p.name), coalesce(s.total_xp, 0)::int
  from profiles p
  left join user_stats s on s.user_id = p.id
  order by coalesce(s.total_xp, 0) desc, p.created_at asc
  limit p_limit;
$$;

create or replace function get_public_profile(p_key text)
returns table(
  id uuid, name text, username text, avatar jsonb, created_at timestamptz,
  total_xp int, streak_days int, tier int,
  followers int, following int, am_following boolean
)
language sql security definer set search_path = public as $$
  select p.id, public_name(p.name), p.username, p.avatar, p.created_at,
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

create or replace function get_friends()
returns table(
  friend_id uuid, name text, username text, avatar jsonb,
  total_xp int, streak_days int, friend_streak int
)
language sql security definer set search_path = public as $$
  select p.id, public_name(p.name), p.username, p.avatar,
    coalesce(s.total_xp, 0)::int, coalesce(s.streak_days, 0)::int, f.streak::int
  from friendships f
  join profiles p on p.id = case when f.a = auth.uid() then f.b else f.a end
  left join user_stats s on s.user_id = p.id
  where auth.uid() in (f.a, f.b)
  order by f.streak desc, p.name;
$$;

-- get_cohort dəyişmir: adı `league.name`-dən oxuyur, o isə artıq trigger ilə qısadır.

comment on function public_name(text) is
  'Başqalarına göstərilən ad: "Aysel Məmmədova" → "Aysel M.". Uşaq məxfiliyi üçün (0064).';
