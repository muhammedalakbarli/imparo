-- Admin Suite — istifadəçi detalı + əməliyyatlar, böyümə/retensiya funnel, fənn statistikası,
-- məktəb (B2B) icmalı, elan/bildiriş sistemi. Hamısı is_admin() ilə qorunur (SECURITY DEFINER).
-- Supabase SQL Editor-da işə salınır. İdempotentdir.

-- ══ 1) İstifadəçi cədvəli — mənbə (provider) + e-poçt təsdiqi əlavə olundu ══
drop function if exists admin_users(text, int, int);
create function admin_users(p_search text default '', p_limit int default 100, p_offset int default 0)
returns table(
  user_id uuid, email text, name text, created_at timestamptz,
  total_xp int, streak_days int, last_active_date date,
  gems int, is_plus boolean, completed bigint,
  last_sign_in_at timestamptz, active_seconds bigint,
  provider text, email_confirmed boolean
) language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select u.id, u.email::text, coalesce(p.name, '—'), u.created_at,
      coalesce(s.total_xp, 0), coalesce(s.streak_days, 0), s.last_active_date,
      coalesce(s.gems, 0), coalesce(s.is_plus, false),
      (select count(*) from user_progress up where up.user_id = u.id),
      u.last_sign_in_at, coalesce(s.active_seconds, 0),
      coalesce(u.raw_app_meta_data->>'provider', 'email'),
      (u.email_confirmed_at is not null)
    from auth.users u
    left join profiles p on p.id = u.id
    left join user_stats s on s.user_id = u.id
    where not coalesce(p.is_bot, false)
      and (p_search = ''
        or u.email ilike '%' || p_search || '%'
        or coalesce(p.name, '') ilike '%' || p_search || '%')
    order by u.created_at desc
    limit greatest(coalesce(p_limit, 100), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end; $$;
grant execute on function admin_users(text, int, int) to authenticated;

-- ══ 2) İstifadəçi detalı (bir hesab, fənn üzrə irəliləyişlə) ══
create or replace function admin_user_detail(p_uid uuid)
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not is_admin() then return null; end if;
  select json_build_object(
    'user_id', u.id,
    'email', u.email,
    'name', coalesce(p.name, '—'),
    'is_bot', coalesce(p.is_bot, false),
    'created_at', u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed', (u.email_confirmed_at is not null),
    'provider', coalesce(u.raw_app_meta_data->>'provider', 'email'),
    'total_xp', coalesce(s.total_xp, 0),
    'streak_days', coalesce(s.streak_days, 0),
    'gems', coalesce(s.gems, 0),
    'hearts', coalesce(s.hearts, 0),
    'is_plus', coalesce(s.is_plus, false),
    'plus_until', s.plus_until,
    'active_seconds', coalesce(s.active_seconds, 0),
    'last_active_date', s.last_active_date,
    'completed', (select count(*) from user_progress up where up.user_id = u.id),
    'subjects', (
      select coalesce(json_agg(json_build_object('subject', t.name, 'done', t.done) order by t.done desc), '[]'::json)
      from (
        select subj.name, count(*) as done
        from user_progress up
        join lessons l on l.id = up.lesson_id
        join units un on un.id = l.unit_id
        join subjects subj on subj.id = un.subject_id
        where up.user_id = u.id
        group by subj.name
      ) t
    )
  ) into result
  from auth.users u
  left join profiles p on p.id = u.id
  left join user_stats s on s.user_id = u.id
  where u.id = p_uid;
  return result;
end; $$;
grant execute on function admin_user_detail(uuid) to authenticated;

