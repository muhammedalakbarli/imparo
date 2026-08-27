-- Imparo — atomik XP/streak + liqa rollover düzəlişi.
-- Supabase SQL Editor-da işə salınır.
--
-- Niyə:
--  1) XP/streak client-də "oxu-dəyiş-yaz" edilirdi → eyni anda dərs + quest mükafatı
--     gedəndə XP itə bilərdi. İndi tək atomik RPC (row lock) hər şeyi serverdə edir.
--  2) Streak günü Asia/Baku vaxtı ilə hesablanır (əvvəl UTC idi → gün 04:00-da dəyişirdi).
--  3) run_league_rollover köhnə həftə XP-sini sayırdı; indi yalnız bitən həftənin XP-si
--     sıralanır və funksiya arqumentsizdir (pg_cron ilə asanlıqla işə salınır).

-- ── Atomik XP + streak ────────────────────────────────────────
-- p_touch_streak=true (dərs bitişi): streak günə görə yenilənir + last_active_date bugün.
-- p_touch_streak=false (quest mükafatı və s.): yalnız total_xp artır, streak-ə toxunma.
create or replace function add_user_xp(p_amount int, p_touch_streak boolean default false)
returns table(total_xp int, streak_days int, last_active_date date)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  today date := (now() at time zone 'Asia/Baku')::date;
  cur_last date;
  cur_streak int;
  new_streak int;
begin
  if me is null then
    return;
  end if;

  -- sətir yoxdursa yarat (sonra kilidləyib oxu)
  insert into user_stats (user_id, total_xp, streak_days, last_active_date)
  values (me, 0, 0, null)
  on conflict (user_id) do nothing;

  select s.last_active_date, s.streak_days
    into cur_last, cur_streak
  from user_stats s where s.user_id = me
  for update;

  if p_amount <= 0 and not p_touch_streak then
    -- dəyişiklik yoxdur, cari dəyərləri qaytar
    return query select s.total_xp, s.streak_days, s.last_active_date
      from user_stats s where s.user_id = me;
    return;
  end if;

  if p_touch_streak then
    if cur_last = today then
      new_streak := cur_streak;               -- eyni gün — dəyişmir
    elsif cur_last = today - 1 then
      new_streak := cur_streak + 1;           -- ardıcıl gün
    else
      new_streak := 1;                        -- seriya qırılıb / ilk gün
    end if;
    update user_stats s set
      total_xp = s.total_xp + greatest(p_amount, 0),
      streak_days = new_streak,
      last_active_date = today
    where s.user_id = me;
  else
    update user_stats s set
      total_xp = s.total_xp + p_amount
    where s.user_id = me;
  end if;

  return query select s.total_xp, s.streak_days, s.last_active_date
    from user_stats s where s.user_id = me;
end; $$;
grant execute on function add_user_xp(int, boolean) to authenticated;

-- ── Liqa rollover (düzəldilmiş) ───────────────────────────────
-- Arqumentsiz: bitən həftə = (indi - 7 gün), yeni həftə = indi (ISO həftə, Asia/Baku).
-- Yalnız bitən həftənin XP-si sıralanır (köhnə/qalıq XP 0 sayılır).
-- Hər pillədə: top 5 (XP>0) yuxarı; kohort ≥12 olanda alt 5 aşağı. Sonra XP sıfırlanır.
drop function if exists run_league_rollover(text);
create or replace function run_league_rollover()
returns void language plpgsql security definer set search_path = public as $$
declare
  ended_week text := to_char((now() at time zone 'Asia/Baku') - interval '7 days', 'IYYY-"W"IW');
  new_week   text := to_char( now() at time zone 'Asia/Baku', 'IYYY-"W"IW');
begin
  with ranked as (
    select
      user_id, tier,
      (case when week = ended_week then weekly_xp else 0 end) as exp,
      row_number() over (
        partition by tier
        order by (case when week = ended_week then weekly_xp else 0 end) desc
      ) as rnk,
      count(*) over (partition by tier) as cnt
    from league
  )
  update league l set
    tier = greatest(0, least(4,
      l.tier
      + case when r.rnk <= 5 and r.exp > 0 then 1 else 0 end
      - case when r.cnt >= 12 and r.rnk > r.cnt - 5 then 1 else 0 end)),
    weekly_xp = 0,
    week = new_week,
    updated_at = now()
  from ranked r
  where r.user_id = l.user_id;
end; $$;
grant execute on function run_league_rollover() to authenticated;

-- ── Avtomatlaşdırma (pg_cron) ─────────────────────────────────
-- Supabase-də pg_cron uzantısını aktivləşdirdikdən sonra həftəlik cədvəl qur.
-- (Dashboard → Database → Extensions → pg_cron aktiv et, sonra:)
--
--   select cron.schedule(
--     'league-weekly-rollover',
--     '5 20 * * 0',                    -- hər bazar 20:05 UTC (= bazar ertəsi 00:05 Asia/Baku)
--     $$ select run_league_rollover() $$
--   );
--
-- Silmək üçün: select cron.unschedule('league-weekly-rollover');
