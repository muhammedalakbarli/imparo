-- Imparo — Liqa rollover DÜZƏLİŞİ (tək, təhlükəsiz fayl).
-- Supabase SQL Editor-da BİR DƏFƏ bütöv işə salın. Əvvəlki migrasiyalardakı
-- funksiya imza/qaytarma tipi konfliktlərini aradan qaldırmaq üçün əvvəlcə DROP edir.
--
-- Niyə: liqa dəyişmirdi, çünki prod-da ya maybe_league_rollover yox idi, ya da
-- run_league_rollover köhnə (arqumentli) versiyada qalmışdı. Bu fayl hər şeyi
-- düzgün versiyaya gətirir. Təkrar işlətmək təhlükəsizdir (idempotent).

-- ── 1. league_meta (idempotent rollover üçün "son həftə" izi) ──────
create table if not exists league_meta (
  id int primary key default 1,
  last_week text not null default ''
);
insert into league_meta (id, last_week) values (1, '') on conflict (id) do nothing;
alter table league_meta enable row level security;
drop policy if exists "public read league_meta" on league_meta;
create policy "public read league_meta" on league_meta for select using (true);

-- ── 2. Köhnə funksiya imzalarını təmizlə (42P13 qarşısını al) ──────
drop function if exists run_league_rollover(text);
drop function if exists run_league_rollover();
drop function if exists get_cohort(text, int);
drop function if exists maybe_league_rollover();

-- ── 3. run_league_rollover() — arqumentsiz ────────────────────────
-- Bitən həftə = (indi − 7 gün), yeni həftə = indi (ISO həftə, Asia/Baku).
-- Hər pillədə: top 5 (XP>0) yüksəlir; kohort ≥12 olanda alt 5 düşür. Sonra XP sıfırlanır.
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

-- ── 4. get_cohort — yalnız bu həftə XP>0 olanlar (iştirak qaydası) ─
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
      and l.weekly_xp > 0
    order by l.weekly_xp desc, l.updated_at asc
    limit p_size;
end; $$;
grant execute on function get_cohort(text, int) to authenticated;

-- ── 5. maybe_league_rollover() — həftədə bir dəfə (səhifə açılanda) ─
create or replace function maybe_league_rollover()
returns void language plpgsql security definer set search_path = public as $$
declare
  cur_week text := to_char(now() at time zone 'Asia/Baku', 'IYYY-"W"IW');
  last_w text;
begin
  select last_week into last_w from league_meta where id = 1 for update;
  if last_w is null then last_w := ''; end if;

  if last_w = '' then
    update league_meta set last_week = cur_week where id = 1;
  elsif last_w < cur_week then
    perform run_league_rollover();
    update league_meta set last_week = cur_week where id = 1;
  end if;
end; $$;
grant execute on function maybe_league_rollover() to authenticated;

-- Yoxlama:  select proname from pg_proc where proname in ('run_league_rollover','maybe_league_rollover','get_cohort');
-- Məcburi test (real rollover, XP sıfırlanır):  select run_league_rollover();
