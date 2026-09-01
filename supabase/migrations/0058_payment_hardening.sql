-- ══════════════════════════════════════════════════════════════════════════════
-- ÖDƏNİŞ İNTEQRASİYASININ SƏRTLƏŞDİRİLMƏSİ
-- ------------------------------------------------------------------------------
-- Webhook işləyirdi, amma üç real problem vardı:
--
-- 1. TƏKRAR HADİSƏ (idempotentlik yox idi). LemonSqueezy uğursuz cavabdan sonra
--    webhook-u TƏKRAR göndərir, üstəlik yeni abunədə HƏM `subscription_created`,
--    HƏM `order_created` gəlir. Hər ikisi Plus əlavə etdiyi üçün istifadəçi bir
--    ödənişə iki dəfə müddət alırdı.
--
-- 2. MÜDDƏT ÜSTÜNƏ GƏLMİRDİ. `plus_until` həmişə `now() + müddət` kimi yazılırdı:
--    3 ayı qalmış istifadəçi illik alanda həmin 3 ayı İTİRİRDİ.
--
-- 3. BİTMİŞ ABUNƏ MÜKAFAT VERİRDİ. `complete_lesson` yalnız `is_plus` bayrağına
--    baxırdı; `plus_until` keçmişdə qalsa belə istifadəçi 2× zümrüd alırdı
--    (`get_plus()` düzgün yoxlayır — server tərəfdəki mükafat isə yoxlamırdı).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Ödəniş hadisələri jurnalı (idempotentlik + audit) ─────────────────────
-- `id` = "<hadisə adı>:<obyekt id>" — LemonSqueezy təkrar göndərəndə eyni açar gəlir.
create table if not exists payment_events (
  id           text primary key,
  event        text not null,
  user_id      uuid references auth.users(id) on delete set null,
  kind         text,                       -- 'plus' | 'sponsor' | 'revoke'
  amount_cents int not null default 0,
  currency     text not null default 'AZN',
  detail       text,
  created_at   timestamptz not null default now()
);
alter table payment_events enable row level security;

create index if not exists payment_events_user_idx on payment_events (user_id, created_at desc);

-- Yeni hadisədirsə true, təkrardırsa false qaytarır. Webhook `false` alanda
-- heç nə etmir və 200 qaytarır (LS retry-ları dayandırsın).
create or replace function record_payment_event(
  p_id text, p_event text, p_uid uuid, p_kind text,
  p_amount_cents int default 0, p_currency text default 'AZN', p_detail text default null
)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into payment_events (id, event, user_id, kind, amount_cents, currency, detail)
  values (p_id, p_event, p_uid, p_kind, coalesce(p_amount_cents, 0),
          coalesce(nullif(btrim(coalesce(p_currency, '')), ''), 'AZN'), p_detail)
  on conflict (id) do nothing;
  return found;
end; $$;
revoke execute on function record_payment_event(text, text, uuid, text, int, text, text)
  from public, anon, authenticated;

-- ── 2) Plus vermə: müddət ÜSTƏ GƏLİR ─────────────────────────────────────────
-- Baza: `plus_until` gələcəkdədirsə ondan, əks halda indidən. Beləcə vaxtından
-- əvvəl yenilənən abunə qalan günləri itirmir.
create or replace function grant_plus_paid(p_uid uuid, p_days int)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare base_ts timestamptz; new_until timestamptz;
begin
  if p_uid is null then raise exception 'user required'; end if;

  insert into user_stats (user_id) values (p_uid) on conflict (user_id) do nothing;

  select case
           when plus_until is not null and plus_until > now() then plus_until
           else now()
         end
    into base_ts
    from user_stats where user_id = p_uid;

  new_until := coalesce(base_ts, now()) + make_interval(days => greatest(coalesce(p_days, 30), 1));

  update user_stats set is_plus = true, plus_until = new_until where user_id = p_uid;
  return new_until;
end; $$;
revoke execute on function grant_plus_paid(uuid, int) from public, anon, authenticated;

create or replace function revoke_plus_paid(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update user_stats set is_plus = false, plus_until = null where user_id = p_uid;
end; $$;
revoke execute on function revoke_plus_paid(uuid) from public, anon, authenticated;

-- ── 3) Bitmiş abunə mükafat verməsin ─────────────────────────────────────────
-- 0043-dəki gövdənin eynisi; yeganə fərq: Plus yoxlaması `plus_until`-i də nəzərə alır.
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

  if is_banned(me) then
    raise exception 'hesab bloklanıb';
  end if;

  select kind into l_kind from lessons where id = p_lesson_id;
  if l_kind is null then
    return query select 0, 0, false;
    return;
  end if;

  -- ★ DƏYİŞDİ: müddəti bitmiş Plus artıq 2× zümrüd vermir.
  select coalesce(is_plus, false) and (plus_until is null or plus_until > now())
    into user_is_plus
    from user_stats where user_id = me;

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

-- ── 4) Admin: ödəniş jurnalı ─────────────────────────────────────────────────
create or replace function admin_payments(p_limit int default 100)
returns table(
  id text, event text, kind text, email text, amount_cents int,
  currency text, detail text, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select e.id, e.event, e.kind, u.email::text, e.amount_cents, e.currency, e.detail, e.created_at
      from payment_events e
      left join auth.users u on u.id = e.user_id
     order by e.created_at desc
     limit least(greatest(coalesce(p_limit, 100), 1), 500);
end; $$;
revoke execute on function admin_payments(int) from public, anon;
grant execute on function admin_payments(int) to authenticated;

comment on table payment_events is
  'Ödəniş webhook hadisələri. id = "<hadisə>:<obyekt id>" → təkrar göndərilən webhook iki dəfə emal olunmur.';
