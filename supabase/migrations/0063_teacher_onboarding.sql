-- ══════════════════════════════════════════════════════════════════════════════
-- MÜƏLLİM QEYDİYYATI: dəvət linki + strukturlu müraciət + bildiriş izləri
-- ------------------------------------------------------------------------------
-- Problem: müəllim olmaq üçün ~20 addım lazım idi — şagird qeydiyyat forması
-- (valideyn nəzarəti!), 12 addımlı şagird onboardingi, "Daha çoxu" menyusunda
-- gizlənmiş Məktəb bölməsi, sərbəst mətnli müraciət, sonra isə heç kimin xəbər
-- tutmadığı gözləmə (admin-ə də, müəllimə də bildiriş getmirdi).
--
-- Həll:
--   1. DƏVƏT LİNKİ — admin link yaradır, müəllim açıb daxil olan kimi təsdiqlənmiş
--      müəllim olur. Təsdiq qapısı aradan qalxmır: təsdiqi admin ƏVVƏLCƏDƏN verir.
--   2. STRUKTURLU MÜRACİƏT — məktəb və fənn ayrıca sahələrdir; admin qərar verəndə
--      provayderi (Google = ünvan sübut olunub) də görür.
--   3. BİLDİRİŞ İZLƏRİ — `notified_at` / `welcomed_at`: məktubu server göndərir,
--      sütun isə eyni məktubun iki dəfə getməsinin qarşısını alır.
--
-- TƏHLÜKƏSİZLİK:
--   • E-poçta bağlı dəvət yalnız həmin ünvanın TƏSDİQLƏNMİŞ OAuth (Google) kimliyi
--     ilə götürülür. `email_confirmed_at` sübut DEYİL — layihədə autoconfirm
--     açıqdır (bax 0062). Əks halda kimsə başqasının ünvanı ilə e-poçt/parol
--     hesabı açıb onun dəvətini götürə bilərdi.
--   • Token 122 bit təsadüfidir (gen_random_uuid); təxmin etmək praktik deyil.
--   • Cədvəllərdə RLS siyasəti YOXDUR — giriş yalnız aşağıdakı RPC-lərdən.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Müraciət: strukturlu sahələr + admin bildirişi izi ────────────────────
alter table teacher_requests add column if not exists school      text;
alter table teacher_requests add column if not exists subject     text;
alter table teacher_requests add column if not exists notified_at timestamptz;

-- ── 2) Müəllim: necə gəldi + "hesabınız hazırdır" məktubu göndərilibmi ───────
alter table teachers add column if not exists via text not null default 'request';
alter table teachers drop constraint if exists teachers_via_check;
alter table teachers add constraint teachers_via_check check (via in ('request', 'invite', 'admin'));
alter table teachers add column if not exists welcomed_at timestamptz;
-- Mövcud müəllimlər onsuz da işləyir — onlara gec "xoş gəldin" məktubu getməsin.
update teachers set welcomed_at = approved_at where welcomed_at is null;

-- ── 3) Müraciət RPC-si: məktəb və fənnlə ─────────────────────────────────────
-- Köhnə imza (yalnız p_note) silinir: eyni adlı iki funksiya olsa PostgREST
-- `{p_note}` çağırışını birmənalı həll edə bilmir. Yeni imzada qalan parametrlər
-- default-ludur, yəni köhnə client çağırışı da işləyir.
drop function if exists request_teacher(text);
create or replace function request_teacher(
  p_note    text default '',
  p_school  text default null,
  p_subject text default null
) returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'auth required'; end if;
  if exists (select 1 from teachers where user_id = me) then return; end if; -- artıq müəllim

  insert into teacher_requests (user_id, note, school, subject, status, created_at,
                                decided_at, decided_by, notified_at)
  values (
    me,
    nullif(left(btrim(coalesce(p_note, '')), 500), ''),
    nullif(left(btrim(coalesce(p_school, '')), 120), ''),
    nullif(left(btrim(coalesce(p_subject, '')), 80), ''),
    'pending', now(), null, null, null
  )
  on conflict (user_id) do update
    set status     = 'pending',
        note       = excluded.note,
        school     = excluded.school,
        subject    = excluded.subject,
        decided_at = null,
        decided_by = null,
        -- Gözləyən müraciəti yeniləmək admin-ə TƏKRAR məktub göndərməməlidir
        -- (əks halda düyməni basıb qutunu doldurmaq olardı). Yalnız rədd
        -- edilmiş müraciətdən sonrakı yeni müraciət yenidən bildirilir.
        created_at  = case when teacher_requests.status = 'pending'
                           then teacher_requests.created_at else now() end,
        notified_at = case when teacher_requests.status = 'pending'
                           then teacher_requests.notified_at else null end;
