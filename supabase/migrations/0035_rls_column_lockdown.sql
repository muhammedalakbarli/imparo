-- KRİTİK təhlükəsizlik düzəlişi — 0033/0034-dəki bütün RPC tavanları (add_gems/add_user_xp/
-- add_leaderboard_xp/add_weekly_xp) faktiki FAYDASIZ idi, çünki user_stats/league/leaderboard/
-- friendships cədvəllərində RLS sütun səviyyəsində heç nəyi məhdudlaşdırmırdı — istənilən
-- authenticated istifadəçi RPC-ni HEÇ ÇAĞIRMADAN, birbaşa REST-lə
-- (`supabase.from('user_stats').update({gems: 999999999}).eq('user_id', me)`) yaza bilirdi.
--
-- Yeganə istisna is_plus/plus_until idi (0024 revoke + 0025 trigger — bax "protect_plus_columns").
-- Bu migration EYNİ SÜBUT OLUNMUŞ NÜMUNƏNİ digər həssas sütunlara tətbiq edir: sütun-səviyyəli
-- REVOKE (authenticated cədvəl-səviyyəli UPDATE icazəsinə malik olduğu üçün tək başına kifayət
-- etmir) + BEFORE UPDATE trigger (dəyişikliyi köhnə dəyərə geri qaytarır). SECURITY DEFINER
-- funksiyalar (add_gems, add_user_xp və s.) owner kimi işlədiyi üçün current_user 'postgres'
-- olur — bunlara TƏSİR ETMİR, tam işlək qalır. Client kod DƏYİŞMİR (heç bir legitim çağırış bu
-- sütunlara birbaşa REST update etmir — hamısı artıq RPC-lər vasitəsilə yazır).

-- ══════════════ user_stats ══════════════
revoke update (
  gems, total_xp, streak_days, streak_freezes, hearts, hearts_updated_at,
  active_seconds, gems_today, gems_day, xp_today, xp_day, last_active_date
) on user_stats from authenticated, anon;

create or replace function protect_stats_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.gems := old.gems;
    new.total_xp := old.total_xp;
    new.streak_days := old.streak_days;
    new.streak_freezes := old.streak_freezes;
    new.hearts := old.hearts;
    new.hearts_updated_at := old.hearts_updated_at;
    new.active_seconds := old.active_seconds;
    new.gems_today := old.gems_today;
    new.gems_day := old.gems_day;
    new.xp_today := old.xp_today;
    new.xp_day := old.xp_day;
    new.last_active_date := old.last_active_date;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_stats on user_stats;
create trigger trg_protect_stats
  before update on user_stats
  for each row execute function protect_stats_columns();

-- ══════════════ league — weekly_xp + tier (özünü Almaz liqasına aparmaq mümkün idi) ══════════════
revoke update (weekly_xp, tier) on league from authenticated, anon;

create or replace function protect_league_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.weekly_xp := old.weekly_xp;
    new.tier := old.tier;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_league on league;
create trigger trg_protect_league
  before update on league
  for each row execute function protect_league_columns();

-- ══════════════ leaderboard — xp ══════════════
revoke update (xp) on leaderboard from authenticated, anon;

create or replace function protect_leaderboard_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.xp := old.xp;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_leaderboard on leaderboard;
create trigger trg_protect_leaderboard
  before update on leaderboard
  for each row execute function protect_leaderboard_columns();

-- ══════════════ friendships — streak + streak_day ══════════════
revoke update (streak, streak_day) on friendships from authenticated, anon;

create or replace function protect_friendship_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.streak := old.streak;
    new.streak_day := old.streak_day;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_friendship on friendships;
create trigger trg_protect_friendship
  before update on friendships
  for each row execute function protect_friendship_columns();
