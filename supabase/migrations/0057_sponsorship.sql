-- ══════════════════════════════════════════════════════════════════════════════
-- SPONSORLUQ VƏ BURS — "əlavə ödə, ehtiyacı olan pulsuz oxusun"
-- ------------------------------------------------------------------------------
-- MODEL (yer əsaslı, şəffaf):
--   sponsor ödəyir → havuza YER düşür → ehtiyacı olan şagird müraciət edir →
--   admin təsdiqləyir → havuzdan bir yer sərf olunur və şagirdə pulsuz Plus verilir.
--
-- Niyə "yer" (seat), sadəcə pul deyil: valideyn/sponsor "50 manatım hara getdi?"
-- sualına cavab istəyir. Yer sayı bu sualın cavabıdır və `sponsor_stats()` ilə
-- ictimai göstərilir. Rəqəm görünmürsə model işləmir.
--
-- Bursun verilməsi YENİ mexanizm yaratmır — 0043-dəki `admin_grant_plus_days`
-- çağırılır. Beləcə Plus-un verilməsi bir yerdə qalır (audit da oradadır).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Sponsorluqlar ─────────────────────────────────────────────────────────
-- Sətir YALNIZ ödəniş webhook-undan (service_role) yazılır; müştəri yaza bilməz.
create table if not exists sponsorships (
  id           uuid primary key default gen_random_uuid(),
  sponsor_id   uuid references auth.users(id) on delete set null,
  seats        int not null check (seats > 0),
  amount_cents int not null default 0,
  currency     text not null default 'AZN',
  note         text,
  anonymous    boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table sponsorships enable row level security;
-- Siyasət qoyulmur: birbaşa REST girişi yoxdur, hər şey RPC-lərdən gedir.

-- ── 2) Burs müraciətləri ─────────────────────────────────────────────────────
create table if not exists scholarships (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  reason      text,
  endorsed_by uuid references auth.users(id) on delete set null,  -- zəmanət verən müəllim
  created_at  timestamptz not null default now(),
  decided_at  timestamptz,
  decided_by  uuid references auth.users(id) on delete set null,
  plus_days   int
);
alter table scholarships enable row level security;

create index if not exists scholarships_status_idx on scholarships (status, created_at);

-- ── 3) Havuz və ictimai statistika ───────────────────────────────────────────
-- `available` mənfi ola bilməz: admin havuzdan artıq burs verə bilər (məsələn
-- kampaniya), amma UI-da mənfi rəqəm göstərmək mənasızdır.
create or replace function sponsor_pool()
returns table(funded int, used int, available int)
language sql stable security definer set search_path = public as $$
  select f.n, u.n, greatest(f.n - u.n, 0)
  from (select coalesce(sum(seats), 0)::int as n from sponsorships) f,
       (select count(*)::int as n from scholarships where status = 'approved') u;
$$;
revoke execute on function sponsor_pool() from public;
grant execute on function sponsor_pool() to authenticated, anon;

-- İctimai səhifə üçün — YALNIZ aqreqat, heç bir şəxsi məlumat yoxdur.
create or replace function sponsor_stats()
returns table(sponsors int, seats_funded int, students_helped int, seats_available int)
language sql stable security definer set search_path = public as $$
  select
    (select count(distinct coalesce(sponsor_id::text, id::text))::int from sponsorships),
    (select coalesce(sum(seats), 0)::int from sponsorships),
    (select count(*)::int from scholarships where status = 'approved'),
    (select available from sponsor_pool());
$$;
revoke execute on function sponsor_stats() from public;
grant execute on function sponsor_stats() to authenticated, anon;

-- ── 4) Şagird müraciəti ──────────────────────────────────────────────────────
-- Təkrar müraciət: mövcud sətir yenilənir (yeni sətir yaranmır) — beləcə növbə
-- spam-la doldurula bilmir. Rədd edilibsə yenidən müraciət etmək mümkündür.
create or replace function request_scholarship(p_reason text default null)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cur text;
begin
  if me is null then raise exception 'auth required'; end if;

  select status into cur from scholarships where user_id = me;
  if cur = 'pending' then return 'pending'; end if;
  if cur = 'approved' then return 'approved'; end if;

  insert into scholarships (user_id, reason, status)
  values (me, nullif(btrim(coalesce(p_reason, '')), ''), 'pending')
  on conflict (user_id) do update
    set status = 'pending',
        reason = excluded.reason,
        created_at = now(),
        decided_at = null,
        decided_by = null;

  return 'pending';
end; $$;
revoke execute on function request_scholarship(text) from public, anon;
grant execute on function request_scholarship(text) to authenticated;

create or replace function my_scholarship()
returns table(status text, reason text, created_at timestamptz, plus_days int)
language sql stable security definer set search_path = public as $$
  select s.status, s.reason, s.created_at, s.plus_days
  from scholarships s where s.user_id = auth.uid();
$$;
revoke execute on function my_scholarship() from public, anon;
grant execute on function my_scholarship() to authenticated;

