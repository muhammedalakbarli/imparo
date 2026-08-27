-- Təhlükəsizlik düzəlişi (2026 Avq) — client-göndərilən "məbləğ" parametrləri server tərəfində
-- MƏHDUDLAŞDIRILMIRDI. İstənilən authenticated istifadəçi RPC-ni birbaşa (brauzer konsolundan)
-- çağırıb öz zümrüd/XP/streak-freeze sayını qeyri-məhdud artıra bilirdi (istifadəçi tərəfindən
-- aşkarlanıb bildirildi). Hər RPC-yə real istifadə ssenarisindən çox-çox yuxarı, amma sonlu tavan
-- qoyulur (bir dəfəlik çağırışda mümkün olan maksimum legit mükafatdan several dəfə böyük).
-- İdempotentdir, mövcud çağırış yerlərini (client) pozmur.

-- ══════════════ add_gems — yuxarı tavan yox idi (istənilən p_amount qəbul edirdi) ══════════════
-- Legit maksimum tək çağırış: dərs (GEMS_PER_LESSON=5, Plus 2x=10) və ya sandıq (20). Tavan: 100.
create or replace function add_gems(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  g int;
begin
  if me is null then return 0; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;
  update user_stats set gems = gems + least(greatest(p_amount, 0), 100) where user_id = me
  returning gems into g;
  return coalesce(g, 0);
end; $$;
grant execute on function add_gems(int) to authenticated;

-- ══════════════ add_user_xp — ELSE budağında (p_touch_streak=false) HEÇ tavan yox idi ══════════════
-- Legit maksimum tək çağırış: dərs tamamlama (~30-50 XP) və ya quest mükafatı (~20 XP). Tavan: 500.
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
  safe_amount int := least(greatest(coalesce(p_amount, 0), 0), 500);
begin
  if me is null then
    return;
  end if;

  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0)
  on conflict (user_id) do nothing;

  select s.last_active_date, s.streak_days, s.streak_freezes
    into cur_last, cur_streak, cur_freezes
  from user_stats s where s.user_id = me
  for update;

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
      last_active_date = today
    where s.user_id = me;
  else
    update user_stats s set
      total_xp = s.total_xp + safe_amount
    where s.user_id = me;
  end if;

  return query select s.total_xp, s.streak_days, s.last_active_date, s.streak_freezes
    from user_stats s where s.user_id = me;
end; $$;

-- ══════════════ add_leaderboard_xp — tavan yox idi + p_name sərbəst mətn idi ══════════════
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
    set xp = leaderboard.xp + excluded.xp,
        name = excluded.name,
        updated_at = now();
end;
$$;

-- ══════════════ add_weekly_xp — eyni problem (köhnə league cədvəli) ══════════════
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
                     then league.weekly_xp + excluded.weekly_xp
                     else excluded.weekly_xp end,
    week = excluded.week,
    updated_at = now();
end; $$;

-- ══════════════ grant_streak_freeze — p_cap client-dən gəlirdi (limitsiz, PULSUZ freeze) ══════════════
-- Köhnə 1-arametrli imzanı sil (əks halda ikisi yanaşı qalar, köhnəsi hələ çağırıla bilər).
drop function if exists grant_streak_freeze(int);
create or replace function grant_streak_freeze()
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  new_count int;
begin
  if me is null then
    return 0;
  end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0)
  on conflict (user_id) do nothing;

  update user_stats s set
    streak_freezes = least(s.streak_freezes + 1, 2)
  where s.user_id = me
  returning s.streak_freezes into new_count;

  return coalesce(new_count, 0);
end; $$;
grant execute on function grant_streak_freeze() to authenticated;
