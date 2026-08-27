-- ══════════════════════════════════════════════════════════════════════════════
-- TAPŞIRIQ CƏHDLƏRİ (task_attempts) — analitika/ML üçün xam hadisə jurnalı
-- ------------------------------------------------------------------------------
-- Problem: LessonRunner hər tapşırıq üçün düz/səhv nəticəsini HESABLAYIR
-- (gradeTask → result.correct), sonra onu ATIR. Dərs bitəndə `user_progress`-ə
-- cəmi bir sətir düşür: (user_id, lesson_id, score, completed_at). Yəni
-- "bu şagird BU suala səhv cavab verdi" faktı heç yerdə qalmır.
--
-- Bunun ucbatından mümkün OLMAYAN şeylər:
--   · tapşırıq çətinliyinin ölçülməsi (Elo/IRT) və XARAB tapşırıqların tapılması;
--   · SRS-in öyrənilən modelə keçməsi (Half-Life Regression) — indi sabit interval;
--   · dərs içində şagirdin məhz hansı sualda qırıldığının görülməsi;
--   · distraktor analizi (hansı SƏHV variant cəlbedicidir → sual pis yazılıb).
--
-- Bu cədvəl modelin özü deyil — modelin YEMİDİR. Bu gün yazılmağa başlamasa,
-- üç ay sonra da analitika sıfırdan başlayacaq.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists task_attempts (
  id          bigserial primary key,
  user_id     uuid not null references profiles(id) on delete cascade,
  -- task_id/lesson_id-də QƏSDƏN foreign key YOXDUR: məzmun `tasks`/`lessons`
  -- cədvəllərində ola bilər, amma TS fallback-dan da gələ bilər (bax
  -- ContentProvider). FK qoysaq, fallback məzmunun cəhdləri insert zamanı xəta
  -- verər və jurnal səssizcə boş qalardı — yəni düzəltdiyimiz problem qayıdardı.
  task_id     text not null,
  lesson_id   text not null,
  correct     boolean not null,
  -- Seçilən variantın MƏTNİ (indeksi yox!): balance.ts variantları qarışdırdığı
  -- üçün indeks re-seed-dən sonra başqa cavabı göstərir, mətn isə sabit qalır.
  chosen      text,
  ms_taken    int,                                    -- düşünmə müddəti = çətinlik siqnalı
  attempt_no  smallint not null default 1,
  is_review   boolean not null default false,         -- SRS/təkrar mərhələsi, yoxsa ilk baxış
  created_at  timestamptz not null default now()
);

-- Şagird-üzrə zaman xətti (SRS modeli + churn kohortları) və gündəlik limit yoxlaması.
create index if not exists task_attempts_user_time_idx
  on task_attempts (user_id, created_at desc);
