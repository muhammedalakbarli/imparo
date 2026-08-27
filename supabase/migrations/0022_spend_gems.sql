-- Imparo — Zümrüd xərcləmə (mağaza).
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- Kifayət qədər zümrüd varsa azaldır və yeni balansı qaytarır; çatmırsa -1 qaytarır
-- (heç nə dəyişmir). Atomik (row lock) — ikiqat xərcləmə olmaz.

create or replace function spend_gems(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  cur int;
begin
  if me is null then return -1; end if;
  if p_amount <= 0 then
    select gems into cur from user_stats where user_id = me;
    return coalesce(cur, 0);
  end if;

  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;

  select gems into cur from user_stats where user_id = me for update;
  if coalesce(cur, 0) < p_amount then
    return -1; -- çatmır
  end if;
  update user_stats set gems = gems - p_amount where user_id = me returning gems into cur;
  return cur;
end; $$;
grant execute on function spend_gems(int) to authenticated;
