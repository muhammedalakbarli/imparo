-- Imparo — Duolingo üslubu liqa: eyni pillədə (tier) 15 nəfərlik kohort həftəlik
-- XP ilə yarışır; həftə sonu top 5 növbəti liqaya keçir, alt 5 aşağı düşür.
-- Supabase SQL Editor-da işə salınır.

create table if not exists league (
  user_id uuid primary key references profiles(id) on delete cascade,
  name text not null,
  tier int not null default 0,           -- 0=Bürünc, 1=Gümüş, 2=Qızıl, 3=Platin, 4=Almaz
  weekly_xp int not null default 0,
  week text not null default '',         -- cari həftə açarı "YYYY-Www"
  updated_at timestamptz not null default now()
);

alter table league enable row level security;
drop policy if exists "public read league" on league;
create policy "public read league" on league for select using (true);
drop policy if exists "own league write" on league;
create policy "own league write" on league
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Həftəlik XP əlavə et (yeni həftədirsə sıfırlanır). Atomik.
create or replace function add_weekly_xp(p_name text, p_amount int, p_week text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_amount <= 0 then return; end if;
  insert into league (user_id, name, tier, weekly_xp, week)
  values (auth.uid(), p_name, 0, p_amount, p_week)
  on conflict (user_id) do update set
    name = excluded.name,
    weekly_xp = case when league.week = excluded.week
                     then league.weekly_xp + excluded.weekly_xp
                     else excluded.weekly_xp end,
    week = excluded.week,
    updated_at = now();
end; $$;
grant execute on function add_weekly_xp(text, int, text) to authenticated;

-- Çağıranın kohortu: eyni pillədəki istifadəçilər, bu həftənin XP-si üzrə (max 15).
-- Köhnə həftədən qalan weekly_xp 0 sayılır. Çağıran həmişə siyahıya daxildir.
create or replace function get_cohort(p_week text, p_size int default 15)
returns table(user_id uuid, name text, weekly_xp int, tier int, is_me boolean)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare my_tier int;
begin
  select coalesce(l.tier, 0) into my_tier from league l where l.user_id = auth.uid();
  if my_tier is null then my_tier := 0; end if;

  -- Çağıranın league sətri yoxdursa yarat (0 XP ilə kohortda görünsün).
  insert into league (user_id, name, tier, weekly_xp, week)
  select auth.uid(), coalesce((select pr.name from profiles pr where pr.id = auth.uid()), 'İstifadəçi'), my_tier, 0, p_week
  where auth.uid() is not null
  on conflict (user_id) do nothing;

  return query
    select l.user_id, l.name,
      (case when l.week = p_week then l.weekly_xp else 0 end)::int as wxp,
      l.tier,
      (l.user_id = auth.uid()) as is_me
    from league l
    where l.tier = my_tier
    order by (case when l.week = p_week then l.weekly_xp else 0 end) desc, l.updated_at asc
    limit p_size;
end; $$;
grant execute on function get_cohort(text, int) to authenticated;

-- Həftəlik rollover: hər pillədə top 5 yuxarı, alt 5 aşağı; weekly_xp sıfırlanır.
-- Həftədə 1 dəfə işlədilir (manual və ya pg_cron). p_week = yeni həftə açarı.
create or replace function run_league_rollover(p_week text)
returns void language plpgsql security definer set search_path = public as $$
begin
  with ranked as (
    select user_id, tier, week, weekly_xp,
      row_number() over (partition by tier order by weekly_xp desc) as rnk,
      count(*) over (partition by tier) as cnt
    from league
  )
  update league l set
    tier = greatest(0, least(4,
      l.tier
      + case when r.rnk <= 5 and r.weekly_xp > 0 then 1 else 0 end
      - case when r.cnt >= 12 and r.rnk > r.cnt - 5 then 1 else 0 end)),
    weekly_xp = 0,
    week = p_week,
    updated_at = now()
  from ranked r
  where r.user_id = l.user_id;
end; $$;
grant execute on function run_league_rollover(text) to authenticated;
