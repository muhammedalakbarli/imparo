-- Admin İstifadəçilər — qoşulma vaxtı (saat/dəqiqə), son giriş və platformada keçirilən vaxt.
-- Supabase SQL Editor-da işə salınır. İdempotentdir.

-- Platformada aktiv keçirilən saniyələr (foreground heartbeat ilə toplanır).
alter table user_stats add column if not exists active_seconds bigint not null default 0;

-- Müştəri heartbeat-i: cari istifadəçinin aktiv vaxtını artırır.
-- Sui-istifadədən qorunmaq üçün hər çağırış ən çox 120 saniyə əlavə edə bilər.
create or replace function bump_active_seconds(p_seconds int)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into user_stats (user_id, active_seconds)
  values (uid, least(greatest(coalesce(p_seconds, 0), 0), 120))
  on conflict (user_id) do update
    set active_seconds = user_stats.active_seconds
      + least(greatest(coalesce(p_seconds, 0), 0), 120);
end; $$;
grant execute on function bump_active_seconds(int) to authenticated;

-- ── İstifadəçi cədvəli (botsuz) — qoşulma, SON GİRİŞ və KEÇİRİLƏN VAXT əlavə olundu ──
-- Qaytarılan sütunlar dəyişdiyi üçün əvvəlcə köhnə funksiyanı sil (CREATE OR REPLACE bunu edə bilmir).
drop function if exists admin_users(text, int, int);
create or replace function admin_users(p_search text default '', p_limit int default 100, p_offset int default 0)
returns table(
  user_id uuid, email text, name text, created_at timestamptz,
  total_xp int, streak_days int, last_active_date date,
  gems int, is_plus boolean, completed bigint,
  last_sign_in_at timestamptz, active_seconds bigint
) language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select u.id, u.email::text, coalesce(p.name, '—'), u.created_at,
      coalesce(s.total_xp, 0), coalesce(s.streak_days, 0), s.last_active_date,
      coalesce(s.gems, 0), coalesce(s.is_plus, false),
      (select count(*) from user_progress up where up.user_id = u.id),
      u.last_sign_in_at, coalesce(s.active_seconds, 0)
    from auth.users u
    left join profiles p on p.id = u.id
    left join user_stats s on s.user_id = u.id
    where not coalesce(p.is_bot, false)
      and (p_search = ''
        or u.email ilike '%' || p_search || '%'
        or coalesce(p.name, '') ilike '%' || p_search || '%')
    order by u.created_at desc
    limit greatest(coalesce(p_limit, 100), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end; $$;
grant execute on function admin_users(text, int, int) to authenticated;
