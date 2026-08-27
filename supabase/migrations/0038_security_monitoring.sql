-- Təhlükəsizlik monitorinqi + signup sui-istifadə qoruması.
-- (1) security_events — yalnız admin oxuyur, yazı yalnız SECURITY DEFINER RPC-dən.
-- (2) check_signup_rate — IP-ə görə saatlıq qeydiyyat cəhdi tavanı (Supabase-in öz email-rate-limit-i
--     üzərinə əlavə qat, bizim öz API route-umuzda tətbiq olunur).
-- (3) add_gems/add_user_xp gündəlik tavana DƏYƏNDƏ ("reward_cap_hit") avtomatik qeyd olunur —
--     bu, skript-oxşar sui-istifadənin ən aydın əlamətidir (adi istifadəçi tavana dəymir).
-- (4) admin_security_events/admin_flagged_users — admin panelində görünmə üçün.

create table if not exists security_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  kind text not null,
  user_id uuid references auth.users(id) on delete set null,
  ip text,
  detail jsonb
);
alter table security_events enable row level security;
drop policy if exists "admin read security_events" on security_events;
create policy "admin read security_events" on security_events for select using (is_admin());
-- Yazı policy-si YOXDUR (default-deny) — yalnız aşağıdakı SECURITY DEFINER funksiya yaza bilər.

create or replace function log_security_event(p_kind text, p_ip text default null, p_detail jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into security_events(kind, user_id, ip, detail)
  values (left(coalesce(p_kind, 'unknown'), 40), auth.uid(), left(coalesce(p_ip, ''), 64), p_detail);
end; $$;
grant execute on function log_security_event(text, text, jsonb) to authenticated, anon;

-- Saatda eyni IP-dən 8-dən çox qeydiyyat cəhdi — bloklanır (real istifadəçi üçün səxavətli hədd).
create or replace function check_signup_rate(p_ip text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if p_ip is null or p_ip = '' then return true; end if;
  select count(*) into cnt from security_events
  where kind = 'signup_attempt' and ip = left(p_ip, 64) and created_at > now() - interval '1 hour';
  return cnt < 8;
end; $$;
grant execute on function check_signup_rate(text) to authenticated, anon;

-- ══════════════ add_gems / add_user_xp — gündəlik tavana dəyəndə hadisə qeyd et ══════════════
create or replace function add_gems(p_amount int)
returns int language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  g int;
  today date := (now() at time zone 'Asia/Baku')::date;
  cur_today int;
  cur_day date;
  per_call int;
  capped int;
begin
  if me is null then return 0; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (me, 0, 0, null, 0) on conflict (user_id) do nothing;

  select gems_today, gems_day into cur_today, cur_day from user_stats where user_id = me for update;
  if cur_day is distinct from today then cur_today := 0; end if;

  per_call := least(greatest(p_amount, 0), 100);
  capped := least(per_call, greatest(300 - cur_today, 0));

  if capped < per_call then
    perform log_security_event('reward_cap_hit', null,
      jsonb_build_object('rpc', 'add_gems', 'requested', p_amount, 'granted', capped));
  end if;

  update user_stats set
    gems = gems + capped,
    gems_today = cur_today + capped,
    gems_day = today
  where user_id = me
  returning gems into g;

  return coalesce(g, 0);
end; $$;
grant execute on function add_gems(int) to authenticated;

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
  per_call int;
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

  per_call := least(greatest(coalesce(p_amount, 0), 0), 500);
  safe_amount := least(per_call, greatest(1500 - cur_xp_today, 0));

  if safe_amount < per_call then
    perform log_security_event('reward_cap_hit', null,
      jsonb_build_object('rpc', 'add_user_xp', 'requested', p_amount, 'granted', safe_amount));
  end if;

  if safe_amount <= 0 and not p_touch_streak then
    return query select s.total_xp, s.streak_days, s.last_active_date, s.streak_freezes
      from user_stats s where s.user_id = me;
    return;
  end if;

  new_freezes := cur_freezes;
  if p_touch_streak then
    if cur_last = today then
      new_streak := cur_streak;
    elsif cur_last = today - 1 then
      new_streak := cur_streak + 1;
    elsif cur_last = today - 2 and cur_freezes > 0 then
      new_streak := cur_streak + 1;
      new_freezes := cur_freezes - 1;
    else
      new_streak := 1;
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

-- ══════════════ Admin görünürlüyü ══════════════
create or replace function admin_security_events(p_limit int default 100)
returns table(id bigint, created_at timestamptz, kind text, user_id uuid, email text, ip text, detail jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select se.id, se.created_at, se.kind, se.user_id, u.email::text, se.ip, se.detail
    from security_events se
    left join auth.users u on u.id = se.user_id
    order by se.created_at desc
    limit least(greatest(coalesce(p_limit, 100), 1), 500);
end; $$;
grant execute on function admin_security_events(int) to authenticated;

-- Son 7 gündə 3+ dəfə gündəlik tavana dəyən istifadəçilər — skript-oxşar davranış əlaməti.
create or replace function admin_flagged_users()
returns table(user_id uuid, email text, name text, cap_hits bigint, last_hit timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select se.user_id, u.email::text, coalesce(p.name, '—'), count(*), max(se.created_at)
    from security_events se
    join auth.users u on u.id = se.user_id
    left join profiles p on p.id = se.user_id
    where se.kind = 'reward_cap_hit' and se.created_at > now() - interval '7 days'
    group by se.user_id, u.email, p.name
    having count(*) >= 3
    order by count(*) desc;
end; $$;
grant execute on function admin_flagged_users() to authenticated;
