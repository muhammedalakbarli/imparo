-- ══════════════════════════════════════════════════════════════════════════════
-- VALİDEYN HESABATI (parent_reports) — həftəlik e-poçt + oxu-linki
-- ------------------------------------------------------------------------------
-- Niyə: məhsulun istifadəçisi uşaqdır, MÜŞTƏRİSİ isə valideyndir — amma indiyə
-- qədər valideyn üçün məhsulda heç nə yox idi. Valideyn "uşağım nə öyrənir?"
-- sualına cavab ala bilmirdisə, abunəni ikinci ay uzatmaq üçün səbəbi də yox idi.
--
-- Niyə valideyn HESABI yox: ayrıca rol + uşaq-valideyn bağlantısı + dəvət axını
-- + RLS-in yenidən qurulması deməkdir. Bunun əvəzinə valideyn heç nəyə qeydiyyatdan
-- keçmir: uşaq bir dəfə e-poçtu yazır, valideyn təsdiqləyir, sonra həftəlik məktub
-- gəlir. Məktubdakı link tokenlə açılan, YALNIZ OXUNAN səhifədir.
--
-- Üç ayrı token QƏSDƏNDİR:
--   · verify_token — təsdiqlənməmiş ünvana UŞAĞIN datası getməsin (səhv yazılmış
--     ünvan yad adama düşə bilər). Təsdiqdən sonra null olur.
--   · view_token   — hesabat səhifəsini açır.
--   · unsub_token  — imtina. view_token-dan ayrıdır ki, hesabat linki paylaşılsa
--     belə kimsə başqasının abunəsini söndürə bilməsin.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists parent_reports (
  user_id      uuid primary key references profiles(id) on delete cascade,
  email        text not null,
  verify_token text unique,                       -- təsdiqdən sonra null
  verified_at  timestamptz,
  view_token   text not null unique,
  unsub_token  text not null unique,
  last_sent_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists parent_reports_verified_idx
  on parent_reports (verified_at) where verified_at is not null;

-- ── RLS ──────────────────────────────────────────────────────────────────────
-- Şagird yalnız ÖZ sətrini oxuyur. Birbaşa yazı bağlıdır: bütün dəyişikliklər
-- aşağıdakı RPC-lərdən keçir (0037/0044-dəki nümunə) — belə olmasa şagird
-- özünə istənilən token təyin edib başqasının hesabatını aça bilərdi.
alter table parent_reports enable row level security;

drop policy if exists "own parent report read" on parent_reports;
create policy "own parent report read" on parent_reports
  for select using (auth.uid() = user_id);

revoke insert, update, delete on parent_reports from authenticated, anon;

-- ── Token generatoru ─────────────────────────────────────────────────────────
-- İki UUID birləşdirilir → 64 hex simvol, ~244 bit entropiya.
-- gen_random_uuid() PG-nin özündədir, pgcrypto asılılığı yaratmır.
create or replace function new_report_token()
returns text language sql volatile as $$
  select replace(gen_random_uuid()::text, '-', '')
      || replace(gen_random_uuid()::text, '-', '');
$$;

-- Token generatoru yalnız yuxarıdakı funksiyaların daxilində işlədilir.
revoke execute on function new_report_token() from public, anon, authenticated;

-- ── Valideyn e-poçtunu təyin et ──────────────────────────────────────────────
-- Hər çağırışda təsdiq SIFIRLANIR: ünvan dəyişdisə, yeni ünvan da təsdiqlənməlidir.
create or replace function set_parent_email(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  -- Sadə format yoxlaması. Məqsəd mükəmməl RFC uyğunluğu deyil — açıq-aşkar
  -- səhv yazılmış ünvana uşağın datasının getməməsidir.
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' or length(v_email) > 254 then
    raise exception 'invalid email';
  end if;

  insert into parent_reports (user_id, email, verify_token, view_token, unsub_token)
  values (auth.uid(), v_email, new_report_token(), new_report_token(), new_report_token())
  on conflict (user_id) do update
    set email        = excluded.email,
        verify_token = new_report_token(),
        verified_at  = null,
        -- view/unsub tokenləri də YENİLƏNİR: köhnə ünvana getmiş linklər yeni
        -- ünvana keçəndən sonra işləməməlidir.
        view_token   = new_report_token(),
        unsub_token  = new_report_token();
end;
$$;

-- Postgres yeni funksiyaya EXECUTE-u avtomatik PUBLIC-ə verir; authenticated/anon
-- PUBLIC-dən miras alır. Ona görə əvvəlcə PUBLIC-dən alınır, sonra ünvanlı verilir —
-- yalnız "revoke from authenticated" yazsaydıq, icazə PUBLIC üzərindən qalardı.
-- `from public` TƏK BAŞINA KİFAYƏT ETMİR: Supabase `public` sxemi üçün DEFAULT
-- PRIVILEGES qurur və yeni funksiyaya birbaşa anon/authenticated/service_role
-- qrantı düşür. Ona görə anon-dan ayrıca alınır.
revoke execute on function set_parent_email(text) from public, anon;
grant execute on function set_parent_email(text) to authenticated;

create or replace function remove_parent_email()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;
  delete from parent_reports where user_id = auth.uid();
end;
$$;

revoke execute on function remove_parent_email() from public, anon;
grant execute on function remove_parent_email() to authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- HESABAT MƏLUMATI — bütün hesablama Postgres-dədir
-- ------------------------------------------------------------------------------
-- Niyə SQL-də, Worker-də yox: fənn/bölmə adlarını tapmaq üçün `@/lib/content`
-- lazım olardı, o isə bütün seed məzmununu Worker paketinə çəkir və 3 MiB
-- limitini keçirir (bax lib/subjectMeta.ts başlığı). Burada lesson_id → unit →
-- subject bağlantısı onsuz da bazadadır.
--
-- task_attempts.lesson_id-də FK YOXDUR (TS fallback məzmunu) — ona görə LEFT JOIN:
-- bazada tapılmayan dərslər ümumi saylarda qalır, fənn bölgüsündən çıxır.
-- ══════════════════════════════════════════════════════════════════════════════
create or replace function parent_report_data(
  p_user_id uuid,
  p_from    timestamptz,
  p_to      timestamptz
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prev_from timestamptz := p_from - (p_to - p_from);
  v_result    jsonb;
begin
  with att as (
    select a.correct, a.ms_taken, a.created_at, s.name as subject
    from task_attempts a
    left join lessons  l on l.id = a.lesson_id
    left join units    u on u.id = l.unit_id
    left join subjects s on s.id = u.subject_id
    where a.user_id = p_user_id
      and a.created_at >= p_from and a.created_at < p_to
  ),
  prev as (
    select s.name as subject, a.correct
    from task_attempts a
    left join lessons  l on l.id = a.lesson_id
    left join units    u on u.id = l.unit_id
    left join subjects s on s.id = u.subject_id
    where a.user_id = p_user_id
      and a.created_at >= v_prev_from and a.created_at < p_from
  ),
  totals as (
    select
      count(*)::int                                                   as tasks,
      count(*) filter (where correct)::int                            as correct,
      -- ms_taken düşünmə vaxtıdır, sessiya vaxtı deyil — məktubda da məhz
      -- "məşq vaxtı" kimi yazılır ki, valideyn şişirdilmiş rəqəm görməsin.
      (coalesce(sum(greatest(ms_taken, 0)), 0) / 1000)::int            as seconds,
      count(distinct (created_at at time zone 'Asia/Baku')::date)::int as active_days
    from att
  ),
  by_subject as (
    select
      subject,
      count(*)::int                                     as tasks,
      count(*) filter (where correct)::int              as correct,
      round(100.0 * count(*) filter (where correct) / nullif(count(*), 0))::int as pct
    from att
    where subject is not null
    group by subject
  ),
  prev_by_subject as (
    select
      subject,
      count(*)::int as tasks,
      round(100.0 * count(*) filter (where correct) / nullif(count(*), 0))::int as pct
    from prev
    where subject is not null
    group by subject
  ),
  -- İnkişaf yalnız HƏR İKİ həftədə ən azı 5 tapşırıq olan fənlərdə hesablanır:
  -- 1 tapşırıqdan 100%-ə tullanış "ən böyük inkişaf" kimi göstərilsəydi, hesabat
  -- valideynin gözündə dərhal etibarını itirərdi.
  improved as (
    select b.subject, b.pct - p.pct as delta
    from by_subject b
    join prev_by_subject p on p.subject = b.subject
    where b.tasks >= 5 and p.tasks >= 5 and b.pct > p.pct
    order by (b.pct - p.pct) desc
    limit 1
  ),
  -- Çətinlik: ən azı 5 cəhd olan, doğruluğu ən aşağı bölmə — AMMA yalnız
  -- həqiqətən zəifdirsə. Yalnız "ən aşağı"nı götürsək, hər şeyi yaxşı bilən
  -- şagirdin 94%-lik bölməsi "diqqət tələb edir" kimi göstərilərdi; valideyn
  -- bunu bir dəfə görsə hesabata inanmağı dayandırar. 75% ≈ hər 4 sualdan biri səhv.
  weakest as (
    select u.title as unit, round(100.0 * count(*) filter (where a.correct) / count(*))::int as pct
    from task_attempts a
    join lessons l on l.id = a.lesson_id
    join units   u on u.id = l.unit_id
    where a.user_id = p_user_id
      and a.created_at >= p_from and a.created_at < p_to
    group by u.title
    having count(*) >= 5
       and round(100.0 * count(*) filter (where a.correct) / count(*)) < 75
    order by 2 asc
    limit 1
  ),
  lessons_done as (
    select count(*)::int as n
    from user_progress
    where user_id = p_user_id
      and completed_at >= p_from and completed_at < p_to
  )
  select jsonb_build_object(
    'from',           p_from,
    'to',             p_to,
    'child',          (select name from profiles where id = p_user_id),
    'grade',          (select grade from profiles where id = p_user_id),
    'streak',         coalesce((select streak_days from user_stats where user_id = p_user_id), 0),
    'seconds',        coalesce((select seconds from totals), 0),
    'tasks',          coalesce((select tasks from totals), 0),
    'correct',        coalesce((select correct from totals), 0),
    'activeDays',     coalesce((select active_days from totals), 0),
    'lessons',        coalesce((select n from lessons_done), 0),
    'subjects',       coalesce((select jsonb_agg(jsonb_build_object(
                        'name', subject, 'pct', pct, 'tasks', tasks
                      ) order by tasks desc) from by_subject), '[]'::jsonb),
    'improved',       (select jsonb_build_object('subject', subject, 'delta', delta) from improved),
    'weakest',        (select jsonb_build_object('unit', unit, 'pct', pct) from weakest)
  ) into v_result;

  return v_result;
end;
$$;

-- Yalnız service_role çağırır (cron + token ilə açılan hesabat səhifəsi).
-- PUBLIC-dən alınır: `from authenticated, anon` yazmaq KİFAYƏT ETMİR, çünki
-- icazə PUBLIC üzərindən miras qalır. Verilsəydi, istənilən şagird p_user_id-ni
-- dəyişib başqasının hesabatını oxuya bilərdi (funksiya security definer-dir).
revoke execute on function parent_report_data(uuid, timestamptz, timestamptz) from public;
revoke execute on function parent_report_data(uuid, timestamptz, timestamptz) from authenticated, anon;
grant  execute on function parent_report_data(uuid, timestamptz, timestamptz) to service_role;
