-- Admin Pro — audit log, gəlir, məzmun performansı, admin rolları, istifadəçi filtrləri (grade).
-- Supabase SQL Editor-da işə salınır. İdempotentdir. Bax 0029/0030.

-- ══════════════ E) Admin rolları ══════════════
alter table admins add column if not exists role text not null default 'admin';
-- İlk/əsas admini super et (ichbinmahammad). Digərləri 'admin' (moderator) qalır.
update admins set role = 'super'
where user_id in (select id from auth.users where email = 'ichbinmahammad@gmail.com');

create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins a where a.user_id = auth.uid() and a.role = 'super');
$$;
grant execute on function is_super_admin() to authenticated;

-- ══════════════ A) Audit log ══════════════
create table if not exists admin_audit (
  id bigserial primary key,
  admin_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  target_type text,
  target_id text,
  detail text,
  created_at timestamptz not null default now()
);
alter table admin_audit enable row level security;
-- RLS: yalnız RPC (security definer) yazır/oxuyur; birbaşa müştəri girişi yox.

-- Daxili log köməkçisi.
create or replace function log_admin_action(p_action text, p_ttype text, p_tid text, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into admin_audit (admin_id, admin_email, action, target_type, target_id, detail)
  values (auth.uid(), (select email from auth.users where id = auth.uid()), p_action, p_ttype, p_tid, p_detail);
end; $$;

-- Audit siyahısı (admin oxuyur).
create or replace function admin_audit_list(p_limit int default 100)
returns table(id bigint, admin_email text, action text, target_type text, target_id text, detail text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select a.id, a.admin_email, a.action, a.target_type, a.target_id, a.detail, a.created_at
    from admin_audit a order by a.created_at desc limit greatest(coalesce(p_limit, 100), 1);
end; $$;
grant execute on function admin_audit_list(int) to authenticated;

-- ── Əməliyyat RPC-lərini audit ilə yenidən yaz ──
create or replace function admin_set_bot(p_uid uuid, p_is_bot boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profiles set is_bot = p_is_bot where id = p_uid;
  perform log_admin_action(case when p_is_bot then 'set_bot' else 'unset_bot' end, 'user', p_uid::text, null);
end; $$;

create or replace function admin_grant_plus(p_uid uuid, p_months int default 12)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  insert into user_stats (user_id) values (p_uid) on conflict (user_id) do nothing;
  update user_stats set is_plus = true,
    plus_until = now() + make_interval(months => greatest(coalesce(p_months, 12), 1))
  where user_id = p_uid;
  perform log_admin_action('grant_plus', 'user', p_uid::text, 'months=' || coalesce(p_months, 12));
end; $$;

create or replace function admin_revoke_plus(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update user_stats set is_plus = false, plus_until = null where user_id = p_uid;
  perform log_admin_action('revoke_plus', 'user', p_uid::text, null);
end; $$;

-- Hesab silmə — YALNIZ super-admin (destruktiv).
create or replace function admin_delete_user(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
declare em text;
begin
  if not is_super_admin() then raise exception 'yalnız super-admin hesab silə bilər'; end if;
  if p_uid = auth.uid() then raise exception 'öz hesabını silə bilməzsən'; end if;
  select email into em from auth.users where id = p_uid;
  perform log_admin_action('delete_user', 'user', p_uid::text, em);
  delete from auth.users where id = p_uid;
end; $$;

-- ══════════════ C) İstifadəçi cədvəlinə GRADE əlavə (filtr üçün) ══════════════
drop function if exists admin_users(text, int, int);
create function admin_users(p_search text default '', p_limit int default 100, p_offset int default 0)
returns table(
  user_id uuid, email text, name text, created_at timestamptz,
  total_xp int, streak_days int, last_active_date date,
  gems int, is_plus boolean, completed bigint,
  last_sign_in_at timestamptz, active_seconds bigint,
  provider text, email_confirmed boolean, grade int
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
      (u.email_confirmed_at is not null),
      (u.raw_user_meta_data->>'grade')::int
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

-- ══════════════ B) Gəlir / Monetizasiya ══════════════
create or replace function admin_revenue()
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not is_admin() then return null; end if;
  select json_build_object(
    'active_plus', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
      where s.is_plus and (s.plus_until is null or s.plus_until > now()) and not coalesce(p.is_bot, false)),
    'expiring_30', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
      where s.is_plus and s.plus_until is not null and s.plus_until <= now() + interval '30 days'
        and s.plus_until > now() and not coalesce(p.is_bot, false)),
    'expired', (select count(*) from user_stats s left join profiles p on p.id = s.user_id
      where s.plus_until is not null and s.plus_until <= now() and not coalesce(p.is_bot, false))
  ) into result;
  return result;
end; $$;
grant execute on function admin_revenue() to authenticated;

create or replace function admin_plus_list(p_limit int default 200)
returns table(user_id uuid, email text, name text, plus_until timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select s.user_id, u.email::text, coalesce(p.name, '—'), s.plus_until
    from user_stats s
    join auth.users u on u.id = s.user_id
    left join profiles p on p.id = s.user_id
    where s.is_plus and (s.plus_until is null or s.plus_until > now())
      and not coalesce(p.is_bot, false)
    order by s.plus_until asc nulls last
    limit greatest(coalesce(p_limit, 200), 1);
end; $$;
grant execute on function admin_plus_list(int) to authenticated;

-- ══════════════ D) Məzmun performansı (dərs üzrə tamamlama) ══════════════
create or replace function admin_lesson_stats(p_limit int default 200)
returns table(lesson_id text, title text, subject text, grade int, completions bigint, learners bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select l.id, l.title, subj.name::text, subj.grade,
      count(up.*)::bigint, count(distinct up.user_id)::bigint
    from lessons l
    join units un on un.id = l.unit_id
    join subjects subj on subj.id = un.subject_id
    left join user_progress up on up.lesson_id = l.id
    left join profiles p on p.id = up.user_id and not coalesce(p.is_bot, false)
    group by l.id, l.title, subj.name, subj.grade
    order by count(up.*) desc
    limit greatest(coalesce(p_limit, 200), 1);
end; $$;
grant execute on function admin_lesson_stats(int) to authenticated;

-- ══════════════ Admin idarəetmə (super) — admin siyahısı ══════════════
create or replace function admin_list_admins()
returns table(user_id uuid, email text, name text, role text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select a.user_id, u.email::text, coalesce(p.name, '—'), a.role
    from admins a join auth.users u on u.id = a.user_id
    left join profiles p on p.id = a.user_id
    order by a.role, u.email;
end; $$;
grant execute on function admin_list_admins() to authenticated;
