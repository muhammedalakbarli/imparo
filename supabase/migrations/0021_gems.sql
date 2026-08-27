-- Imparo — Zümrüd (gems) valyutası.
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- Zümrüd oyun daxili valyutadır (Duolingo gem/gem kimi). Dərs tamamlananda qazanılır.
-- Gələcəkdə mağaza/kosmetik üçün istifadə oluna bilər.

alter table user_stats add column if not exists gems int not null default 0;

create or replace function add_gems(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  g int;
begin
  if me is null then return 0; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;
  update user_stats set gems = gems + greatest(p_amount, 0) where user_id = me
  returning gems into g;
  return coalesce(g, 0);
end; $$;
grant execute on function add_gems(int) to authenticated;
