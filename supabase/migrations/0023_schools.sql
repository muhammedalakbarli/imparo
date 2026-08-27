-- Imparo Məktəb — siniflər, üzvlük, tapşırıqlar (müəllim ↔ sinif ↔ şagird).
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- Model: müəllim sinif yaradır → sinif kodu → şagird kodla qoşulur → müəllim tapşırıq
-- təyin edir → şagird tapşırığı görür → müəllim analitikaya baxır.
-- Bütün giriş SECURITY DEFINER RPC-lərlə (icazə funksiya daxilində yoxlanılır); cədvəllərə
-- birbaşa giriş RLS ilə bağlıdır.

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  subject_slug text not null,
  grade int not null,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists class_members (
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  lesson_id text not null,
  title text not null,
  due_date date,
  min_score int not null default 70,
  created_at timestamptz not null default now()
);

alter table classes enable row level security;
alter table class_members enable row level security;
alter table assignments enable row level security;

-- ── Təsadüfi unikal sinif kodu (6 simvol) ──
create or replace function gen_class_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from classes where code = c);
  end loop;
  return c;
end; $$;

-- ── Sinif yarat (müəllim) ──
create or replace function create_class(p_name text, p_subject_slug text, p_grade int)
returns table(id uuid, name text, code text, subject_slug text, grade int)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  insert into classes(name, code, subject_slug, grade, teacher_id)
  values (coalesce(nullif(trim(p_name), ''), 'Sinif'), gen_class_code(), p_subject_slug, p_grade, me)
  returning classes.id into new_id;
  return query select c.id, c.name, c.code, c.subject_slug, c.grade from classes c where c.id = new_id;
end; $$;
grant execute on function create_class(text, text, int) to authenticated;

-- ── Kodla qoşul (şagird) ──
create or replace function join_class(p_code text)
returns table(id uuid, name text, subject_slug text, grade int)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cid uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  select c.id into cid from classes c where c.code = upper(trim(p_code));
  if cid is null then return; end if;
  insert into class_members(class_id, user_id) values (cid, me) on conflict do nothing;
  return query select c.id, c.name, c.subject_slug, c.grade from classes c where c.id = cid;
end; $$;
grant execute on function join_class(text) to authenticated;

-- ── Müəllimin sinifləri (şagird sayı ilə) ──
create or replace function teacher_classes()
returns table(id uuid, name text, code text, subject_slug text, grade int, student_count bigint)
language sql security definer set search_path = public as $$
  select c.id, c.name, c.code, c.subject_slug, c.grade,
    (select count(*) from class_members m where m.class_id = c.id)
  from classes c where c.teacher_id = auth.uid()
  order by c.created_at desc;
$$;
grant execute on function teacher_classes() to authenticated;

-- ── Şagirdin sinifləri ──
create or replace function student_classes()
returns table(id uuid, name text, subject_slug text, grade int, teacher text)
language sql security definer set search_path = public as $$
  select c.id, c.name, c.subject_slug, c.grade,
    coalesce((select p.name from profiles p where p.id = c.teacher_id), 'Müəllim')
  from classes c
  join class_members m on m.class_id = c.id
  where m.user_id = auth.uid()
  order by c.name;
$$;
grant execute on function student_classes() to authenticated;

-- ── Sinif reyestri + analitika (yalnız müəllim) ──
create or replace function class_roster(p_class_id uuid)
returns table(user_id uuid, name text, total_xp int, streak_days int, completed bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from classes c where c.id = p_class_id and c.teacher_id = auth.uid()) then
    return;
  end if;
  return query
    select m.user_id,
      coalesce(p.name, 'Şagird'),
      coalesce(s.total_xp, 0),
      coalesce(s.streak_days, 0),
      (select count(*) from user_progress up where up.user_id = m.user_id)
    from class_members m
    left join profiles p on p.id = m.user_id
    left join user_stats s on s.user_id = m.user_id
    where m.class_id = p_class_id
    order by coalesce(s.total_xp, 0) desc;
end; $$;
grant execute on function class_roster(uuid) to authenticated;

-- ── Tapşırıq təyin et (yalnız müəllim) ──
create or replace function assign_lesson(p_class_id uuid, p_lesson_id text, p_title text, p_due date, p_min int)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if not exists (select 1 from classes c where c.id = p_class_id and c.teacher_id = me) then
    raise exception 'not the teacher';
  end if;
  insert into assignments(class_id, lesson_id, title, due_date, min_score)
  values (p_class_id, p_lesson_id, coalesce(nullif(trim(p_title), ''), 'Tapşırıq'), p_due, coalesce(p_min, 70))
  returning id into new_id;
  return new_id;
end; $$;
grant execute on function assign_lesson(uuid, text, text, date, int) to authenticated;

-- ── Sinfin tapşırıqları (müəllim və ya üzv) ──
create or replace function class_assignments(p_class_id uuid)
returns table(id uuid, lesson_id text, title text, due_date date, min_score int, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from classes c where c.id = p_class_id and c.teacher_id = auth.uid()
    union all
    select 1 from class_members m where m.class_id = p_class_id and m.user_id = auth.uid()
  ) then return; end if;
  return query select a.id, a.lesson_id, a.title, a.due_date, a.min_score, a.created_at
    from assignments a where a.class_id = p_class_id order by a.created_at desc;
end; $$;
grant execute on function class_assignments(uuid) to authenticated;

-- ── Şagirdin tapşırıqları (bütün siniflərdən, tamamlanma statusu ilə) ──
create or replace function my_assignments()
returns table(id uuid, class_name text, subject_slug text, lesson_id text, title text, due_date date, done boolean)
language sql security definer set search_path = public as $$
  select a.id, c.name, c.subject_slug, a.lesson_id, a.title, a.due_date,
    exists(select 1 from user_progress up where up.user_id = auth.uid() and up.lesson_id = a.lesson_id)
  from assignments a
  join classes c on c.id = a.class_id
  join class_members m on m.class_id = c.id and m.user_id = auth.uid()
  order by a.due_date nulls last, a.created_at desc;
$$;
grant execute on function my_assignments() to authenticated;

-- ── Sinifdən çıx (şagird) / tapşırığı sil (müəllim) — köməkçi ──
create or replace function leave_class(p_class_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from class_members where class_id = p_class_id and user_id = auth.uid();
end; $$;
grant execute on function leave_class(uuid) to authenticated;