-- ══ 3) Admin əməliyyatları ══
-- Bot/test işarəsi dəyiş
create or replace function admin_set_bot(p_uid uuid, p_is_bot boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profiles set is_bot = p_is_bot where id = p_uid;
end; $$;
grant execute on function admin_set_bot(uuid, boolean) to authenticated;

-- Plus ver (SECURITY DEFINER owner kimi işlədiyi üçün protect trigger-i keçir)
create or replace function admin_grant_plus(p_uid uuid, p_months int default 12)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  insert into user_stats (user_id) values (p_uid) on conflict (user_id) do nothing;
  update user_stats set is_plus = true,
    plus_until = now() + make_interval(months => greatest(coalesce(p_months, 12), 1))
  where user_id = p_uid;
end; $$;
grant execute on function admin_grant_plus(uuid, int) to authenticated;

-- Plus ləğv et
create or replace function admin_revoke_plus(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update user_stats set is_plus = false, plus_until = null where user_id = p_uid;
end; $$;
grant execute on function admin_revoke_plus(uuid) to authenticated;

-- Hesabı sil (auth.users → cascade profiles/user_stats/user_progress)
create or replace function admin_delete_user(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if p_uid = auth.uid() then raise exception 'öz hesabını silə bilməzsən'; end if;
  delete from auth.users where id = p_uid;
end; $$;
grant execute on function admin_delete_user(uuid) to authenticated;

-- ══ 4) Böyümə / Retensiya / Funnel ══
create or replace function admin_growth()
returns json language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Baku')::date; result json;
begin
  if not is_admin() then return null; end if;
  select json_build_object(
    'dau', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
             where s.last_active_date = today and not coalesce(p.is_bot, false)),
    'wau', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
             where s.last_active_date >= today - 7 and not coalesce(p.is_bot, false)),
    'mau', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
             where s.last_active_date >= today - 30 and not coalesce(p.is_bot, false)),
    'funnel', json_build_object(
      'signed_up', (select count(*) from auth.users u left join profiles p on p.id = u.id
                     where not coalesce(p.is_bot, false)),
      'activated', (select count(distinct up.user_id) from user_progress up
                     left join profiles p on p.id = up.user_id where not coalesce(p.is_bot, false)),
      'retained7', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
                     where s.last_active_date >= today - 7 and not coalesce(p.is_bot, false)),
      'plus', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
                where s.is_plus and (s.plus_until is null or s.plus_until > now()) and not coalesce(p.is_bot, false))
    ),
    'signups_daily', (
      select coalesce(json_agg(json_build_object('d', d::text, 'n', n) order by d), '[]'::json)
      from (
        select gs::date as d,
          (select count(*) from auth.users u left join profiles p on p.id = u.id
            where not coalesce(p.is_bot, false)
              and (u.created_at at time zone 'Asia/Baku')::date = gs::date) as n
        from generate_series(today - 13, today, interval '1 day') gs
      ) x
    ),
    'active_daily', (
      select coalesce(json_agg(json_build_object('d', d::text, 'n', n) order by d), '[]'::json)
      from (
        select gs::date as d,
          (select count(*) from user_stats s left join profiles p on p.id = s.user_id
            where not coalesce(p.is_bot, false) and s.last_active_date = gs::date) as n
        from generate_series(today - 13, today, interval '1 day') gs
      ) y
    )
  ) into result;
  return result;
end; $$;
grant execute on function admin_growth() to authenticated;

-- ══ 5) Fənn üzrə istifadə (tamamlanan dərslər + öyrənən sayı) ══
create or replace function admin_subject_stats()
returns table(subject text, completions bigint, learners bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select subj.name::text, count(*)::bigint, count(distinct up.user_id)::bigint
    from user_progress up
    join lessons l on l.id = up.lesson_id
    join units un on un.id = l.unit_id
    join subjects subj on subj.id = un.subject_id
    left join profiles p on p.id = up.user_id
    where not coalesce(p.is_bot, false)
    group by subj.name
    order by count(*) desc;
end; $$;
grant execute on function admin_subject_stats() to authenticated;

-- ══ 6) Məktəb (B2B) icmalı ══
create or replace function admin_schools()
returns table(class_id uuid, name text, code text, subject_slug text, grade int,
              teacher_email text, members bigint, assignments bigint, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select c.id, c.name, c.code, c.subject_slug, c.grade,
      tu.email::text,
      (select count(*) from class_members cm where cm.class_id = c.id),
      (select count(*) from assignments a where a.class_id = c.id),
      c.created_at
    from classes c
    left join auth.users tu on tu.id = c.teacher_id
    order by c.created_at desc;
end; $$;
grant execute on function admin_schools() to authenticated;

-- ══ 7) Elan / Bildiriş sistemi ══
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table announcements enable row level security;
-- Hər kəs aktiv elanları oxuya bilər.
drop policy if exists announcements_read on announcements;
create policy announcements_read on announcements for select using (active = true);

-- Elan yerləşdir
create or replace function admin_post_announcement(p_title text, p_body text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  insert into announcements (title, body, created_by) values (p_title, p_body, auth.uid());
end; $$;
grant execute on function admin_post_announcement(text, text) to authenticated;

-- Bütün elanları siyahıla (admin)
create or replace function admin_list_announcements()
returns setof announcements language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query select * from announcements order by created_at desc;
end; $$;
grant execute on function admin_list_announcements() to authenticated;

create or replace function admin_set_announcement_active(p_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update announcements set active = p_active where id = p_id;
end; $$;
grant execute on function admin_set_announcement_active(uuid, boolean) to authenticated;

create or replace function admin_delete_announcement(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  delete from announcements where id = p_id;
end; $$;
grant execute on function admin_delete_announcement(uuid) to authenticated;

-- Ən son aktiv elan (bütün istifadəçilər üçün banner)
create or replace function get_active_announcement()
returns json language sql stable security definer set search_path = public as $$
  select case when a.id is null then null else
    json_build_object('id', a.id, 'title', a.title, 'body', a.body, 'created_at', a.created_at)
  end
  from (select * from announcements where active order by created_at desc limit 1) a;
$$;
grant execute on function get_active_announcement() to authenticated, anon;
