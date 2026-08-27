-- Imparo — Canlar (hearts / lives).
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- Duolingo-üslubu canlar: maksimum 5. Dərsdə səhv cavab 1 can aparır. Zamanla bərpa:
-- hər 4 saatda +1 (cap 5). Praktika/tam bərpa ilə də doldurula bilər. Uşaqları sərt
-- bloklamamaq üçün 0 canda dərsi bitirmək olar, amma xəbərdarlıq göstərilir (UI qərarı).

alter table user_stats add column if not exists hearts int not null default 5;
alter table user_stats add column if not exists hearts_updated_at timestamptz not null default now();

-- Zaman əsaslı bərpanı hesabla, saxla və cari can sayını qaytar.
create or replace function get_hearts()
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  h int;
  ts timestamptz;
  gained int;
  now_ts timestamptz := now();
begin
  if me is null then return 5; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;

  select hearts, hearts_updated_at into h, ts from user_stats where user_id = me for update;
  if h < 5 then
    gained := floor(extract(epoch from (now_ts - ts)) / 14400); -- 4 saat = 14400 san
    if gained > 0 then
      h := least(h + gained, 5);
      update user_stats set
        hearts = h,
        hearts_updated_at = case when h >= 5 then now_ts else ts + (gained * interval '4 hours') end
      where user_id = me;
    end if;
  end if;
  return h;
end; $$;
grant execute on function get_hearts() to authenticated;

-- Əvvəl bərpanı tətbiq et, sonra 1 can azalt (min 0). Yeni sayı qaytar.
create or replace function lose_heart()
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  h int;
begin
  if me is null then return 0; end if;
  h := get_hearts();
  if h > 0 then
    update user_stats set
      hearts = hearts - 1,
      hearts_updated_at = case when hearts = 5 then now() else hearts_updated_at end
    where user_id = me
    returning hearts into h;
  end if;
  return h;
end; $$;
grant execute on function lose_heart() to authenticated;

-- Canları tam doldur (praktika mükafatı və s.).
create or replace function refill_hearts_full()
returns int language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then return 5; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;
  update user_stats set hearts = 5, hearts_updated_at = now() where user_id = me;
  return 5;
end; $$;
grant execute on function refill_hearts_full() to authenticated;
