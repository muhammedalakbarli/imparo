-- ══════════════════════════════════════════════════════════════════════════════
-- BACARIQ ÜZRƏ MƏNİMSƏMƏ (skill mastery)
--
-- NİYƏ: `task_attempts` hər cəhdi yazır, amma cəhd yalnız DƏRSƏ bağlıdır. Ona görə
-- indiyə qədər yalnız "Kəsrlər dərsi 67%" demək olurdu. Tapşırıqlar artıq
-- bacarıqlarla etiketlənib (tasks.data->'skills', bax lib/skills.ts) — bu funksiya
-- həmin xam cəhdləri BACARIQ səviyyəsinə proyeksiya edir.
--
-- MODEL (v1 — qəsdən sadə və izah edilə bilən):
--   1. TƏZƏLİK: hər cəhdin çəkisi yaşı ilə azalır, yarımparçalanma 14 gün.
--      Bir ay əvvəlki səhv bugünkü qədər ağır olmamalıdır — şagird irəliləyir.
--   2. AZ DATA QORUMASI: 2-3 cəhdə əsasən "12% mənimsəyib" demək yanlışdır.
--      Bayes daralması ilə nəticə az cəhddə 50%-ə tərəf çəkilir (k = 3 virtual cəhd).
--   3. Çətinlik HƏLƏ NƏZƏRƏ ALINMIR: `tasks`-da çətinlik sahəsi yoxdur, empirik
--      çətinlik (neçə faiz şagird düz cavablayıb) isə az istifadəçidə səs-küylüdür.
--      Data yığılandan sonra əlavə ediləcək.
--
-- Nəticə: 0-100 arası `mastery` + `attempts` (etibarlılıq üçün) + `last_seen` (SRS üçün).
-- ══════════════════════════════════════════════════════════════════════════════

-- Cəhdləri tapşırığa görə tez tapmaq üçün (mastery hər dəfə bunu gəzir).
create index if not exists task_attempts_user_task_idx
  on task_attempts (user_id, task_id);

create or replace function my_skill_mastery()
returns table (
  skill_id  text,
  mastery   smallint,
  attempts  int,
  last_seen timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with scored as (
    select
      sk.skill                                     as skill_id,
      a.correct,
      a.created_at,
      -- Təzəlik çəkisi: 14 gündən sonra yarıya düşür.
      exp(-ln(2) * extract(epoch from (now() - a.created_at)) / (14 * 86400)) as w
    from task_attempts a
    join tasks t on t.id = a.task_id
    cross join lateral jsonb_array_elements_text(t.data -> 'skills') as sk(skill)
    where a.user_id = auth.uid()
  )
  select
    skill_id,
    -- (düzgünlərin çəkisi + k·prior) / (ümumi çəki + k),  k = 3, prior = 0.5
    round(100 * (coalesce(sum(w) filter (where correct), 0) + 1.5) / (sum(w) + 3))::smallint,
    count(*)::int,
    max(created_at)
  from scored
  group by skill_id
$$;

-- Supabase DEFAULT PRIVILEGES yeni funksiyaları `anon`-a da verir — açıq ləğv edilməlidir.
revoke execute on function my_skill_mastery() from public, anon;
grant  execute on function my_skill_mastery() to authenticated;

comment on function my_skill_mastery() is
  'Cari istifadəçinin bacarıq üzrə mənimsəmə səviyyəsi (0-100). Təzəlik çəkisi + Bayes daralması.';
