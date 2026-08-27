-- Imparo Plus — TƏHLÜKƏSİZ premium bayrağı.
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- PROBLEM: əvvəl Plus user_metadata-da idi — istifadəçi özü pulsuz aktivləşdirə bilirdi.
-- HƏLL: bayraq user_stats-da; müştəri (authenticated) bu sütunları DƏYİŞƏ BİLMİR.
-- Yalnız ödəniş webhooku / service_role / SQL (owner) qoya bilər. Oxu get_plus() ilə.

alter table user_stats add column if not exists is_plus boolean not null default false;
alter table user_stats add column if not exists plus_until timestamptz;

-- Müştəri bu sütunları yazmasın (add_user_xp və s. SECURITY DEFINER funksiyalar owner kimi
-- işlədiyi üçün onlara təsir etmir — yalnız birbaşa client update-i bloklanır).
revoke update (is_plus, plus_until) on user_stats from authenticated;
revoke update (is_plus, plus_until) on user_stats from anon;

-- Plus statusunu oxu (vaxtı keçibsə false).
create or replace function get_plus() returns boolean
language sql security definer set search_path = public as $$
  select coalesce(
    (select is_plus and (plus_until is null or plus_until > now())
     from user_stats where user_id = auth.uid()),
    false
  );
$$;
grant execute on function get_plus() to authenticated;

-- ── Admin/ödəniş üçün: Plus ver (yalnız SQL Editor/service_role-dan çağırılır) ──
-- İstifadə: select grant_plus_to('<email>', 12);  (12 ay)
create or replace function grant_plus_to(p_email text, p_months int default 12)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = lower(trim(p_email));
  if uid is null then raise exception 'user not found: %', p_email; end if;
  insert into user_stats (user_id, total_xp, streak_days, last_active_date, streak_freezes)
  values (uid, 0, 0, null, 0) on conflict (user_id) do nothing;
  update user_stats set is_plus = true, plus_until = now() + make_interval(months => p_months)
  where user_id = uid;
end; $$;
-- Bu funksiya authenticated-ə VERİLMİR — yalnız SQL Editor (owner/service_role) işlədə bilər.
revoke all on function grant_plus_to(text, int) from authenticated, anon, public;
