-- ══════════════════════════════════════════════════════════════════════════════
-- SİNİF KODU İLƏ E-POÇTSUZ GİRİŞ (müəllimin yaratdığı şagird hesabları)
-- ------------------------------------------------------------------------------
-- Problem: 1–4-cü sinif şagirdinin e-poçtu və Google hesabı yoxdur, qeydiyyatdan
-- keçə bilmir. Pilot məhz bu siniflərdə olacaq.
--
-- Model:
--   • Hər şagird ADİ `auth.users` hesabıdır — ayrıca auth sistemi YOXDUR, ona görə
--     mövcud RLS, XP, seriya, liqa, SRS dəyişmədən işləyir. E-poçt sintetikdir:
--     `s-<ref>-<təsadüfi>@sinif.imparo.internal` (`.internal` rezerv zonadır, heç
--     vaxt real ünvan olmur; göndərmə yolları bu domeni bloklayır — lib/email.ts).
--     Gələcəkdə valideyn real e-poçt bağlayanda hesab itkisiz yenilənir.
--   • Giriş: sinif kodu → ad (yalnız "Aysel M.") → 4 rəqəmli PIN. PIN server
--     tərəfindən yoxlanılır (verify_student_pin), sonra server e-poçt göndərmədən
--     birdəfəlik token ilə sessiya açır (app/api/sinif/login). PIN Supabase parolu
--     DEYİL — parolu təsadüfidir və heç kimə göstərilmir.
--   • PIN müəllimə GÖRÜNÜR (uşaqlar unudacaq — tələb belədir). Ona görə hash deyil;
--     cədvələ birbaşa giriş yoxdur, yalnız sinfin müəllimi RPC ilə oxuyur.
--
-- Brute-force: şagird başına ardıcıl 5 səhv → 5 dəqiqə blok; IP başına saatda 30
-- səhv; IP başına 10 dəqiqədə 60 sinif-siyahısı sorğusu (kod təxmin etməyə qarşı).
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists managed_students (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  class_id        uuid not null references classes(id) on delete cascade,
  ref             text not null unique check (ref ~ '^[A-Z2-9]{6}$'),
  full_name       text not null,
  pin             text not null check (pin ~ '^[0-9]{4}$'),
  failed_attempts int  not null default 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  pin_changed_at  timestamptz not null default now()
);
create index if not exists managed_students_class_idx on managed_students(class_id);
alter table managed_students enable row level security;
-- Siyasət yoxdur: yazı server route-dan (service_role), oxu yalnız aşağıdakı RPC-lərdən.

create table if not exists class_login_events (
  id   bigserial primary key,
  ip   text not null,
  kind text not null check (kind in ('roster', 'pin_fail')),
  at   timestamptz not null default now()
);
create index if not exists class_login_events_ip_idx on class_login_events(ip, kind, at desc);
create index if not exists class_login_events_at_idx on class_login_events(at);
alter table class_login_events enable row level security;

-- Güclü təsadüfi PIN (gen_random_uuid kriptoqrafik mənbədir; random() deyil).
-- Zəif PIN-lər (1111, 1234, 4321...) verilmir — uşaq/kənar şəxs ilk onları yoxlayır.
create or replace function gen_student_pin()
returns text language plpgsql volatile set search_path = public as $$
declare p text;
begin
  loop
    -- 7 hex = 28 bit → həmişə müsbət int (32 bit-də abs(int_min) daşardı).
    p := lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 7))::bit(28)::int) % 10000)::text, 4, '0');
    exit when p !~ '^(\d)\1{3}$'
          and p not in ('0123','1234','2345','3456','4567','5678','6789','3210','4321','5432','6543','7654','8765','9876');
  end loop;
  return p;
end; $$;
revoke execute on function gen_student_pin() from public, anon, authenticated;

