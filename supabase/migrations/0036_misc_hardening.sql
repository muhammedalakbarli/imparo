-- Kiçik təhlükəsizlik təmizləmələri (audit zamanı 🟡 kimi işarələnmiş, aşağı ciddiyyətli tapıntılar).

-- ══════════════ profiles.is_bot — sütun qorumasız idi (özünü bot işarələyib admin
-- analitikadan gizlənmək mümkün idi) ══════════════
revoke update (is_bot) on profiles from authenticated, anon;

create or replace function protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.is_bot := old.is_bot;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_profile on profiles;
create trigger trg_protect_profile
  before update on profiles
  for each row execute function protect_profile_columns();

-- ══════════════ bump_active_seconds — tək-çağırış tavanı (120san) var idi, gündəlik cəm
-- tavanı yox idi (aşağı risk — yalnız admin analitika dəqiqliyinə təsir edir) ══════════════
alter table user_stats add column if not exists active_seconds_today int not null default 0;
alter table user_stats add column if not exists active_seconds_day date;

-- Yeni sütunlar da 0035-dəki eyni qoruma altına düşməlidir (yoxsa eyni boşluq təkrarlanar).
revoke update (active_seconds_today, active_seconds_day) on user_stats from authenticated, anon;

create or replace function protect_stats_columns() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.gems := old.gems;
    new.total_xp := old.total_xp;
    new.streak_days := old.streak_days;
    new.streak_freezes := old.streak_freezes;
    new.hearts := old.hearts;
    new.hearts_updated_at := old.hearts_updated_at;
    new.active_seconds := old.active_seconds;
    new.gems_today := old.gems_today;
    new.gems_day := old.gems_day;
    new.xp_today := old.xp_today;
    new.xp_day := old.xp_day;
    new.last_active_date := old.last_active_date;
    new.active_seconds_today := old.active_seconds_today;
    new.active_seconds_day := old.active_seconds_day;
  end if;
  return new;
end; $$;
-- (trigger özü 0035-də yaradılıb, funksiya adı eynidir — yenidən yaratmağa ehtiyac yoxdur)

create or replace function bump_active_seconds(p_seconds int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'Asia/Baku')::date;
  cur_today int;
  cur_day date;
  capped int;
begin
  if uid is null then return; end if;
  insert into user_stats (user_id, active_seconds_today, active_seconds_day)
  values (uid, 0, today)
  on conflict (user_id) do nothing;

  select active_seconds_today, active_seconds_day into cur_today, cur_day
  from user_stats where user_id = uid for update;
  if cur_day is distinct from today then cur_today := 0; end if;

  capped := least(greatest(coalesce(p_seconds, 0), 0), 120);        -- tək çağırış tavanı (əvvəlki)
  capped := least(capped, greatest(14400 - cur_today, 0));          -- gündəlik cəm tavanı (4 saat)

  update user_stats set
    active_seconds = active_seconds + capped,
    active_seconds_today = cur_today + capped,
    active_seconds_day = today
  where user_id = uid;
end; $$;

-- ══════════════ grant_plus_to — hazırda `revoke all from authenticated` ilə bağlıdır və heç
-- yerdən çağırılmır, amma body-nin özündə is_admin() yoxu YOX idi (dərinlik müdafiəsi əlavə
-- olunur — gələcəkdə kimsə səhvən "grant execute...to authenticated" yazsa belə, bu qoruyacaq) ══════════════
create or replace function grant_plus_to(p_email text, p_months int default 12)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not is_admin() then
    raise exception 'not admin';
  end if;
  select id into uid from auth.users where email = lower(trim(p_email));
  if uid is null then raise exception 'user not found: %', p_email; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (uid, 0, 0, null, 0) on conflict (user_id) do nothing;
  update user_stats set is_plus = true, plus_until = now() + make_interval(months => p_months)
  where user_id = uid;
end; $$;

-- ══════════════ get_cohort — p_size klampsiz idi (digər admin list funksiyalarından fərqli) ══════════════
create or replace function get_cohort(p_week text, p_size int default 15)
returns table(
  user_id uuid, name text, username text, avatar jsonb,
  weekly_xp int, tier int, is_me boolean
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  my_tier int;
  safe_size int := least(greatest(coalesce(p_size, 15), 1), 50);
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
    limit safe_size;
end; $$;
