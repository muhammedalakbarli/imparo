-- Imparo — Streak Freeze (seriya qoruyucu).
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- Niyə: retensiyanın #1 leveri. İstifadəçi bir gün buraxsa, seriya sıfırlanmır —
-- avtomatik bir "freeze" işlədilir və seriya davam edir. Freeze gündəlik sandıqdan qazanılır
-- (cap = 2). Yalnız TƏK buraxılmış gün örtülür; daha uzun fasilə seriyanı sıfırlayır.

alter table user_stats
  add column if not exists streak_freezes int not null default 0;

-- ── Atomik XP + streak (freeze dəstəyi ilə) ──
-- Qaytarılan sütun dəyişdiyi üçün əvvəlcə drop lazımdır.
drop function if exists add_user_xp(int, boolean);
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

  if p_amount <= 0 and not p_touch_streak then
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
      total_xp = s.total_xp + greatest(p_amount, 0),
      streak_days = new_streak,
      streak_freezes = new_freezes,
      last_active_date = today
    where s.user_id = me;
  else
    update user_stats s set
      total_xp = s.total_xp + p_amount
    where s.user_id = me;
  end if;

  return query select s.total_xp, s.streak_days, s.last_active_date, s.streak_freezes
    from user_stats s where s.user_id = me;
end; $$;
grant execute on function add_user_xp(int, boolean) to authenticated;

-- ── Freeze qazan (cap-ə qədər) ──
-- Gündəlik sandıq açılanda çağırılır; cap-dən yuxarı qaldırmır. Yeni sayı qaytarır.
create or replace function grant_streak_freeze(p_cap int default 2)
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
    streak_freezes = least(s.streak_freezes + 1, greatest(p_cap, 0))
  where s.user_id = me
  returning s.streak_freezes into new_count;

  return coalesce(new_count, 0);
end; $$;
grant execute on function grant_streak_freeze(int) to authenticated;
