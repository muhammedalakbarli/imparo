-- ══════════════════════════════════════════════════════════════════════════════
-- ADMIN MODERASİYASI — ban, bot geri-çevirmə, sərbəst müddətli Plus
-- ------------------------------------------------------------------------------
-- Problem: admin panelindən istifadəçiləri tam idarə etmək mümkün deyildi —
--   · ban sistemi ÜMUMİYYƏTLƏ yox idi (yalnız hesabı büsbütün silmək olurdu);
--   · bot işarəsi geri qaytarıla bilmirdi (botları görən ayrıca siyahı yox idi);
--   · Plus yalnız TAM AYLARLA verilirdi (`admin_grant_plus(p_months)`), yəni
--     "3 gün sınaq" və ya "45 gün kampaniya" vermək mümkün deyildi.
--
-- Bu migration həmin üç boşluğu bağlayır və banı REAL şəkildə tətbiq edir
-- (yalnız admin panelində yazı kimi qalmır — mükafat RPC-si banlı hesabı kəsir).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Ban sütunları ─────────────────────────────────────────────────────────
-- `banned_until = 'infinity'` → həmişəlik ban. Beləcə hər yerdə tək bir şərt
-- işləyir: `banned_until > now()`. NULL → ban yoxdur.
alter table profiles add column if not exists banned_until timestamptz;
alter table profiles add column if not exists ban_reason text;

create index if not exists profiles_banned_until_idx
  on profiles (banned_until) where banned_until is not null;

-- ── 2) Sütun kilidi ──────────────────────────────────────────────────────────
-- 0024/0025-dəki `is_plus` nümunəsinin EYNİSİ: istifadəçi öz banını REST ilə
-- silə bilməsin. Həm GRANT səviyyəsində, həm də trigger ilə (dərinlik müdafiəsi).
revoke update (banned_until, ban_reason, is_bot) on profiles from authenticated, anon;

create or replace function protect_moderation_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Yalnız birbaşa müştəri rollarını məhdudlaşdırırıq; SECURITY DEFINER RPC-lər
  -- (admin əməliyyatları) funksiya sahibinin rolu ilə işlədiyi üçün keçir.
  if current_user in ('authenticated', 'anon') then
    new.banned_until := old.banned_until;
    new.ban_reason   := old.ban_reason;
    new.is_bot       := old.is_bot;
  end if;
  return new;
end; $$;

drop trigger if exists protect_moderation_columns_trg on profiles;
create trigger protect_moderation_columns_trg
  before update on profiles
  for each row execute function protect_moderation_columns();

-- ── 3) Ban vəziyyəti köməkçiləri ─────────────────────────────────────────────
create or replace function is_banned(p_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = p_uid and banned_until is not null and banned_until > now()
  );
$$;

-- İstifadəçi öz ban vəziyyətini oxuya bilsin (app "hesabın bloklanıb" ekranı üçün).
create or replace function my_ban_status()
returns table(banned boolean, until timestamptz, reason text)
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then
    return query select false, null::timestamptz, null::text;
    return;
  end if;
  return query
    select (p.banned_until is not null and p.banned_until > now()),
           p.banned_until, p.ban_reason
    from profiles p where p.id = me;
end; $$;
grant execute on function my_ban_status() to authenticated;

