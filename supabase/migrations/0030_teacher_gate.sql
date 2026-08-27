-- Müəllim qapısı (Duolingo for Schools kimi) — hər girişli istifadəçi sinif AÇA BİLMƏZ.
-- Yalnız admin tərəfindən TƏSDİQLƏNMİŞ müəllimlər sinif yarada bilir. İstifadəçi müəllimlik
-- üçün müraciət edir, admin təsdiq/rədd edir. Supabase SQL Editor-da işə salınır. İdempotentdir.

-- ── Təsdiqlənmiş müəllimlər (allow-list) ──
create table if not exists teachers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null
);
alter table teachers enable row level security;
drop policy if exists teachers_read on teachers;
create policy teachers_read on teachers for select using (user_id = auth.uid() or is_admin());

-- Mövcud sinif sahiblərini avtomatik müəllim et (geriyə uyğunluq — girişləri itməsin).
insert into teachers (user_id)
select distinct teacher_id from classes on conflict (user_id) do nothing;

-- Cari istifadəçi təsdiqlənmiş müəllimdirmi?
create or replace function is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from teachers where user_id = auth.uid());
$$;
grant execute on function is_teacher() to authenticated;

-- ── Müəllimlik müraciətləri ──
create table if not exists teacher_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);
alter table teacher_requests enable row level security;
drop policy if exists tr_read on teacher_requests;
create policy tr_read on teacher_requests for select using (user_id = auth.uid() or is_admin());

-- İstifadəçi müəllimlik üçün müraciət edir.
create or replace function request_teacher(p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  if exists (select 1 from teachers where user_id = me) then return; end if; -- artıq müəllim
  insert into teacher_requests (user_id, note, status, created_at, decided_at, decided_by)
  values (me, nullif(trim(p_note), ''), 'pending', now(), null, null)
  on conflict (user_id) do update
    set status = 'pending', note = excluded.note, created_at = now(), decided_at = null, decided_by = null;
end; $$;
grant execute on function request_teacher(text) to authenticated;

-- Cari istifadəçinin müəllimlik statusu (səhifə gizlətmə üçün).
create or replace function my_teacher_status()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'is_teacher', exists (select 1 from teachers where user_id = auth.uid()),
    'request_status', coalesce((select status from teacher_requests where user_id = auth.uid()), 'none')
  );
$$;
grant execute on function my_teacher_status() to authenticated;

-- ── Sinif yarat — YALNIZ təsdiqlənmiş müəllim ──
create or replace function create_class(p_name text, p_subject_slug text, p_grade int)
returns table(id uuid, name text, code text, subject_slug text, grade int)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  if not exists (select 1 from teachers where user_id = me) then
    raise exception 'teacher approval required';
  end if;
  insert into classes(name, code, subject_slug, grade, teacher_id)
  values (coalesce(nullif(trim(p_name), ''), 'Sinif'), gen_class_code(), p_subject_slug, p_grade, me)
  returning classes.id into new_id;
  return query select c.id, c.name, c.code, c.subject_slug, c.grade from classes c where c.id = new_id;
end; $$;
grant execute on function create_class(text, text, int) to authenticated;

-- ── Admin: müraciətlər və müəllimlər ──
create or replace function admin_list_teacher_requests()
returns table(user_id uuid, email text, name text, status text, note text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select tr.user_id, u.email::text, coalesce(p.name, '—'), tr.status, tr.note, tr.created_at
    from teacher_requests tr
    join auth.users u on u.id = tr.user_id
    left join profiles p on p.id = tr.user_id
    where tr.status = 'pending'
    order by tr.created_at asc;
end; $$;
grant execute on function admin_list_teacher_requests() to authenticated;

create or replace function admin_list_teachers()
returns table(user_id uuid, email text, name text, approved_at timestamptz, classes bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select t.user_id, u.email::text, coalesce(p.name, '—'), t.approved_at,
      (select count(*) from classes c where c.teacher_id = t.user_id)
    from teachers t
    join auth.users u on u.id = t.user_id
    left join profiles p on p.id = t.user_id
    order by t.approved_at desc;
end; $$;
grant execute on function admin_list_teachers() to authenticated;

create or replace function admin_approve_teacher(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  insert into teachers (user_id, approved_by) values (p_uid, auth.uid())
    on conflict (user_id) do nothing;
  update teacher_requests set status = 'approved', decided_at = now(), decided_by = auth.uid()
    where user_id = p_uid;
end; $$;
grant execute on function admin_approve_teacher(uuid) to authenticated;

create or replace function admin_reject_teacher(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update teacher_requests set status = 'rejected', decided_at = now(), decided_by = auth.uid()
    where user_id = p_uid;
end; $$;
grant execute on function admin_reject_teacher(uuid) to authenticated;

-- Müəllimliyi geri al (allow-list-dən çıxar). Sinifləri qalır, amma yeni yarada bilməz.
create or replace function admin_revoke_teacher(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  delete from teachers where user_id = p_uid;
  update teacher_requests set status = 'rejected' where user_id = p_uid;
end; $$;
grant execute on function admin_revoke_teacher(uuid) to authenticated;
