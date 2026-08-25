-- ══════════════════════════════════════════════════════════════════════════════
-- PİLOT — kohort metadatası və PƏNCƏRƏLİ mənimsəmə
--
-- Sənədlər: docs/pilot/measurement-design.md · docs/pilot/analysis-plan.md
--
-- `my_skill_mastery()` (0047) BÜTÜN cəhdlər üzərində işləyir və dəyişdirilmir —
-- mövcud Bilik Xəritəsi və adaptiv seçim eyni nəticəni verməyə davam edir.
-- Pilot üçün AYRI, pəncərəli variant əlavə olunur: baseline və final ayrıca
-- hesablansın deyə. Düstur eynidir (təzəlik çəkisi + Bayes daralması), yalnız
-- cəhdlər `[from, to)` ilə süzülür.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Kohort ──────────────────────────────────────────────────────────────────
create table if not exists pilot_participants (
  pilot_id            text        not null,
  user_id             uuid        not null references profiles(id) on delete cascade,
  grade               smallint    not null check (grade between 1 and 11),
  enrolled_at         timestamptz not null default now(),
  baseline_started_at timestamptz,
  baseline_done_at    timestamptz,
  final_started_at    timestamptz,
  final_done_at       timestamptz,
  -- Bayraqlar gələcək eksperimentlər üçündür. BU pilotda hamıda true:
  -- müqayisə şagirdin daxilindədir, qruplara bölmə yoxdur.
  adaptive_enabled    boolean     not null default true,
  skill_srs_enabled   boolean     not null default true,
  -- 'active' | 'dropped' | 'completed' — itki ayrıca saxlanılır, silinmir.
  status              text        not null default 'active',
  primary key (pilot_id, user_id)
);

create index if not exists pilot_participants_user_idx on pilot_participants (user_id);

alter table pilot_participants enable row level security;

drop policy if exists pilot_self_read on pilot_participants;
create policy pilot_self_read on pilot_participants
  for select to authenticated
  using (user_id = auth.uid());

-- ── Şagird öz iştirakını oxuyur (app pilot rejimini bununla açır) ───────────
create or replace function my_pilot()
returns table (
  pilot_id          text,
  grade             smallint,
  adaptive_enabled  boolean,
  skill_srs_enabled boolean,
  baseline_done_at  timestamptz,
  final_done_at     timestamptz,
  status            text
)
language sql stable security definer set search_path = public as $$
  select p.pilot_id, p.grade, p.adaptive_enabled, p.skill_srs_enabled,
         p.baseline_done_at, p.final_done_at, p.status
  from pilot_participants p
  where p.user_id = auth.uid() and p.status <> 'dropped'
  limit 1;
$$;

revoke execute on function my_pilot() from public, anon;
grant  execute on function my_pilot() to authenticated;

-- ── Pəncərəli mənimsəmə: ÖZÜ üçün ──────────────────────────────────────────
create or replace function my_skill_mastery_window(p_from timestamptz, p_to timestamptz)
returns table (skill_id text, mastery smallint, attempts int, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  with scored as (
    select sk.skill as skill_id, a.correct, a.created_at,
           exp(-ln(2) * extract(epoch from (p_to - a.created_at)) / (14 * 86400)) as w
    from task_attempts a
    join tasks t on t.id = a.task_id
    cross join lateral jsonb_array_elements_text(t.data -> 'skills') as sk(skill)
    where a.user_id = auth.uid()
      and a.created_at >= p_from
      and a.created_at <  p_to
  )
  select skill_id,
         round(100 * (coalesce(sum(w) filter (where correct), 0) + 1.5) / (sum(w) + 3))::smallint,
         count(*)::int,
         max(created_at)
  from scored
  group by skill_id
$$;

revoke execute on function my_skill_mastery_window(timestamptz, timestamptz) from public, anon;
grant  execute on function my_skill_mastery_window(timestamptz, timestamptz) to authenticated;

-- ── Pəncərəli mənimsəmə: analiz üçün (istənilən şagird) ─────────────────────
-- DİQQƏT: təzəlik çəkisi `p_to`-ya görə hesablanır, `now()`-a görə YOX. Əks halda
-- eyni baseline aylar sonra fərqli rəqəm verərdi və nəticə reproduksiya olunmazdı.
create or replace function pilot_skill_mastery(p_user_id uuid, p_from timestamptz, p_to timestamptz)
returns table (skill_id text, mastery smallint, attempts int, last_seen timestamptz)
language sql stable security definer set search_path = public as $$
  with scored as (
    select sk.skill as skill_id, a.correct, a.created_at,
           exp(-ln(2) * extract(epoch from (p_to - a.created_at)) / (14 * 86400)) as w
    from task_attempts a
    join tasks t on t.id = a.task_id
    cross join lateral jsonb_array_elements_text(t.data -> 'skills') as sk(skill)
    where a.user_id = p_user_id
      and a.created_at >= p_from
      and a.created_at <  p_to
  )
  select skill_id,
         round(100 * (coalesce(sum(w) filter (where correct), 0) + 1.5) / (sum(w) + 3))::smallint,
         count(*)::int,
         max(created_at)
  from scored
  group by skill_id
$$;

revoke execute on function pilot_skill_mastery(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant  execute on function pilot_skill_mastery(uuid, timestamptz, timestamptz) to service_role;

comment on table pilot_participants is 'Pilot kohortu. Bayraqlar gələcək eksperimentlər üçündür; bu pilotda hamıda true.';
comment on function pilot_skill_mastery(uuid, timestamptz, timestamptz) is
  'Pəncərəli mənimsəmə (analiz). Təzəlik çəkisi p_to-ya görədir ki, nəticə reproduksiya olunsun.';
