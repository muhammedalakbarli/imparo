-- ══════════════════════════════════════════════════════════════════════════════
-- ƏL İLƏ ÖDƏNİŞ (kart köçürməsi / m10)
-- ------------------------------------------------------------------------------
-- NİYƏ: LemonSqueezy mağazası bir həftədən çoxdur "review" mərhələsindədir və
-- test rejimindən çıxa bilmir — yəni platforma bir xarici şirkətin təsdiqini
-- gözlədiyi üçün ÜMUMİYYƏTLƏ pul qəbul edə bilmir. Bu, məhsul üçün qəbuledilməz
-- asılılıqdır.
--
-- MODEL (ən sadə işləyən yol): valideyn kart/m10 ilə köçürmə edir → tətbiqdə qəbz
-- nömrəsini yazır → admin bank tərəfdə yoxlayıb təsdiqləyir → Plus verilir.
-- Yeni mükafat mexanizmi YARADILMIR: təsdiq mövcud `admin_grant_plus_days` (0043)
-- və sponsorluq üçün `sponsorships` (0057) üzərindən gedir.
--
-- TƏHLÜKƏSİZLİK: müraciət YALNIZ niyyət bildirir, heç nə vermir. Plus yalnız
-- adminin təsdiqi ilə verilir — yəni saxta qəbz nömrəsi yazmaq heç nə qazandırmır.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists payment_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null check (kind in ('plus', 'sponsor')),
  plan         text not null,                     -- 'monthly' | 'yearly' | 'sponsor'
  amount_cents int  not null check (amount_cents > 0),
  method       text not null default 'card' check (method in ('card', 'm10', 'other')),
  reference    text,                              -- qəbz nömrəsi / kartın son 4 rəqəmi
  note         text,
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references auth.users(id) on delete set null,
  decided_note text
);
alter table payment_requests enable row level security;

-- Bir istifadəçinin eyni anda yalnız BİR açıq müraciəti ola bilər (növbə spam-dan qorunur).
create unique index if not exists payment_requests_one_open
  on payment_requests (user_id) where status = 'pending';
create index if not exists payment_requests_status_idx
  on payment_requests (status, created_at);

-- ── Şagird/valideyn: müraciət ────────────────────────────────────────────────
create or replace function request_manual_payment(
  p_kind text, p_plan text, p_amount_cents int,
  p_method text default 'card', p_reference text default null, p_note text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_kind not in ('plus', 'sponsor') then raise exception 'invalid kind'; end if;
  if coalesce(p_amount_cents, 0) <= 0 then raise exception 'invalid amount'; end if;

  -- Açıq müraciət varsa onu yeniləyirik (yeni sətir yaratmırıq).
  update payment_requests
     set kind = p_kind, plan = p_plan, amount_cents = p_amount_cents,
         method = coalesce(nullif(p_method, ''), 'card'),
         reference = nullif(btrim(coalesce(p_reference, '')), ''),
         note = nullif(btrim(coalesce(p_note, '')), ''),
         created_at = now()
   where user_id = me and status = 'pending'
   returning id into new_id;
  if new_id is not null then return new_id; end if;

  insert into payment_requests (user_id, kind, plan, amount_cents, method, reference, note)
  values (me, p_kind, p_plan, p_amount_cents,
          coalesce(nullif(p_method, ''), 'card'),
          nullif(btrim(coalesce(p_reference, '')), ''),
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into new_id;
  return new_id;
end; $$;
revoke execute on function request_manual_payment(text, text, int, text, text, text) from public, anon;
grant execute on function request_manual_payment(text, text, int, text, text, text) to authenticated;

create or replace function my_payment_request()
returns table(id uuid, kind text, plan text, amount_cents int, status text,
              reference text, created_at timestamptz, decided_note text)
language sql stable security definer set search_path = public as $$
  select r.id, r.kind, r.plan, r.amount_cents, r.status, r.reference, r.created_at, r.decided_note
  from payment_requests r
  where r.user_id = auth.uid()
  order by r.created_at desc
  limit 1;
$$;
revoke execute on function my_payment_request() from public, anon;
grant execute on function my_payment_request() to authenticated;

-- ── Admin: növbə və qərar ────────────────────────────────────────────────────
create or replace function admin_payment_requests()
returns table(
  id uuid, user_id uuid, email text, name text, kind text, plan text,
  amount_cents int, method text, reference text, note text, status text,
  created_at timestamptz, is_plus boolean, plus_until timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select r.id, r.user_id, u.email::text, coalesce(p.name, '—'), r.kind, r.plan,
           r.amount_cents, r.method, r.reference, r.note, r.status, r.created_at,
           coalesce(s.is_plus, false), s.plus_until
      from payment_requests r
      left join auth.users u on u.id = r.user_id
      left join profiles p on p.id = r.user_id
      left join user_stats s on s.user_id = r.user_id
     order by (r.status = 'pending') desc, r.created_at desc
     limit 300;
end; $$;
revoke execute on function admin_payment_requests() from public, anon;
grant execute on function admin_payment_requests() to authenticated;

-- Təsdiq: Plus müraciətində plana görə gün verilir, sponsorluqda havuza yer yazılır.
-- Ödənişin HƏQİQƏTƏN gəldiyini admin bank tərəfdə yoxlayır — kod bunu bilə bilməz,
-- ona görə qərar tam adminin məsuliyyətindədir və audit jurnalına düşür.
create or replace function admin_decide_payment_request(
  p_id uuid, p_approve boolean, p_note text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare r payment_requests%rowtype; days int; seats int;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  select * into r from payment_requests where id = p_id;
  if not found then raise exception 'müraciət tapılmadı'; end if;
  if r.status <> 'pending' then raise exception 'müraciət artıq qərarlaşdırılıb'; end if;

  update payment_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         decided_at = now(), decided_by = auth.uid(),
         decided_note = nullif(btrim(coalesce(p_note, '')), '')
   where id = p_id;

  if p_approve then
    if r.kind = 'plus' then
      days := case when r.plan = 'yearly' then 365 else 30 end;
      perform admin_grant_plus_days(r.user_id, days, true);   -- mövcud müddətin ÜSTÜNƏ
    else
      -- Sponsorluq: yer sayı ödənilən məbləğdən (23.99 ₼ = bir illik yer).
      seats := greatest(1, floor(r.amount_cents / 2399.0)::int);
      insert into sponsorships (sponsor_id, seats, amount_cents, currency, note)
      values (r.user_id, seats, r.amount_cents, 'AZN',
              'əl ilə ödəniş' || coalesce(' · ' || r.reference, ''));
    end if;
  end if;

  perform log_admin_action(
    case when p_approve then 'approve_manual_payment' else 'reject_manual_payment' end,
    'payment_request', p_id::text,
    r.kind || ' · ' || (r.amount_cents / 100.0)::numeric(10,2) || ' AZN'
      || coalesce(' · ' || r.reference, '')
  );
end; $$;
revoke execute on function admin_decide_payment_request(uuid, boolean, text) from public, anon;
grant execute on function admin_decide_payment_request(uuid, boolean, text) to authenticated;

comment on table payment_requests is
  'Əl ilə (kart/m10) ödəniş müraciətləri. Müraciət heç nə vermir — Plus yalnız admin təsdiqi ilə verilir.';
