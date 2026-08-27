-- ══════════════════════════════════════════════════════════════════════════════
-- VALİDEYN HESABATI ÜÇÜN ZƏİF BACARIQ
--
-- 0046-dakı `parent_report_data` zəifliyi BÖLMƏ səviyyəsində verir: "Kəsrlər 67%".
-- Valideyn üçün bu az faydalıdır — uşağa necə kömək edəcəyini bilmir. Bacarıq
-- səviyyəsi konkretdir: "ortaq məxrəcə gətirmə 41%".
--
-- NİYƏ AYRI FUNKSİYA: `parent_report_data` uzundur və işləyir. Onu bütöv yenidən
-- yazmaq (create or replace tam gövdə tələb edir) səhv riski gətirir. Bu funksiya
-- yanında çağırılır, nəticə TS tərəfdə birləşdirilir.
--
-- Bacarığın ADI qaytarılmır, yalnız ID: adlar `lib/skills.ts`-dədir və dəyişə
-- bilər; ID isə sabitdir. Tərcümə/başlıq app tərəfin işidir.
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function parent_weak_skill(
  p_user_id uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object('skillId', skill_id, 'pct', pct)
  from (
    select
      sk.skill as skill_id,
      round(100.0 * count(*) filter (where a.correct) / count(*))::int as pct
    from task_attempts a
    join tasks t on t.id = a.task_id
    cross join lateral jsonb_array_elements_text(t.data -> 'skills') as sk(skill)
    where a.user_id = p_user_id
      and a.created_at >= p_from
      and a.created_at < p_to
    group by sk.skill
    -- 0046-dakı ilə eyni hədd: ən azı 5 cəhd və 75%-dən aşağı. Yalnız "ən aşağı"nı
    -- götürsək, hər şeyi bilən şagirdin 94%-lik bacarığı "zəif" kimi göstərilərdi.
    having count(*) >= 5
       and round(100.0 * count(*) filter (where a.correct) / count(*)) < 75
    order by 2 asc
    limit 1
  ) q;
$$;

revoke execute on function parent_weak_skill(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant  execute on function parent_weak_skill(uuid, timestamptz, timestamptz) to service_role;

comment on function parent_weak_skill(uuid, timestamptz, timestamptz) is
  'Valideyn hesabatı üçün ən zəif BACARIQ (id + faiz). Yalnız service_role.';
