-- ══════════════════════════════════════════════════════════════════════════════
-- İstifadəçi detalına ban məlumatı + bot dəyişikliyinin audit jurnalı
-- ------------------------------------------------------------------------------
-- 0043 ban sistemini qurdu, amma admin panelindəki istifadəçi kartı (`admin_user_detail`)
-- ban vəziyyətini GÖRMÜRDÜ — admin kimin banlı olduğunu yalnız ayrıca moderasiya
-- siyahısında görürdü. Kart mükafat/aktivlik ilə yanaşı ban statusunu da qaytarmalıdır
-- ki, əməliyyat qərarı bir ekranda verilsin.
--
-- Funksiya `json` qaytardığı üçün imza dəyişmir → köhnə client-lər sınmır
-- (əlavə açarları sadəcə görməzdən gəlir).
-- ══════════════════════════════════════════════════════════════════════════════

create or replace function admin_user_detail(p_uid uuid)
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if not is_admin() then return null; end if;
  select json_build_object(
    'user_id', u.id,
    'email', u.email,
    'name', coalesce(p.name, '—'),
    'username', p.username,
    'is_bot', coalesce(p.is_bot, false),
    -- ★ YENİ: ban vəziyyəti (0043)
    'banned', (p.banned_until is not null and p.banned_until > now()),
    'banned_until', p.banned_until,
    'ban_reason', p.ban_reason,
    'created_at', u.created_at,
    'last_sign_in_at', u.last_sign_in_at,
    'email_confirmed', (u.email_confirmed_at is not null),
    'provider', coalesce(u.raw_app_meta_data->>'provider', 'email'),
    'total_xp', coalesce(s.total_xp, 0),
    'streak_days', coalesce(s.streak_days, 0),
    'gems', coalesce(s.gems, 0),
    'hearts', coalesce(s.hearts, 0),
    'is_plus', coalesce(s.is_plus, false),
    'plus_until', s.plus_until,
    'active_seconds', coalesce(s.active_seconds, 0),
    'last_active_date', s.last_active_date,
    'completed', (select count(*) from user_progress up where up.user_id = u.id),
    'subjects', (
      select coalesce(json_agg(json_build_object('subject', t.name, 'done', t.done) order by t.done desc), '[]'::json)
      from (
        select subj.name, count(*) as done
        from user_progress up
        join lessons l on l.id = up.lesson_id
        join units un on un.id = l.unit_id
        join subjects subj on subj.id = un.subject_id
        where up.user_id = u.id
        group by subj.name
      ) t
    )
  ) into result
  from auth.users u
  left join profiles p on p.id = u.id
  left join user_stats s on s.user_id = u.id
  where u.id = p_uid;
  return result;
end; $$;
grant execute on function admin_user_detail(uuid) to authenticated;

-- Bot işarəsi də moderasiya əməliyyatıdır — audit jurnalında iz qoymalıdır
-- (0043-dəki ban/plus əməliyyatları artıq qoyur, bu isə 0029-dan bəri sükutla işləyirdi).
create or replace function admin_set_bot(p_uid uuid, p_is_bot boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profiles set is_bot = p_is_bot where id = p_uid;
  perform log_admin_action(
    case when p_is_bot then 'set_bot' else 'unset_bot' end,
    'user', p_uid::text, null
  );
end; $$;
grant execute on function admin_set_bot(uuid, boolean) to authenticated;
