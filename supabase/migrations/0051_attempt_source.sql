-- ══════════════════════════════════════════════════════════════════════════════
-- CƏHDİN MƏNBƏYİ (task_attempts.source)
--
-- Problem: praktikadan gələn hər cəhd `lesson_id = 'practice'` kimi yazılırdı —
-- diaqnostika, adaptiv məşq, SRS təkrarı və sərbəst praktika bir-birindən ayırd
-- edilmirdi. Pilot bitəndən sonra "bu səhv adaptiv məşqdə oldu, yoxsa SRS-də?"
-- sualına cavab verə bilməzdik.
--
-- QAYDA: `source` cəhdin HARADAN yarandığını göstərir, NƏ olduğunu yox.
-- `is_review` ayrı qalır: (source = 'adaptive', is_review = false) və
-- (source = 'srs', is_review = true) iki fərqli məlumatdır.
--
-- Bu, ÖLÇMƏ JURNALININ tamamlanmasıdır, məhsul dəyişikliyi deyil: müdaxilə,
-- baseline/final, randomizasiya və əsas göstərici toxunulmadan qalır.
-- Vaxt seçimi: pilotda hələ 0 iştirakçı var — sxemi dəyişmək üçün yeganə təmiz
-- pəncərə budur. (Bax docs/pilot/report-template.md dəyişiklik jurnalı.)
-- ══════════════════════════════════════════════════════════════════════════════

alter table task_attempts add column if not exists source text;

-- Köhnə sətirlər ayrıca işarələnir: NULL buraxsaq, gələcəkdə eyni qeyri-müəyyənlik
-- qalar ("bilinmir" ilə "yazılmayıb" fərqlənməz).
update task_attempts set source = 'legacy' where source is null;

alter table task_attempts alter column source set default 'legacy';
alter table task_attempts alter column source set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'task_attempts_source_chk') then
    alter table task_attempts add constraint task_attempts_source_chk
      check (source in ('lesson', 'diagnostic', 'adaptive', 'srs', 'free_practice', 'legacy'));
  end if;
end $$;

-- Mənbəyə görə süzmə (exposure hesabı, müdaxilə müqayisəsi).
create index if not exists task_attempts_user_source_idx on task_attempts (user_id, source);

-- ── RPC sütunları ağ siyahı ilə qəbul edir — source əlavə olunur ────────────
create or replace function log_attempts(p_rows jsonb)
returns int
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  today_count int;
  inserted int := 0;
begin
  if me is null or jsonb_typeof(p_rows) <> 'array' then
    return 0;
  end if;

  if exists (select 1 from profiles where id = me and banned_until > now()) then
    return 0;
  end if;

  if jsonb_array_length(p_rows) > 50 then
    return 0;
  end if;

  select count(*) into today_count
  from task_attempts
  where user_id = me and created_at >= date_trunc('day', now());

  if today_count >= 2000 then
    return 0;
  end if;

  insert into task_attempts (user_id, task_id, lesson_id, correct, chosen, ms_taken, attempt_no, is_review, source)
  select me,
         left(r.task_id, 128),
         left(r.lesson_id, 128),
         r.correct,
         left(r.chosen, 200),
         least(greatest(coalesce(r.ms_taken, 0), 0), 600000),
         least(greatest(coalesce(r.attempt_no, 1), 1), 20)::smallint,
         coalesce(r.is_review, false),
         -- Naməlum dəyər gəlsə 'legacy' yazılır: check constraint insert-i
         -- sındırmasın, amma data da yalan olmasın.
         case when r.source in ('lesson','diagnostic','adaptive','srs','free_practice')
              then r.source else 'legacy' end
  from jsonb_to_recordset(p_rows) as r(
    task_id text, lesson_id text, correct boolean,
    chosen text, ms_taken int, attempt_no int, is_review boolean, source text
  )
  where r.task_id is not null and r.lesson_id is not null and r.correct is not null;

  get diagnostics inserted = row_count;
  return inserted;
end; $$;

grant execute on function log_attempts(jsonb) to authenticated;

comment on column task_attempts.source is
  'Cəhdin haradan yarandığı: lesson | diagnostic | adaptive | srs | free_practice | legacy (0051-dən əvvəlki sətirlər).';