-- ── 5) Müəllim zəmanəti ──────────────────────────────────────────────────────
-- Ehtiyacı ən yaxşı bilən müəllimdir. Zəmanət avtomatik Plus VERMİR — yalnız
-- müraciəti yaradır/işarələyir və admin növbəsində yuxarı çıxarır.
create or replace function teacher_endorse_student(p_class_id uuid, p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_class_teacher(p_class_id) then raise exception 'not the teacher'; end if;
  if not exists (select 1 from class_members m where m.class_id = p_class_id and m.user_id = p_uid) then
    raise exception 'not a class member';
  end if;

  insert into scholarships (user_id, status, endorsed_by, reason)
  values (p_uid, 'pending', auth.uid(), 'Müəllim zəmanəti')
  on conflict (user_id) do update
    set endorsed_by = auth.uid(),
        status = case when scholarships.status = 'approved' then 'approved' else 'pending' end;
end; $$;
revoke execute on function teacher_endorse_student(uuid, uuid) from public, anon;
grant execute on function teacher_endorse_student(uuid, uuid) to authenticated;

-- ── 6) Admin: növbə və qərar ─────────────────────────────────────────────────
create or replace function admin_scholarship_list()
returns table(
  user_id uuid, email text, name text, status text, reason text,
  endorser_email text, created_at timestamptz, is_plus boolean, plus_until timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select s.user_id, u.email::text, coalesce(p.name, '—'), s.status, s.reason,
           e.email::text, s.created_at,
           coalesce(st.is_plus, false), st.plus_until
      from scholarships s
      left join auth.users u on u.id = s.user_id
      left join profiles p on p.id = s.user_id
      left join auth.users e on e.id = s.endorsed_by
      left join user_stats st on st.user_id = s.user_id
     order by (s.status = 'pending') desc, (s.endorsed_by is not null) desc, s.created_at;
end; $$;
revoke execute on function admin_scholarship_list() from public, anon;
grant execute on function admin_scholarship_list() to authenticated;

-- Təsdiq → mövcud `admin_grant_plus_days` (0043) çağırılır: Plus verilməsi
-- məntiqi TƏKRARLANMIR və audit jurnalı onsuz da orada yazılır.
create or replace function admin_decide_scholarship(
  p_uid uuid, p_approve boolean, p_days int default 365
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if not exists (select 1 from scholarships where user_id = p_uid) then
    raise exception 'müraciət tapılmadı';
  end if;

  update scholarships
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_at = now(),
         decided_by = auth.uid(),
         plus_days = case when p_approve then greatest(coalesce(p_days, 365), 1) else null end
   where user_id = p_uid;

  if p_approve then
    perform admin_grant_plus_days(p_uid, greatest(coalesce(p_days, 365), 1), false);
  end if;

  perform log_admin_action(
    case when p_approve then 'grant_scholarship' else 'reject_scholarship' end,
    'user', p_uid::text,
    case when p_approve then greatest(coalesce(p_days, 365), 1) || ' gün' else null end
  );
end; $$;
revoke execute on function admin_decide_scholarship(uuid, boolean, int) from public, anon;
grant execute on function admin_decide_scholarship(uuid, boolean, int) to authenticated;

-- ── 7) Ödəniş tərəfi (webhook, service_role) ─────────────────────────────────
-- `authenticated` üçün icazə QƏSDƏN verilmir: sponsorluq yalnız real ödənişdən
-- sonra yazıla bilər, əks halda hər kəs havuzu şişirdə bilərdi.
create or replace function record_sponsorship(
  p_uid uuid, p_seats int, p_amount_cents int default 0,
  p_currency text default 'AZN', p_note text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into sponsorships (sponsor_id, seats, amount_cents, currency, note)
  values (p_uid, greatest(coalesce(p_seats, 1), 1), coalesce(p_amount_cents, 0),
          coalesce(nullif(btrim(coalesce(p_currency, '')), ''), 'AZN'),
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into new_id;
  return new_id;
end; $$;
revoke execute on function record_sponsorship(uuid, int, int, text, text) from public, anon, authenticated;

-- Sponsorun öz töhfəsi (profil/təşəkkür üçün).
create or replace function my_sponsorship()
returns table(seats int, amount_cents int, currency text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select coalesce(sum(s.seats), 0)::int, coalesce(sum(s.amount_cents), 0)::int,
         coalesce(max(s.currency), 'AZN'), max(s.created_at)
  from sponsorships s where s.sponsor_id = auth.uid();
$$;
revoke execute on function my_sponsorship() from public, anon;
grant execute on function my_sponsorship() to authenticated;

comment on table sponsorships is
  'Ödənişli sponsorluq: hər sətir havuza `seats` qədər pulsuz yer əlavə edir. Yalnız webhook (service_role) yazır.';
comment on table scholarships is
  'Ehtiyac əsaslı burs müraciətləri. Təsdiq admin_grant_plus_days ilə pulsuz Plus verir.';
