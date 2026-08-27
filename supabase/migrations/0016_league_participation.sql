-- Imparo — Liqa iştirak qaydası + idempotent həftəlik rollover.
-- Supabase SQL Editor-da işə salınır.
--
-- Niyə:
--  1) İştirak qaydası yox idi: get_cohort çağıranı 0 XP ilə də siyahıya salırdı.
--     İndi yalnız CARI HƏFTƏ XP>0 olanlar kohortda görünür (0 XP — çağıran daxil — görünmür).
--     Liqaya qatılmaq üçün həmin həftə ən azı bir dərs edib XP qazanmaq lazımdır.
--  2) Tier heç vaxt artmırdı (pg_cron aktiv deyil). İndi maybe_league_rollover() səhifə
--     yüklənəndə çağırılır və həftədə BİR DƏFƏ (idempotent) rollover edir → digər liqalar açılır.

-- ── İştirak: get_cohort yalnız XP>0 olanları qaytarır ────────────
-- Return tipi eynidir (0008), amma sətir yaratma tier üçün qalır, siyahı XP>0 ilə süzülür.
drop function if exists get_cohort(text, int);
create or replace function get_cohort(p_week text, p_size int default 15)
returns table(
  user_id uuid, name text, username text, avatar jsonb,
  weekly_xp int, tier int, is_me boolean
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare my_tier int;
begin
  select coalesce(l.tier, 0) into my_tier from league l where l.user_id = auth.uid();
  if my_tier is null then my_tier := 0; end if;

  -- Çağıranın league sətri yoxdursa yarat (tier izlənsin) — 0 XP-lə siyahıya salmır.
  insert into league(user_id, name, tier, weekly_xp, week)
  select auth.uid(),
    coalesce((select pr.name from profiles pr where pr.id = auth.uid()), 'İstifadəçi'),
    my_tier, 0, p_week
  where auth.uid() is not null on conflict(user_id) do nothing;

  return query
    select l.user_id, l.name, p.username, p.avatar,
      l.weekly_xp::int, l.tier, (l.user_id = auth.uid())
    from league l
    left join profiles p on p.id = l.user_id
    where l.tier = my_tier
      and l.week = p_week
      and l.weekly_xp > 0            -- yalnız bu həftə iştirak edənlər
    order by l.weekly_xp desc, l.updated_at asc
    limit p_size;
end; $$;
grant execute on function get_cohort(text, int) to authenticated;

-- ── İdempotent həftəlik rollover ─────────────────────────────────
-- league_meta.last_week: rollover-un ən son işlədiyi həftə. Həftədə bir dəfə işə düşür.
create table if not exists league_meta (
  id int primary key default 1,
  last_week text not null default ''
);
insert into league_meta (id, last_week) values (1, '') on conflict (id) do nothing;
alter table league_meta enable row level security;
drop policy if exists "public read league_meta" on league_meta;
create policy "public read league_meta" on league_meta for select using (true);

-- Cari ISO həftə (Asia/Baku) fərqlidirsə rollover et. İlk dəfə (last_week='') yalnız initial.
create or replace function maybe_league_rollover()
returns void language plpgsql security definer set search_path = public as $$
declare
  cur_week text := to_char(now() at time zone 'Asia/Baku', 'IYYY-"W"IW');
  last_w text;
begin
  select last_week into last_w from league_meta where id = 1 for update;
  if last_w is null then last_w := ''; end if;

  if last_w = '' then
    -- İlk aktivləşdirmə: cari həftə XP-sini silmədən yalnız qeyd et.
    update league_meta set last_week = cur_week where id = 1;
  elsif last_w < cur_week then
    -- Yeni həftə: tier-ləri irəlilət, weekly_xp sıfırla (run_league_rollover arqumentsiz).
    perform run_league_rollover();
    update league_meta set last_week = cur_week where id = 1;
  end if;
end; $$;
grant execute on function maybe_league_rollover() to authenticated;
