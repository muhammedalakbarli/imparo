-- 0033 hər ÇAĞIRIŞA tavan qoydu (məs. add_gems ≤100), amma ÇAĞIRIŞ SAYINA yox — kimsə RPC-ni
-- skriptlə saniyədə onlarla dəfə çağırıb yenə də (gün ərzində) çox-çox böyük məbləğ toplaya bilərdi.
-- Bu migration GÜNDƏLİK CƏM tavanı əlavə edir: neçə dəfə çağırılsa da, gündə ötməz. Tavanlar real
-- ən aktiv istifadəçinin mümkün gündəlik qazancından (~15-20 dərs) bir neçə dəfə yuxarıdır — normal
-- istifadəyə TOXUNMUR. (Qeyd: çağırışlar arası minimum interval BİLƏRƏKDƏN qoyulmayıb — dərs bitimi
-- ilə quest mükafatının demək olar eyni anda tələb oluna bilməsi real ssenaridir; interval bunu
-- səhvən rədd edə bilərdi. Gündəlik tavan tək başına kifayətdir: 3-4 çağırışdan sonra artıq
-- əlavə heç nə vermir, çağırış sayından asılı olmayaraq.)

alter table user_stats add column if not exists gems_today int not null default 0;
alter table user_stats add column if not exists gems_day date;
alter table user_stats add column if not exists xp_today int not null default 0;
alter table user_stats add column if not exists xp_day date;

-- ══════════════ add_gems — gündəlik cəm tavanı 300 ══════════════
create or replace function add_gems(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  g int;
  today date := (now() at time zone 'Asia/Baku')::date;
  cur_today int;
  cur_day date;
  capped int;
begin
  if me is null then return 0; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;

  select gems_today, gems_day into cur_today, cur_day from user_stats where user_id = me for update;
  if cur_day is distinct from today then cur_today := 0; end if;

  capped := least(greatest(p_amount, 0), 100);              -- tək çağırış tavanı (0033)
  capped := least(capped, greatest(300 - cur_today, 0));     -- GÜNDƏLİK CƏM tavanı

  update user_stats set
    gems = gems + capped,
    gems_today = cur_today + capped,
    gems_day = today
  where user_id = me
  returning gems into g;

  return coalesce(g, 0);
end; $$;
grant execute on function add_gems(int) to authenticated;

-- ══════════════ add_user_xp — gündəlik cəm tavanı 1500 ══════════════
create or replace function add_user_xp(p_amount int, p_touch_streak boolean default false)
returns table(total_xp int, streak_days int, last_active_date date, streak_freezes int)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  today date := (now() at time zone 'Asia/Baku')::date;
  cur_last date;
  cur_streak int;
  cur_freezes int;
  new_streak int;
  new_freezes int;
  cur_xp_today int;
  cur_xp_day date;
  safe_amount int;
begin
  if me is null then
    return;
  end if;

  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0)
  on conflict (user_id) do nothing;

  select s.last_active_date, s.streak_days, s.streak_freezes, s.xp_today, s.xp_day
    into cur_last, cur_streak, cur_freezes, cur_xp_today, cur_xp_day
  from user_stats s where s.user_id = me
  for update;

  if cur_xp_day is distinct from today then cur_xp_today := 0; end if;

  safe_amount := least(greatest(coalesce(p_amount, 0), 0), 500);       -- tək çağırış tavanı (0033)
  safe_amount := least(safe_amount, greatest(1500 - cur_xp_today, 0)); -- GÜNDƏLİK CƏM tavanı

  if safe_amount <= 0 and not p_touch_streak then
    return query select s.total_xp, s.streak_days, s.last_active_date, s.streak_freezes
      from user_stats s where s.user_id = me;
    return;
  end if;

  new_freezes := cur_freezes;
  if p_touch_streak then
    if cur_last = today then
      new_streak := cur_streak;                          -- eyni gün — dəyişmir
    elsif cur_last = today - 1 then
      new_streak := cur_streak + 1;                      -- ardıcıl gün
    elsif cur_last = today - 2 and cur_freezes > 0 then
      new_streak := cur_streak + 1;                      -- 1 gün buraxıldı → freeze örtür
      new_freezes := cur_freezes - 1;
    else
      new_streak := 1;                                   -- seriya qırılıb / ilk gün
    end if;
    update user_stats s set
      total_xp = s.total_xp + safe_amount,
      streak_days = new_streak,
      streak_freezes = new_freezes,
      last_active_date = today,
      xp_today = cur_xp_today + safe_amount,
      xp_day = today
    where s.user_id = me;
  else
    update user_stats s set
      total_xp = s.total_xp + safe_amount,
      xp_today = cur_xp_today + safe_amount,
      xp_day = today
    where s.user_id = me;
  end if;

  return query select s.total_xp, s.streak_days, s.last_active_date, s.streak_freezes
    from user_stats s where s.user_id = me;
end; $$;

-- ══════════════ add_leaderboard_xp / add_weekly_xp — eyni sual keçərlidir. Bu ikisi artıq
-- HƏFTƏLİK CƏM saxlayır (xp/weekly_xp sütunu) → saxlanan cəmi birbaşa kəsmək kifayətdir,
-- ayrıca "bugünkü sayğac" sütunu lazım deyil. Tavan: 5000/həftə (real ən aktiv istifadəçidən
-- qat-qat yuxarı — ibtidai/orta məktəb məzmununda 7 gündə real əldə edilə bilməz).
create or replace function add_leaderboard_xp(p_week text, p_name text, p_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare safe_amount int := least(greatest(coalesce(p_amount, 0), 0), 500);
begin
  if auth.uid() is null or safe_amount <= 0 then
    return;
  end if;
  insert into leaderboard (user_id, week, name, xp)
  values (auth.uid(), p_week, left(coalesce(nullif(trim(p_name), ''), 'İstifadəçi'), 60), safe_amount)
  on conflict (user_id, week) do update
    set xp = least(leaderboard.xp + excluded.xp, 5000),
        name = excluded.name,
        updated_at = now();
end;
$$;

create or replace function add_weekly_xp(p_name text, p_amount int, p_week text)
returns void language plpgsql security definer set search_path = public as $$
declare safe_amount int := least(greatest(coalesce(p_amount, 0), 0), 500);
begin
  if auth.uid() is null or safe_amount <= 0 then return; end if;
  insert into league (user_id, name, tier, weekly_xp, week)
  values (auth.uid(), left(coalesce(nullif(trim(p_name), ''), 'İstifadəçi'), 60), 0, safe_amount, p_week)
  on conflict (user_id) do update set
    name = excluded.name,
    weekly_xp = case when league.week = excluded.week
                     then least(league.weekly_xp + excluded.weekly_xp, 5000)
                     else excluded.weekly_xp end,
    week = excluded.week,
    updated_at = now();
end; $$;
