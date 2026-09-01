-- ══════════════════════════════════════════════════════════════════════════════
-- DƏRS ULDUZLARI (1–3)
-- ------------------------------------------------------------------------------
-- Yeni path xəritəsində hər dərs kartında üç ulduz göstərilir. Ulduzu "tamamladı"
-- faktından çıxarmaq mənasız olardı (hamı 3 ulduz alardı) — ona görə ulduz
-- HƏMİN DƏRSDƏKİ DƏQİQLİKDƏN hesablanır: `task_attempts` cədvəlindəki düz/yanlış
-- nisbəti. Beləcə ulduz real göstəricidir və şagirdi dərsi təkrarlayıb
-- yaxşılaşdırmağa təşviq edir.
--
-- Cəhd qeydi olmayan (köhnə) tamamlamalarda 1 ulduz verilir — sıfır göstərmək
-- şagirdə "işin sayılmadı" hissi verərdi.
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function my_lesson_stars()
returns table(lesson_id text, stars smallint, accuracy smallint)
language sql stable security definer set search_path = public as $$
  with acc as (
    select a.lesson_id,
           count(*)                                   as total,
           count(*) filter (where a.correct)          as ok
      from task_attempts a
     where a.user_id = auth.uid()
     group by a.lesson_id
  )
  select p.lesson_id,
         case
           when a.total is null or a.total = 0 then 1::smallint
           when a.ok::numeric / a.total >= 0.9 then 3::smallint
           when a.ok::numeric / a.total >= 0.7 then 2::smallint
           else 1::smallint
         end,
         coalesce(round(100.0 * a.ok / nullif(a.total, 0))::smallint, 0)
    from user_progress p
    left join acc a on a.lesson_id = p.lesson_id
   where p.user_id = auth.uid();
$$;
revoke execute on function my_lesson_stars() from public, anon;
grant execute on function my_lesson_stars() to authenticated;

comment on function my_lesson_stars() is
  'Tamamlanmış dərslər üzrə ulduz (1–3) və dəqiqlik faizi — path xəritəsindəki kartlar üçün.';
