-- Imparo — admin paneli üçün: məzmun sxemini tamamla + admin rolu + yazı RLS.
-- Supabase SQL Editor-da işə salınır.
--
-- Niyə: məzmun (fənn/bölmə/dərs/tapşırıq) DB-yə keçir ki, admin paneldən redaktə oluna bilsin.
-- lessons cədvəlində visual/sections yox idi (dərs giriş səhifəsinin qaydaları) — əlavə olunur.

-- 1. Dərs sxemini tamamla (hero illüstrasiya açarı + qayda bölmələri).
alter table lessons add column if not exists visual text;
alter table lessons add column if not exists sections jsonb;

-- 2. Admin cədvəli — AYRI cədvəl (profiles-də DEYİL), çünki istifadəçi öz profiles
--    sətrini yaza bilir → orada is_admin olsaydı özünü admin edərdi (privilege escalation).
--    admins cədvəlində istifadəçi yazı siyasəti YOXDUR → yalnız SQL Editor/service_role yaza bilər.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admins enable row level security;
drop policy if exists "read own admin" on admins;
create policy "read own admin" on admins for select using (auth.uid() = user_id);
-- (insert/update/delete siyasəti yoxdur → istifadəçi özünü admin edə bilmir)

-- 3. Admin yoxlaması (RLS siyasətlərində və client-də istifadə üçün).
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins a where a.user_id = auth.uid());
$$;
grant execute on function is_admin() to authenticated;

-- 4. Content cədvəllərinə admin yazı icazəsi (public read qalır — bax 0002).
--    Yalnız is_admin() olanlar insert/update/delete edə bilər.
do $$
declare tbl text;
begin
  foreach tbl in array array['subjects','units','lessons','tasks'] loop
    execute format('drop policy if exists "admin write %1$s" on %1$s;', tbl);
    execute format(
      'create policy "admin write %1$s" on %1$s for all using (is_admin()) with check (is_admin());',
      tbl
    );
  end loop;
end $$;

-- 5. Öz hesabını admin et — Supabase SQL Editor-da bunu AYRICA işə sal:
--
--    insert into admins (user_id)
--    select id from auth.users where email = 'm.alakbarli2007@gmail.com'
--    on conflict do nothing;
