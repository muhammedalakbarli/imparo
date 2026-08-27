-- Admin · İstifadəçi datası — yalnız is_admin() üçün (auth.users + user_stats + profiles).
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
-- auth.users REST-də açıq deyil; SECURITY DEFINER RPC (owner) oxuyur, is_admin() qoruyur.

-- Aqreqat statistika (kartlar üçün).
create or replace function admin_user_stats()
returns table(total bigint, active7 bigint, active30 bigint, plus_count bigint, new7 bigint, total_xp bigint)
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Baku')::date;
begin
  if not is_admin() then return; end if;
  return query select
    (select count(*) from auth.users),
    (select count(*) from user_stats where last_active_date >= today - 7),
    (select count(*) from user_stats where last_active_date >= today - 30),
    (select count(*) from user_stats where is_plus and (plus_until is null or plus_until > now())),
    (select count(*) from auth.users where created_at >= now() - interval '7 days'),
    (select coalesce(sum(us.total_xp), 0) from user_stats us);
end; $$;
grant execute on function admin_user_stats() to authenticated;

-- İstifadəçi cədvəli (axtarış + səhifələmə).
create or replace function admin_users(p_search text default '', p_limit int default 100, p_offset int default 0)
returns table(
  user_id uuid, email text, name text, created_at timestamptz,
  total_xp int, streak_days int, last_active_date date,
  gems int, is_plus boolean, completed bigint
) language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select u.id, u.email::text, coalesce(p.name, '—'), u.created_at,
      coalesce(s.total_xp, 0), coalesce(s.streak_days, 0), s.last_active_date,
      coalesce(s.gems, 0), coalesce(s.is_plus, false),
      (select count(*) from user_progress up where up.user_id = u.id)
    from auth.users u
    left join profiles p on p.id = u.id
    left join user_stats s on s.user_id = u.id
    where p_search = ''
       or u.email ilike '%' || p_search || '%'
       or coalesce(p.name, '') ilike '%' || p_search || '%'
    order by u.created_at desc
    limit greatest(coalesce(p_limit, 100), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end; $$;
grant execute on function admin_users(text, int, int) to authenticated;
