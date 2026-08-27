-- Admin İstifadəçilər — bot/test hesablarını gizlət (yalnız real istifadəçilər görünsün).
-- Supabase SQL Editor-da işə salınır. İdempotentdir. (0026-nı əvəz edir — özü tamdır.)

-- Bot/test işarəsi.
alter table profiles add column if not exists is_bot boolean not null default false;

-- Platformanın köhnə placeholder domeni (@bilik.az) — real end-user deyil, gizlət.
update profiles set is_bot = true
where id in (select id from auth.users where email ilike '%@bilik.az');

-- ── Aqreqat statistika (botsuz) ──
create or replace function admin_user_stats()
returns table(total bigint, active7 bigint, active30 bigint, plus_count bigint, new7 bigint, total_xp bigint)
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Baku')::date;
begin
  if not is_admin() then return; end if;
  return query select
    (select count(*) from auth.users u left join profiles p on p.id = u.id
      where not coalesce(p.is_bot, false)),
    (select count(*) from user_stats s left join profiles p on p.id = s.user_id
      where s.last_active_date >= today - 7 and not coalesce(p.is_bot, false)),
    (select count(*) from user_stats s left join profiles p on p.id = s.user_id
      where s.last_active_date >= today - 30 and not coalesce(p.is_bot, false)),
    (select count(*) from user_stats s left join profiles p on p.id = s.user_id
      where s.is_plus and (s.plus_until is null or s.plus_until > now()) and not coalesce(p.is_bot, false)),
    (select count(*) from auth.users u left join profiles p on p.id = u.id
      where u.created_at >= now() - interval '7 days' and not coalesce(p.is_bot, false)),
    (select coalesce(sum(s.total_xp), 0) from user_stats s left join profiles p on p.id = s.user_id
      where not coalesce(p.is_bot, false));
end; $$;
grant execute on function admin_user_stats() to authenticated;

-- ── İstifadəçi cədvəli (botsuz) ──
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
    where not coalesce(p.is_bot, false)
      and (p_search = ''
        or u.email ilike '%' || p_search || '%'
        or coalesce(p.name, '') ilike '%' || p_search || '%')
    order by u.created_at desc
    limit greatest(coalesce(p_limit, 100), 1)
    offset greatest(coalesce(p_offset, 0), 0);
end; $$;
grant execute on function admin_users(text, int, int) to authenticated;