-- Tapşırıq-üzrə yığım (Elo/çətinlik, xarab sual axtarışı).
create index if not exists task_attempts_task_idx
  on task_attempts (task_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Bütün istifadəçilər uşaqdır (1-8-ci sinif) — bu davranış datası həssasdır.
-- Şagird YALNIZ öz sətirlərini oxuyur; BİRBAŞA insert bağlıdır (0037-dəki
-- user_progress nümunəsi): yazı yalnız aşağıdakı RPC-dən keçir.
alter table task_attempts enable row level security;

drop policy if exists "own attempts read" on task_attempts;
create policy "own attempts read" on task_attempts
  for select using (auth.uid() = user_id);

drop policy if exists "admin read attempts" on task_attempts;
create policy "admin read attempts" on task_attempts
  for select using (is_admin());

revoke insert, update, delete on task_attempts from authenticated, anon;

-- ── Yazı RPC-si ──────────────────────────────────────────────────────────────
-- Client cəhdləri yaddaşda yığır və PARTİYA ilə göndərir (hər sualda bir şəbəkə
-- sorğusu mobil bağlantıda həm yavaş, həm baha olardı).
--
-- Bu datanı server tam yoxlaya BİLMƏZ (düz/səhv qərarı client-də verilir), ona
-- görə burada məqsəd doğruluq zəmanəti yox, SUİ-İSTİFADƏ HƏDDİdir: user_id
-- məcburi auth.uid()-dir, banlı hesab yaza bilmir, partiya və gündəlik say
-- məhdudlaşır, sahələr kəsilir. Mükafat (XP/zümrüd) bu cədvəldən ASILI DEYİL —
-- onu 0037 ayrıca hesablayır, yəni jurnal şişirdilsə də heç nə qazanılmır.
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

  -- Banlı hesab (0043) heç nə yazmır.
  if exists (select 1 from profiles where id = me and banned_until > now()) then
    return 0;
  end if;

  -- Bir çağırışda ən çoxu 50 sətir (normal dərs ≈ 20).
  if jsonb_array_length(p_rows) > 50 then
    return 0;
  end if;

  -- Gündəlik tavan: real şagird gündə 2000 tapşırıq həll etmir — flood qoruması.
  select count(*) into today_count
  from task_attempts
  where user_id = me and created_at >= date_trunc('day', now());
  if today_count >= 2000 then
    return 0;
  end if;

  insert into task_attempts (user_id, task_id, lesson_id, correct, chosen, ms_taken, attempt_no, is_review)
  select me,
         left(r.task_id, 128),
         left(r.lesson_id, 128),
         r.correct,
         left(r.chosen, 200),
         least(greatest(coalesce(r.ms_taken, 0), 0), 600000),   -- 0..10 dəq
         least(greatest(coalesce(r.attempt_no, 1), 1), 20)::smallint,
         coalesce(r.is_review, false)
  from jsonb_to_recordset(p_rows) as r(
    task_id text, lesson_id text, correct boolean,
    chosen text, ms_taken int, attempt_no int, is_review boolean
  )
  where r.task_id is not null and r.lesson_id is not null and r.correct is not null;

  get diagnostics inserted = row_count;
  return inserted;
end; $$;

grant execute on function log_attempts(jsonb) to authenticated;

-- ── Hazır analitika görünüşü ─────────────────────────────────────────────────
-- security_invoker=true → RLS ÇAĞIRANA görə işləyir: şagird yalnız öz
-- statistikasını, admin isə hamısını görür (yuxarıdakı iki policy).
--
-- İlk praktik faydası: `accuracy` anormal aşağı (məs. < 0.25) və `attempts`
-- kifayət qədər çox olan tapşırıq adətən ÇƏTİN yox, SƏHV YAZILMIŞ tapşırıqdır.
create or replace view task_difficulty
with (security_invoker = true) as
select
  task_id,
  count(*)                                           as attempts,
  count(distinct user_id)                            as users,
  count(*) filter (where correct)                    as correct_count,
  round(avg(case when correct then 1 else 0 end)::numeric, 3) as accuracy,
  round(avg(ms_taken) filter (where ms_taken > 0))    as avg_ms
from task_attempts
group by task_id;

grant select on task_difficulty to authenticated;

-- ── Məxfilik ─────────────────────────────────────────────────────────────────
-- Silmə: user_id → profiles on delete cascade, profiles → auth.users cascade,
-- yəni delete_own_account() (0039) bu sətirləri də avtomatik təmizləyir.
-- İxrac: export_own_data() sahələri ƏL İLƏ sadaladığı üçün yenilənməlidir —
-- əks halda "məlumatlarımı ver" natamam qalar.
create or replace function export_own_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  result jsonb;
begin
  if me is null then
    return jsonb_build_object('error', 'not authenticated');
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'id' from profiles p where p.id = me),
    'stats', (select to_jsonb(s) - 'user_id' from user_stats s where s.user_id = me),
    'completed_lessons', (
      select coalesce(jsonb_agg(jsonb_build_object('lesson_id', up.lesson_id, 'score', up.score, 'completed_at', up.completed_at)), '[]'::jsonb)
      from user_progress up where up.user_id = me
    ),
    'league', (select to_jsonb(l) - 'user_id' from league l where l.user_id = me),
    'leaderboard_history', (
      select coalesce(jsonb_agg(jsonb_build_object('week', lb.week, 'xp', lb.xp)), '[]'::jsonb)
      from leaderboard lb where lb.user_id = me
    ),
    'friends', (
      select coalesce(jsonb_agg(case when f.a = me then f.b else f.a end), '[]'::jsonb)
      from friendships f where f.a = me or f.b = me
    ),
    -- Ən son 10 000 cəhd (tam tarixçə ixracı meqabaytlarla JSON yarada bilər).
    'task_attempts', (
      select coalesce(jsonb_agg(to_jsonb(a) - 'id' - 'user_id' order by a.created_at desc), '[]'::jsonb)
      from (
        select * from task_attempts where user_id = me
        order by created_at desc limit 10000
      ) a
    )
  ) into result;

  return result;
end; $$;

grant execute on function export_own_data() to authenticated;