-- ── Müəllim: sinfin şagird hesabları (tam ad + PIN yalnız burada) ─────────────
create or replace function class_managed_students(p_class_id uuid)
returns table(user_id uuid, full_name text, ref text, pin text,
              last_login_at timestamptz, locked_until timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not is_class_teacher(p_class_id) then return; end if;
  return query
    select m.user_id, m.full_name, m.ref, m.pin, m.last_login_at,
           case when m.locked_until > now() then m.locked_until end, m.created_at
      from managed_students m
     where m.class_id = p_class_id
     order by m.full_name;
end; $$;
revoke execute on function class_managed_students(uuid) from public, anon;
grant execute on function class_managed_students(uuid) to authenticated;

-- PIN-i yenilə (blok da açılır) → yeni PIN qaytarır.
create or replace function reset_student_pin(p_user_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare cid uuid; np text;
begin
  select class_id into cid from managed_students where user_id = p_user_id;
  if cid is null or not is_class_teacher(cid) then raise exception 'not the teacher'; end if;
  np := gen_student_pin();
  update managed_students
     set pin = np, failed_attempts = 0, locked_until = null, pin_changed_at = now()
   where user_id = p_user_id;
  return np;
end; $$;
revoke execute on function reset_student_pin(uuid) from public, anon;
grant execute on function reset_student_pin(uuid) to authenticated;

-- Şagird hesabını tamamilə sil (irəliləyiş daxil — cascade). Yalnız müəllimin
-- yaratdığı hesablar üçün; özü qeydiyyatdan keçən şagirdə toxunmur.
create or replace function delete_managed_student(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  select class_id into cid from managed_students where user_id = p_user_id;
  if cid is null or not is_class_teacher(cid) then raise exception 'not the teacher'; end if;
  delete from auth.users where id = p_user_id;
end; $$;
revoke execute on function delete_managed_student(uuid) from public, anon;
grant execute on function delete_managed_student(uuid) to authenticated;

-- ── Giriş ekranı: sinif siyahısı (YALNIZ server route çağırır) ─────────────────
-- Ad yalnız public_name() formatında: "Aysel M." (0064). Tam ad girişsiz ekrana çıxmır.
create or replace function class_login_roster(p_code text, p_ip text)
returns json language plpgsql security definer set search_path = public as $$
declare c classes%rowtype; n int; v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if v_code !~ '^[A-Z0-9]{4,8}$' then return json_build_object('status', 'not_found'); end if;

  select count(*) into n from class_login_events
   where ip = coalesce(p_ip, '') and kind = 'roster' and at > now() - interval '10 minutes';
  if n >= 60 then return json_build_object('status', 'rate_limited'); end if;
  insert into class_login_events(ip, kind) values (coalesce(p_ip, ''), 'roster');
  if random() < 0.02 then delete from class_login_events where at < now() - interval '1 day'; end if;

  select * into c from classes where classes.code = v_code;
  if not found then return json_build_object('status', 'not_found'); end if;

  return json_build_object(
    'status', 'ok',
    'class', json_build_object('name', c.name, 'grade', c.grade),
    'students', coalesce((
      select json_agg(json_build_object('ref', m.ref, 'name', public_name(m.full_name)) order by m.full_name)
        from managed_students m where m.class_id = c.id
    ), '[]'::json)
  );
end; $$;
revoke execute on function class_login_roster(text, text) from public, anon, authenticated;
grant execute on function class_login_roster(text, text) to service_role;

-- ── PIN yoxlaması (YALNIZ server route çağırır) ───────────────────────────────
-- Qaytarır: {status: ok, user_id, email} | wrong {remaining} | locked {retry_after}
--           | not_found | ip_limited
create or replace function verify_student_pin(p_code text, p_ref text, p_pin text, p_ip text)
returns json language plpgsql security definer set search_path = public as $$
declare s managed_students%rowtype; ip_fails int; em text;
begin
  select count(*) into ip_fails from class_login_events
   where ip = coalesce(p_ip, '') and kind = 'pin_fail' and at > now() - interval '1 hour';
  if ip_fails >= 30 then return json_build_object('status', 'ip_limited'); end if;

  select m.* into s
    from managed_students m join classes c on c.id = m.class_id
   where c.code = upper(btrim(coalesce(p_code, ''))) and m.ref = upper(btrim(coalesce(p_ref, '')))
   for update of m;
  if not found then
    insert into class_login_events(ip, kind) values (coalesce(p_ip, ''), 'pin_fail');
    return json_build_object('status', 'not_found');
  end if;

  if s.locked_until is not null and s.locked_until > now() then
    return json_build_object('status', 'locked',
      'retry_after', ceil(extract(epoch from s.locked_until - now()))::int);
  end if;

  if p_pin ~ '^[0-9]{4}$' and s.pin = p_pin then
    update managed_students
       set failed_attempts = 0, locked_until = null, last_login_at = now()
     where user_id = s.user_id;
    select email into em from auth.users where id = s.user_id;
    return json_build_object('status', 'ok', 'user_id', s.user_id, 'email', em);
  end if;

  insert into class_login_events(ip, kind) values (coalesce(p_ip, ''), 'pin_fail');
  if s.failed_attempts + 1 >= 5 then
    update managed_students
       set failed_attempts = 0, locked_until = now() + interval '5 minutes'
     where user_id = s.user_id;
    return json_build_object('status', 'locked', 'retry_after', 300);
  end if;
  update managed_students set failed_attempts = failed_attempts + 1 where user_id = s.user_id;
  return json_build_object('status', 'wrong', 'remaining', 5 - (s.failed_attempts + 1));
end; $$;
revoke execute on function verify_student_pin(text, text, text, text) from public, anon, authenticated;
grant execute on function verify_student_pin(text, text, text, text) to service_role;

comment on table managed_students is
  'Müəllimin yaratdığı e-poçtsuz şagird hesabları (sintetik @sinif.imparo.internal). PIN müəllimə görünür; giriş verify_student_pin ilə.';
