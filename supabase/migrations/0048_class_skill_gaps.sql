-- ══════════════════════════════════════════════════════════════════════════════
-- SİNFİN ZƏİF BACARIQLARI (müəllim üçün)
--
-- NİYƏ ORTALAMA DEYİL: sinif ortalaması yalanı gizlədir. "Kəsrlər 72%" deyəndə
-- müəllim sakitləşir, halbuki 28 şagirddən 11-i həmin mövzuda ilişib qalıb —
-- qalanların yüksək balı ortalamanı yuxarı çəkib. Ona görə əsas göstərici
-- `weak_students`: NEÇƏ ŞAGİRD bu bacarıqda zəifdir. Dərsi ona görə planlaşdırmaq
-- olar.
--
-- Zəiflik həddi şagird səviyyəsindəki ilə eynidir (bax 0047 və lib/mastery.ts):
-- ən azı 3 cəhd və 70%-dən aşağı mənimsəmə.
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function class_skill_gaps(p_class_id uuid)
returns table (
  skill_id      text,
  mastery       smallint,  -- sinif üzrə orta mənimsəmə
  attempts      int,       -- ümumi cəhd sayı
  students      int,       -- bu bacarığı sınamış şagird sayı
  weak_students int        -- bunlardan neçəsi zəifdir
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Yalnız sinfin öz müəllimi görə bilər (class_roster ilə eyni qayda).
  if not exists (select 1 from classes c where c.id = p_class_id and c.teacher_id = auth.uid()) then
    return;
  end if;

  return query
  with scored as (
    select
      m.user_id,
      sk.skill,
      a.correct,
      exp(-ln(2) * extract(epoch from (now() - a.created_at)) / (14 * 86400)) as w
    from class_members m
    join task_attempts a on a.user_id = m.user_id
    join tasks t on t.id = a.task_id
    cross join lateral jsonb_array_elements_text(t.data -> 'skills') as sk(skill)
    where m.class_id = p_class_id
  ),
  per_student as (
    -- Əvvəl HƏR ŞAGİRD üçün ayrıca hesablanır; birbaşa ümumi ortalama alsaq,
    -- çox məşq edən bir şagird bütün sinfin mənzərəsini əyə bilər.
    select
      s.user_id,
      s.skill,
      round(100 * (coalesce(sum(s.w) filter (where s.correct), 0) + 1.5) / (sum(s.w) + 3)) as m,
      count(*) as n
    from scored s
    group by s.user_id, s.skill
  )
  select
    ps.skill::text,
    round(avg(ps.m))::smallint,
    sum(ps.n)::int,
    count(*)::int,
    count(*) filter (where ps.n >= 3 and ps.m < 70)::int
  from per_student ps
  group by ps.skill
  order by count(*) filter (where ps.n >= 3 and ps.m < 70) desc, avg(ps.m) asc;
end;
$$;

revoke execute on function class_skill_gaps(uuid) from public, anon;
grant  execute on function class_skill_gaps(uuid) to authenticated;

comment on function class_skill_gaps(uuid) is
  'Sinfin bacarıq üzrə mənzərəsi. Əsas sütun weak_students — neçə şagird zəifdir.';
