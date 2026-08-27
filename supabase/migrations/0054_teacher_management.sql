-- ══════════════════════════════════════════════════════════════════════════════
-- MÜƏLLİM PANELİ — idarəetmə boşluqlarının bağlanması
-- ------------------------------------------------------------------------------
-- 0023-də müəllim yalnız YARADA bilirdi: sinif yarat, tapşırıq ver. Heç nə
-- düzəldilə və ya silinə bilmirdi:
--   · səhv adla yaradılan sinif həmişəlik o adla qalırdı;
--   · sinif kodu sızsa (şagirdlər paylaşır) yeniləmək mümkün deyildi;
--   · səhv dərs təyin edilsə tapşırıq silinmirdi — şagirdin siyahısında qalırdı;
--   · sinifdən çıxan/başqa sinfə keçən şagirdi müəllim çıxara bilmirdi
--     (yalnız şagird özü `leave_class` edə bilirdi);
--   · bir şagirdin fərdi mənzərəsi (tapşırıqları, zəif bacarıqları) yox idi —
--     yalnız reyestr sətri.
--
-- Bütün funksiyalar 0023-dəki eyni qaydanı saxlayır: SECURITY DEFINER + funksiya
-- daxilində müəllim-sahiblik yoxlaması.
-- ══════════════════════════════════════════════════════════════════════════════

-- Sahiblik yoxlaması bir yerdə — hər funksiyada təkrarlanan `exists(...)` sorğusu
-- əvəzinə (0023-də 4 dəfə copy-paste olunmuşdu).
create or replace function is_class_teacher(p_class_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from classes c where c.id = p_class_id and c.teacher_id = auth.uid()
  );
$$;
revoke execute on function is_class_teacher(uuid) from public, anon;
grant execute on function is_class_teacher(uuid) to authenticated;

