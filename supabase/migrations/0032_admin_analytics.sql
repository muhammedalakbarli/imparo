-- Admin analitika — gün-gün seriya (aralıq + müqayisə), retensiya proksisi, saatlıq aktivlik.
-- Supabase SQL Editor-da işə salınır. İdempotentdir. Botlar (profiles.is_bot) xaric.

-- ══ Gün-gün seriya — 2×p_days sətir (cari + əvvəlki dövr müqayisəsi üçün) ══
create or replace function admin_daily_series(p_days int default 14)
returns table(d date, signups bigint, active bigint, completions bigint)
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Baku')::date; n int := greatest(coalesce(p_days, 14), 1);
begin
  if not is_admin() then return; end if;
  return query
    select gs::date,
      (select count(*) from auth.users u left join profiles p on p.id = u.id
        where not coalesce(p.is_bot, false) and (u.created_at at time zone 'Asia/Baku')::date = gs::date),
      (select count(*) from user_stats s left join profiles p on p.id = s.user_id
        where not coalesce(p.is_bot, false) and s.last_active_date = gs::date),
      (select count(*) from user_progress up left join profiles p on p.id = up.user_id
        where not coalesce(p.is_bot, false) and (up.completed_at at time zone 'Asia/Baku')::date = gs::date)
    from generate_series(today - (2 * n - 1), today, interval '1 day') gs
    order by gs;
end; $$;
grant execute on function admin_daily_series(int) to authenticated;

-- ══ Retensiya proksisi — qeydiyyatdan N gün sonra ən azı bir dəfə aktiv olanlar ══
-- Qeyd: tam gündəlik tarixçə saxlanmadığı üçün bu, last_active_date ≥ created+N proksisidir
-- (əsl kohort D1/D7/D30 deyil — istifadəçi-üzlü etiket "proksi" olmalıdır).
create or replace function admin_retention()
returns json language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Baku')::date; result json;
begin
  if not is_admin() then return null; end if;
  with base as (
    select (u.created_at at time zone 'Asia/Baku')::date as reg, s.last_active_date as la
    from auth.users u left join profiles p on p.id = u.id left join user_stats s on s.user_id = u.id
    where not coalesce(p.is_bot, false)
  )
  select json_build_object(
    'd1_den',  (select count(*) from base where reg <= today - 1),
    'd1_num',  (select count(*) from base where reg <= today - 1  and la >= reg + 1),
    'd7_den',  (select count(*) from base where reg <= today - 7),
    'd7_num',  (select count(*) from base where reg <= today - 7  and la >= reg + 7),
    'd30_den', (select count(*) from base where reg <= today - 30),
    'd30_num', (select count(*) from base where reg <= today - 30 and la >= reg + 30)
  ) into result;
  return result;
end; $$;
grant execute on function admin_retention() to authenticated;

-- ══ Saatlıq aktivlik — son girişin saat üzrə paylanması (last_sign_in_at, Bakı vaxtı) ══
create or replace function admin_hourly_activity()
returns table(hour int, cnt bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select extract(hour from (u.last_sign_in_at at time zone 'Asia/Baku'))::int, count(*)::bigint
    from auth.users u left join profiles p on p.id = u.id
    where not coalesce(p.is_bot, false) and u.last_sign_in_at is not null
    group by 1 order by 1;
end; $$;
grant execute on function admin_hourly_activity() to authenticated;