end; $$;
revoke execute on function request_teacher(text, text, text) from public, anon;
grant execute on function request_teacher(text, text, text) to authenticated;

-- ── 4) Admin siyahıları: yeni sahələrlə (qaytarma tipi dəyişdiyi üçün drop) ──
drop function if exists admin_list_teacher_requests();
create function admin_list_teacher_requests()
returns table(user_id uuid, email text, name text, status text, note text,
              school text, subject text, provider text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select tr.user_id, u.email::text, coalesce(p.name, '—'), tr.status, tr.note,
           tr.school, tr.subject,
           coalesce(u.raw_app_meta_data->>'provider', 'email'),
           tr.created_at
      from teacher_requests tr
      join auth.users u on u.id = tr.user_id
      left join profiles p on p.id = tr.user_id
     where tr.status = 'pending'
     order by tr.created_at asc;
end; $$;
revoke execute on function admin_list_teacher_requests() from public, anon;
grant execute on function admin_list_teacher_requests() to authenticated;

drop function if exists admin_list_teachers();
create function admin_list_teachers()
returns table(user_id uuid, email text, name text, approved_at timestamptz,
              classes bigint, via text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select t.user_id, u.email::text, coalesce(p.name, '—'), t.approved_at,
           (select count(*) from classes c where c.teacher_id = t.user_id),
           t.via
      from teachers t
      join auth.users u on u.id = t.user_id
      left join profiles p on p.id = t.user_id
     order by t.approved_at desc;
end; $$;
revoke execute on function admin_list_teachers() from public, anon;
grant execute on function admin_list_teachers() to authenticated;

-- ── 5) Dəvətlər ──────────────────────────────────────────────────────────────
create table if not exists teacher_invites (
  token      text primary key default replace(gen_random_uuid()::text, '-', ''),
  email      text,          -- doludursa: yalnız bu ünvanın təsdiqlənmiş Google kimliyi
  note       text,          -- admin üçün (kimə verildi) — müəllimə GÖSTƏRİLMİR
  max_uses   int  not null default 1 check (max_uses between 1 and 200),
  uses       int  not null default 0,
  expires_at timestamptz not null default now() + interval '14 days',
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table teacher_invites enable row level security;

create table if not exists teacher_invite_uses (
  token   text not null references teacher_invites(token) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  used_at timestamptz not null default now(),
  primary key (token, user_id)
);
alter table teacher_invite_uses enable row level security;

-- Bu istifadəçinin bu ünvan üçün provayderin (Google) özü təsdiqlədiyi kimliyi varmı?
-- 0062-dəki admin dəvəti ilə EYNİ qayda.
create or replace function _has_verified_oauth_email(p_uid uuid, p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from auth.identities i
     where i.user_id = p_uid
       and i.provider <> 'email'
       and lower(coalesce(i.identity_data->>'email', '')) = lower(p_email)
       and coalesce((i.identity_data->>'email_verified')::boolean, false)
  );
$$;
revoke execute on function _has_verified_oauth_email(uuid, text) from public, anon, authenticated;

-- Admin: dəvət yarat → token qaytarır.
create or replace function admin_create_teacher_invite(
  p_email    text default null,
  p_note     text default null,
  p_max_uses int  default 1,
  p_days     int  default 14
) returns text language plpgsql security definer set search_path = public as $$
declare
  e text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  n int  := least(greatest(coalesce(p_max_uses, 1), 1), 200);
  d int  := least(greatest(coalesce(p_days, 14), 1), 90);
  t text;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if e is not null and position('@' in e) = 0 then raise exception 'düzgün e-poçt deyil'; end if;
  -- Bir ünvana bağlı link çoxistifadəli ola bilməz — mənası yoxdur.
  if e is not null then n := 1; end if;

  insert into teacher_invites (email, note, max_uses, expires_at, created_by)
  values (e, nullif(left(btrim(coalesce(p_note, '')), 200), ''), n,
          now() + make_interval(days => d), auth.uid())
  returning token into t;

  perform log_admin_action('create_teacher_invite', 'email', coalesce(e, '(açıq link)'),
                           'uses=' || n || ' days=' || d);
  return t;
end; $$;
revoke execute on function admin_create_teacher_invite(text, text, int, int) from public, anon;
grant execute on function admin_create_teacher_invite(text, text, int, int) to authenticated;

create or replace function admin_list_teacher_invites()
returns table(token text, email text, note text, max_uses int, uses int,
              expires_at timestamptz, revoked_at timestamptz, created_at timestamptz,
              used_by text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select i.token, i.email, i.note, i.max_uses, i.uses, i.expires_at, i.revoked_at,
           i.created_at,
           (select string_agg(coalesce(nullif(p.name, ''), u.email::text), ', ' order by x.used_at)
              from teacher_invite_uses x
              join auth.users u on u.id = x.user_id
              left join profiles p on p.id = x.user_id
             where x.token = i.token)
      from teacher_invites i
     where i.created_at > now() - interval '120 days'
     order by i.created_at desc
     limit 100;
end; $$;
revoke execute on function admin_list_teacher_invites() from public, anon;
grant execute on function admin_list_teacher_invites() to authenticated;

create or replace function admin_revoke_teacher_invite(p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update teacher_invites set revoked_at = now() where token = p_token and revoked_at is null;
  perform log_admin_action('revoke_teacher_invite', 'invite', left(p_token, 8), null);
end; $$;
revoke execute on function admin_revoke_teacher_invite(text) from public, anon;
grant execute on function admin_revoke_teacher_invite(text) to authenticated;

-- Dəvət səhifəsi (girişsiz də açılır): link etibarlıdırmı, hansı hesabla girmək lazımdır.
-- Admin qeydi (`note`) QƏSDƏN qaytarılmır — o, daxili məlumatdır.
create or replace function teacher_invite_info(p_token text)
returns json language plpgsql stable security definer set search_path = public as $$
declare inv teacher_invites%rowtype; hint text;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then
    return json_build_object('status', 'not_found');
  end if;
  select * into inv from teacher_invites where token = p_token;
  if not found then return json_build_object('status', 'not_found'); end if;

  if inv.email is not null then
    hint := left(split_part(inv.email, '@', 1), 2) || '•••@' || split_part(inv.email, '@', 2);
  end if;

  return json_build_object(
    'status', case
                when inv.revoked_at is not null then 'revoked'
                when inv.expires_at < now()     then 'expired'
                when inv.uses >= inv.max_uses   then 'used_up'
                else 'ok'
              end,
    'email_hint', hint,
    'needs_google', inv.email is not null
  );
end; $$;
revoke execute on function teacher_invite_info(text) from public;
grant execute on function teacher_invite_info(text) to anon, authenticated;

-- Dəvəti götür: giriş etmiş istifadəçi təsdiqlənmiş müəllim olur.
-- Qaytarır: ok | already | not_found | revoked | expired | used_up |
--           email_mismatch | need_google | auth_required
create or replace function claim_teacher_invite(p_token text)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); inv teacher_invites%rowtype; my_email text;
begin
  if me is null then return 'auth_required'; end if;
  if p_token is null or p_token !~ '^[0-9a-f]{32}$' then return 'not_found'; end if;

  -- `for update`: eyni linki iki nəfər eyni anda götürəndə istifadə sayı aşılmasın.
  select * into inv from teacher_invites where token = p_token for update;
  if not found then return 'not_found'; end if;

  -- Artıq müəllimdirsə link istifadə sayını YEMİR (təkrar açılış, yenilənmə).
  if exists (select 1 from teacher_invite_uses where token = p_token and user_id = me)
     or exists (select 1 from teachers where user_id = me) then
    return 'already';
  end if;

  if inv.revoked_at is not null then return 'revoked'; end if;
  if inv.expires_at < now()     then return 'expired'; end if;
  if inv.uses >= inv.max_uses   then return 'used_up'; end if;

  if inv.email is not null then
    select lower(u.email) into my_email from auth.users u where u.id = me;
    if my_email is distinct from inv.email then return 'email_mismatch'; end if;
    if not _has_verified_oauth_email(me, inv.email) then return 'need_google'; end if;
  end if;

  -- welcomed_at = now(): dəvətlə gələn müəllim nəticəni ekranda görür,
  -- ayrıca "hesabınız təsdiqləndi" məktubuna ehtiyac yoxdur.
  insert into teachers (user_id, approved_by, via, welcomed_at)
  values (me, inv.created_by, 'invite', now())
  on conflict (user_id) do nothing;

  insert into teacher_invite_uses (token, user_id) values (p_token, me);
  update teacher_invites set uses = uses + 1 where token = p_token;

  -- Əvvəl adi müraciət göndərmişdisə, admin növbəsində asılı qalmasın.
  update teacher_requests
     set status = 'approved', decided_at = now(), decided_by = inv.created_by
   where user_id = me and status = 'pending';

  return 'ok';
end; $$;
revoke execute on function claim_teacher_invite(text) from public, anon;
grant execute on function claim_teacher_invite(text) to authenticated;

comment on table teacher_invites is
  'Müəllim dəvət linkləri. Link açılıb claim_teacher_invite() çağırılanda istifadəçi təsdiqlənmiş müəllim olur.';
comment on column teacher_requests.notified_at is
  'Admin-ə "yeni müraciət" məktubu göndərilib (server /api/teacher/notify yazır).';
comment on column teachers.welcomed_at is
  'Müəllimə "hesabınız təsdiqləndi" məktubu göndərilib və ya lazım deyil (dəvətlə gəlib).';