-- ── Sinfin adını dəyiş ────────────────────────────────────────────────────────
create or replace function rename_class(p_class_id uuid, p_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_class_teacher(p_class_id) then raise exception 'not the teacher'; end if;
  update classes
     set name = coalesce(nullif(btrim(p_name), ''), name)
   where id = p_class_id;
end; $$;
revoke execute on function rename_class(uuid, text) from public, anon;
grant execute on function rename_class(uuid, text) to authenticated;

-- ── Sinif kodunu yenilə ───────────────────────────────────────────────────────
-- Kod sızanda (məsələn başqa sinfin şagirdləri qoşulanda) köhnə kod dərhal
-- etibarsız olur; mövcud üzvlər sinifdə qalır.
create or replace function regen_class_code(p_class_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare new_code text;
begin
  if not is_class_teacher(p_class_id) then raise exception 'not the teacher'; end if;
  new_code := gen_class_code();
  update classes set code = new_code where id = p_class_id;
  return new_code;
end; $$;
revoke execute on function regen_class_code(uuid) from public, anon;
grant execute on function regen_class_code(uuid) to authenticated;

-- ── Sinfi sil ─────────────────────────────────────────────────────────────────
-- class_members və assignments `on delete cascade` ilə bağlıdır — şagirdlərin
-- ŞƏXSİ irəliləyişi (user_progress) toxunulmur, yalnız sinif əlaqəsi silinir.
create or replace function delete_class(p_class_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_class_teacher(p_class_id) then raise exception 'not the teacher'; end if;
  delete from classes where id = p_class_id;
end; $$;
revoke execute on function delete_class(uuid) from public, anon;
grant execute on function delete_class(uuid) to authenticated;

-- ── Şagirdi sinifdən çıxar ────────────────────────────────────────────────────
create or replace function remove_student(p_class_id uuid, p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_class_teacher(p_class_id) then raise exception 'not the teacher'; end if;
  delete from class_members where class_id = p_class_id and user_id = p_uid;
end; $$;
revoke execute on function remove_student(uuid, uuid) from public, anon;
grant execute on function remove_student(uuid, uuid) to authenticated;

-- ── Tapşırığı redaktə et / sil ────────────────────────────────────────────────
-- Tapşırıq öz class_id-si ilə sinfə bağlıdır; sahiblik həmin sinif üzərindən
-- yoxlanılır (tapşırıq id-si təsadüfi seçilə bilməz).
create or replace function update_assignment(
  p_id uuid, p_title text default null, p_due date default null, p_min int default null,
  p_clear_due boolean default false
)
returns void language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select class_id into cid from assignments where id = p_id;
  if cid is null then raise exception 'assignment not found'; end if;
  if not is_class_teacher(cid) then raise exception 'not the teacher'; end if;

  update assignments
     set title    = coalesce(nullif(btrim(coalesce(p_title, '')), ''), title),
         -- Son tarixi TƏMİZLƏMƏK ilə "dəyişmə" fərqlənməlidir: hər ikisi NULL
         -- göndərir, ona görə açıq bayraq var.
         due_date = case when p_clear_due then null else coalesce(p_due, due_date) end,
         min_score = coalesce(p_min, min_score)
   where id = p_id;
end; $$;
revoke execute on function update_assignment(uuid, text, date, int, boolean) from public, anon;
grant execute on function update_assignment(uuid, text, date, int, boolean) to authenticated;

create or replace function delete_assignment(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select class_id into cid from assignments where id = p_id;
  if cid is null then return; end if;
  if not is_class_teacher(cid) then raise exception 'not the teacher'; end if;
  delete from assignments where id = p_id;
end; $$;
revoke execute on function delete_assignment(uuid) from public, anon;
grant execute on function delete_assignment(uuid) to authenticated;

-- ── Tapşırığın icra vəziyyəti (kim etdi / kim etmədi) ─────────────────────────
-- Müəllimin ilk sualı budur: "kim hələ etməyib?". Reyestr bunu göstərmirdi.
create or replace function assignment_progress(p_class_id uuid)
returns table(assignment_id uuid, done int, total int)
language plpgsql security definer set search_path = public as $$
begin
  if not is_class_teacher(p_class_id) then return; end if;
  return query
    select a.id,
           (select count(*)::int from class_members m
              join user_progress up on up.user_id = m.user_id and up.lesson_id = a.lesson_id
             where m.class_id = p_class_id),
           (select count(*)::int from class_members m where m.class_id = p_class_id)
      from assignments a
     where a.class_id = p_class_id;
end; $$;
revoke execute on function assignment_progress(uuid) from public, anon;
grant execute on function assignment_progress(uuid) to authenticated;

-- ── Şagirdin fərdi mənzərəsi (müəllim üçün) ───────────────────────────────────
-- Bir JSON obyekt: profil + statistika + tapşırıq-tapşırıq icra + zəif bacarıqlar
-- + son fəaliyyət. Müəllim valideynlə danışanda lazım olan hər şey bir ekranda.
create or replace function class_student_detail(p_class_id uuid, p_uid uuid)
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not is_class_teacher(p_class_id) then return null; end if;
  if not exists (select 1 from class_members m where m.class_id = p_class_id and m.user_id = p_uid) then
    return null;
  end if;

  select json_build_object(
    'user_id', p_uid,
    'name', coalesce(pr.name, 'Şagird'),
    'joined_at', mem.joined_at,
    'total_xp', coalesce(s.total_xp, 0),
    'streak_days', coalesce(s.streak_days, 0),
    'completed', (select count(*) from user_progress up where up.user_id = p_uid),
    'active_seconds', coalesce(s.active_seconds, 0),
    'last_active_date', s.last_active_date,

    -- Sinfin tapşırıqları + bu şagirdin vəziyyəti
    'assignments', (
      select coalesce(json_agg(json_build_object(
               'id', a.id, 'title', a.title, 'lesson_id', a.lesson_id,
               'due_date', a.due_date,
               'done', (up.lesson_id is not null),
               'done_at', up.completed_at,
               'late', (a.due_date is not null and up.completed_at is not null
                        and up.completed_at::date > a.due_date)
             ) order by a.due_date nulls last, a.created_at desc), '[]'::json)
        from assignments a
        left join user_progress up on up.user_id = p_uid and up.lesson_id = a.lesson_id
       where a.class_id = p_class_id
    ),

    -- Zəif bacarıqlar (0047/0048 ilə eyni model: təzəlik çəkisi + Bayes daralması)
    'weak_skills', (
      select coalesce(json_agg(json_build_object(
               'skill_id', q.skill, 'mastery', q.m, 'attempts', q.n
             ) order by q.m asc), '[]'::json)
      from (
        select sk.skill,
               round(100 * (coalesce(sum(w.w) filter (where w.correct), 0) + 1.5) / (sum(w.w) + 3)) as m,
               count(*) as n
        from (
          select a.correct, a.task_id,
                 exp(-ln(2) * extract(epoch from (now() - a.created_at)) / (14 * 86400)) as w
          from task_attempts a where a.user_id = p_uid
        ) w
        join tasks t on t.id = w.task_id
        cross join lateral jsonb_array_elements_text(t.data -> 'skills') as sk(skill)
        group by sk.skill
        having count(*) >= 3
           and round(100 * (coalesce(sum(w.w) filter (where w.correct), 0) + 1.5) / (sum(w.w) + 3)) < 70
        limit 8
      ) q
    ),

    -- Son tamamlanan dərslər (fəaliyyət lenti)
    'recent', (
      select coalesce(json_agg(json_build_object(
               'lesson_id', r.lesson_id, 'title', r.title,
               'subject', r.subject, 'at', r.completed_at
             ) order by r.completed_at desc), '[]'::json)
      from (
        select up.lesson_id, up.completed_at, l.title, subj.name as subject
        from user_progress up
        left join lessons l on l.id = up.lesson_id
        left join units un on un.id = l.unit_id
        left join subjects subj on subj.id = un.subject_id
        where up.user_id = p_uid
        order by up.completed_at desc
        limit 10
      ) r
    )
  ) into result
  from class_members mem
  left join profiles pr on pr.id = p_uid
  left join user_stats s on s.user_id = p_uid
  where mem.class_id = p_class_id and mem.user_id = p_uid;

  return result;
end; $$;
revoke execute on function class_student_detail(uuid, uuid) from public, anon;
grant execute on function class_student_detail(uuid, uuid) to authenticated;

comment on function class_student_detail(uuid, uuid) is
  'Müəllim üçün bir şagirdin tam mənzərəsi: tapşırıqlar, zəif bacarıqlar, son fəaliyyət.';