-- ── 4) Ban / ban qaldırma ────────────────────────────────────────────────────
-- p_days NULL və ya <= 0 → HƏMİŞƏLİK ban ('infinity').
create or replace function admin_ban_user(
  p_uid uuid, p_days int default null, p_reason text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  until_ts timestamptz;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if p_uid = auth.uid() then raise exception 'öz hesabını banlaya bilməzsən'; end if;
  -- Adminləri qorumaq: bir admin digərini banlaya bilməsin (yalnız super-admin).
  if exists (select 1 from admins where user_id = p_uid) and not is_super_admin() then
    raise exception 'admin hesabını yalnız super-admin banlaya bilər';
  end if;

  until_ts := case
    when p_days is null or p_days <= 0 then 'infinity'::timestamptz
    else now() + make_interval(days => p_days)
  end;

  update profiles
     set banned_until = until_ts,
         ban_reason = nullif(btrim(coalesce(p_reason, '')), '')
   where id = p_uid;

  perform log_admin_action(
    'ban_user', 'user', p_uid::text,
    case when until_ts = 'infinity'::timestamptz then 'həmişəlik'
         else p_days || ' gün (bitir: ' || to_char(until_ts, 'YYYY-MM-DD HH24:MI') || ')' end
    || coalesce(' · səbəb: ' || nullif(btrim(coalesce(p_reason, '')), ''), '')
  );
end; $$;
grant execute on function admin_ban_user(uuid, int, text) to authenticated;

create or replace function admin_unban_user(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update profiles set banned_until = null, ban_reason = null where id = p_uid;
  perform log_admin_action('unban_user', 'user', p_uid::text, null);
end; $$;
grant execute on function admin_unban_user(uuid) to authenticated;

-- ── 5) Sərbəst müddətli Plus (GÜN əsaslı) ────────────────────────────────────
-- Mövcud `admin_grant_plus(uuid, int)` ay əsaslıdır və qalır (geriyə uyğunluq).
-- Bu yeni funksiya istənilən gün sayı verir; p_days <= 0 → həmişəlik ('infinity').
-- p_extend = true olsa mövcud abunənin ÜSTÜNƏ əlavə edir (uzadır), əks halda
-- bugündən yenidən hesablayır.
create or replace function admin_grant_plus_days(
  p_uid uuid, p_days int, p_extend boolean default false
)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare
  base_ts timestamptz;
  new_until timestamptz;
begin
  if not is_admin() then raise exception 'not admin'; end if;

  insert into user_stats (user_id) values (p_uid) on conflict (user_id) do nothing;

  if p_days is null or p_days <= 0 then
    new_until := 'infinity'::timestamptz;
  else
    select case
             when p_extend and plus_until is not null and plus_until > now() then plus_until
             else now()
           end
      into base_ts
      from user_stats where user_id = p_uid;
    new_until := coalesce(base_ts, now()) + make_interval(days => p_days);
  end if;

  update user_stats
     set is_plus = true, plus_until = new_until
   where user_id = p_uid;

  perform log_admin_action(
    'grant_plus_days', 'user', p_uid::text,
    case when new_until = 'infinity'::timestamptz then 'həmişəlik'
         else p_days || ' gün' || case when p_extend then ' (uzadıldı)' else '' end
              || ' → ' || to_char(new_until, 'YYYY-MM-DD') end
  );
  return new_until;
end; $$;
grant execute on function admin_grant_plus_days(uuid, int, boolean) to authenticated;

-- ── 6) Moderasiya siyahısı (botlar + banlılar bir sorğuda) ───────────────────
-- Admin panelindəki "Botlar" və "Banlar" bölmələrini bu bəsləyir. `kind` sütunu
-- ilə süzülür ki, iki ayrı RPC saxlamayaq.
create or replace function admin_moderation_list()
returns table(
  user_id uuid, email text, name text, username text,
  is_bot boolean, banned_until timestamptz, ban_reason text,
  is_plus boolean, plus_until timestamptz,
  total_xp int, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select p.id, u.email::text, p.name, p.username,
           coalesce(p.is_bot, false), p.banned_until, p.ban_reason,
           coalesce(s.is_plus, false), s.plus_until,
           coalesce(s.total_xp, 0), p.created_at
      from profiles p
      left join auth.users u on u.id = p.id
      left join user_stats s on s.user_id = p.id
     where coalesce(p.is_bot, false) = true
        or (p.banned_until is not null and p.banned_until > now())
     order by p.created_at desc;
end; $$;
grant execute on function admin_moderation_list() to authenticated;

-- ── 7) BANI REAL TƏTBİQ ET ───────────────────────────────────────────────────
-- Ban yalnız cədvəldə qeyd olaraq qalmamalıdır. `complete_lesson` platformanın
-- əsas mükafat qapısıdır — banlı hesab oradan keçməməlidir. (0042-dəki gövdənin
-- eynisi, əvvəlinə ban yoxlaması əlavə olunub; `coalesce(is_new, false)` tələsi
-- barədə şərh üçün bax 0042.)
create or replace function complete_lesson(p_lesson_id text, p_grant_reward boolean default true)
returns table(xp int, gems int, already_completed boolean)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l_kind text;
  main_count int;
  reward_xp int := 0;
  reward_gems int := 0;
  is_new boolean := false;
  user_is_plus boolean;
begin
  if me is null then
    return query select 0, 0, false;
    return;
  end if;

  -- ★ YENİ: banlı hesab irəliləyiş yaza bilməz.
  if is_banned(me) then
    raise exception 'hesab bloklanıb';
  end if;

  select kind into l_kind from lessons where id = p_lesson_id;
  if l_kind is null then
    return query select 0, 0, false;
    return;
  end if;

  select coalesce(is_plus, false) into user_is_plus from user_stats where user_id = me;

  if l_kind = 'chest' then
    if p_grant_reward then
      reward_gems := 20 * (case when coalesce(user_is_plus, false) then 2 else 1 end);
    end if;
  else
    select count(*) into main_count
    from tasks
    where lesson_id = p_lesson_id
      and coalesce((data->>'bonus')::boolean, false) = false;

    if main_count = 0 then
      return query select 0, 0, false;
      return;
    end if;

    if p_grant_reward then
      reward_xp := least(2 * main_count, 500);
      reward_gems := 5 * (case when coalesce(user_is_plus, false) then 2 else 1 end);
    end if;
  end if;

  insert into user_progress (user_id, lesson_id, score, completed_at)
  values (me, p_lesson_id, reward_xp, now())
  on conflict (user_id, lesson_id) do nothing
  returning true into is_new;

  is_new := coalesce(is_new, false);

  if not is_new then
    reward_xp := 0;
    reward_gems := 0;
  else
    if reward_xp > 0 then
      perform add_user_xp(reward_xp, true);
    end if;
    if reward_gems > 0 then
      perform add_gems(reward_gems);
    end if;
  end if;

  return query select reward_xp, reward_gems, not is_new;
end; $$;
grant execute on function complete_lesson(text, boolean) to authenticated;
