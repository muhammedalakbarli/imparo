-- ══════════════════════════════════════════════════════════════════════════════
-- AUDİT DÜZƏLİŞLƏRİ (Okt 2026)
-- ------------------------------------------------------------------------------
-- 1. 🔴 ADMİN DƏVƏTİ OĞURLANA BİLİRDİ (0060).
--    `claim_admin_invite` yalnız `email_confirmed_at is not null` yoxlayırdı. Bu
--    layihədə Supabase-də "Confirm email" SÖNÜLÜDÜR (`mailer_autoconfirm: true` —
--    /auth/v1/settings-dən yoxlanıldı): e-poçt/parol qeydiyyatında
--    `email_confirmed_at` DƏRHAL doldurulur, ünvanın sahibi olmaq sübut olunmur.
--    Yəni dəvət olunmuş ünvanı bilən hər kəs həmin ünvanla qeydiyyatdan keçib
--    ADMİN ola bilərdi. İndi dəvəti yalnız ünvanı provayder tərəfindən TƏSDİQLƏNMİŞ
--    OAuth kimliyi (Google) ilə daxil olan şəxs götürə bilər.
--
-- 2. 🔴 ADİ ADMİN SUPER-ADMİNİ ENDİRƏ BİLİRDİ (0060).
--    `admin_invite_admin` mövcud hesab üçün `on conflict ... set role = excluded.role`
--    edirdi və bunu adi admin də çağıra bilirdi: super-adminin ünvanını 'admin'
--    rolu ilə "dəvət etmək" onu endirirdi. Rol dəyəri də yoxlanmırdı.
--
-- 3. 🟠 KURİKULUM VİDEOSU YÜKLƏNMİRDİ (0061).
--    Admin panelindəki toplu yükləmə faylı `curriculum/<dərs id>.mp4` yoluna yazır,
--    storage siyasətləri isə yalnız `<öz uid>/...` qovluğuna icazə verirdi → RLS
--    hər yükləməni rədd edirdi.
--
-- 4. 🟠 VALİDEYN E-POÇTU İLƏ SPAM (0046).
--    /api/parent/email hər çağırışda istənilən ünvana məktub göndərir, tavan yox
--    idi: bir hesab dövrə salınaraq kənar ünvanları məktubla doldura və Resend-in
--    gündəlik kvotasını (bütün valideyn hesabatları ilə ortaq) bitirə bilərdi.
--
-- 5. 🟡 Kiçiklər: sərbəst mətn sahələrinə uzunluq tavanı, toplu video sayğacının
--    düzgün sayılması, `task_attempts.lesson_id` indeksi (istehsal növbəsi hər
--    dərs üçün ayrıca saydığı üçün indekssiz tam cədvəl skanı edirdi).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Dəvət yalnız təsdiqlənmiş OAuth kimliyi ilə götürülür ─────────────────
create or replace function claim_admin_invite()
returns boolean language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); my_email text; inv admin_invites%rowtype;
begin
  if me is null then return false; end if;
  if exists (select 1 from admins where user_id = me) then return true; end if;

  select lower(u.email) into my_email from auth.users u where u.id = me;
  if my_email is null then return false; end if;

  -- `email_confirmed_at` burada SÜBUT DEYİL (autoconfirm açıqdır). Provayderin
  -- (Google) ünvanı özü təsdiqlədiyi kimlik tələb olunur.
  if not exists (
    select 1 from auth.identities i
     where i.user_id = me
       and i.provider <> 'email'
       and lower(coalesce(i.identity_data->>'email', '')) = my_email
       and coalesce((i.identity_data->>'email_verified')::boolean, false)
  ) then
    return false;
  end if;

  select * into inv from admin_invites where email = my_email;
  if not found then return false; end if;

  insert into admins (user_id, role) values (me, inv.role)
  on conflict (user_id) do update set role = excluded.role;

  delete from admin_invites where email = my_email;

  perform log_admin_action('claim_admin_invite', 'user', me::text, inv.role);
  return true;
end; $$;
revoke execute on function claim_admin_invite() from public, anon;
grant execute on function claim_admin_invite() to authenticated;

-- ── 2) Rol yoxlaması + mövcud adminin rolunu yalnız super dəyişir ────────────
create or replace function admin_invite_admin(p_email text, p_role text default 'admin', p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  r text := coalesce(nullif(btrim(p_role), ''), 'admin');
  uid uuid;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if e = '' or position('@' in e) = 0 or length(e) > 254 then raise exception 'düzgün e-poçt deyil'; end if;
  if r not in ('admin', 'super') then raise exception 'yanlış rol'; end if;
  -- Super rolunu yalnız super-admin verə bilər.
  if r = 'super' and not is_super_admin() then
    raise exception 'super rolunu yalnız super-admin verə bilər';
  end if;

  -- Hesab artıq varsa dəvətə ehtiyac yoxdur — birbaşa admin edilir.
  select u.id into uid from auth.users u where lower(u.email) = e;
  if uid is not null then
    -- Artıq admindirsə rolunu yalnız super-admin dəyişə bilər (əks halda adi
    -- admin super-adminin ünvanını "dəvət edib" onu endirə bilirdi).
    if exists (select 1 from admins a where a.user_id = uid) and not is_super_admin() then
      raise exception 'bu şəxs artıq admindir; rolunu yalnız super-admin dəyişə bilər';
    end if;
    insert into admins (user_id, role) values (uid, r)
    on conflict (user_id) do update set role = excluded.role;
    perform log_admin_action('add_admin', 'user', uid::text, e || ' · ' || r);
    return 'added';
  end if;

  insert into admin_invites (email, role, invited_by, note)
  values (e, r, auth.uid(), left(nullif(btrim(coalesce(p_note, '')), ''), 300))
  on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by;
  perform log_admin_action('invite_admin', 'email', e, r);
  return 'invited';
end; $$;
revoke execute on function admin_invite_admin(text, text, text) from public, anon;
grant execute on function admin_invite_admin(text, text, text) to authenticated;

-- ── 3) Kurikulum videoları: admin `curriculum/` qovluğuna yaza bilsin ────────
-- `upsert: true` (eyni dərsin videosu yenilənir) Storage-da INSERT + SELECT +
-- UPDATE icazəsi tələb edir.
drop policy if exists lesson_videos_curriculum_insert on storage.objects;
create policy lesson_videos_curriculum_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-videos'
    and (storage.foldername(name))[1] = 'curriculum'
    and public.is_admin()
  );

drop policy if exists lesson_videos_curriculum_update on storage.objects;
create policy lesson_videos_curriculum_update on storage.objects for update to authenticated
  using (
    bucket_id = 'lesson-videos'
    and (storage.foldername(name))[1] = 'curriculum'
    and public.is_admin()
  );

drop policy if exists lesson_videos_curriculum_delete on storage.objects;
create policy lesson_videos_curriculum_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'lesson-videos'
    and (storage.foldername(name))[1] = 'curriculum'
    and public.is_admin()
  );

drop policy if exists lesson_videos_select on storage.objects;
create policy lesson_videos_select on storage.objects for select to authenticated
  using (
    bucket_id = 'lesson-videos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or ((storage.foldername(name))[1] = 'curriculum' and public.is_admin())
    )
  );

-- ── 4) Valideyn e-poçtu: gündə ən çox 5 dəyişiklik/təkrar göndəriş ──────────
-- Sayğac ayrıca cədvəldədir: `parent_reports` sətri `remove_parent_email` ilə
-- silinir, sayğac orada olsaydı silib-yenidən yazmaqla sıfırlanardı.
create table if not exists parent_email_rate (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day     date not null,
  n       int  not null default 0
);
alter table parent_email_rate enable row level security;
-- Siyasət yoxdur: yalnız aşağıdakı SECURITY DEFINER funksiyası yazır.

create or replace function set_parent_email(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_today date := (now() at time zone 'Asia/Baku')::date;
  v_n int;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' or length(v_email) > 254 then
    raise exception 'invalid email';
  end if;

  insert into parent_email_rate as r (user_id, day, n) values (auth.uid(), v_today, 1)
  on conflict (user_id) do update
    set n   = case when r.day = v_today then r.n + 1 else 1 end,
        day = v_today
  returning n into v_n;
  if v_n > 5 then
    raise exception 'rate limited';
  end if;

  insert into parent_reports (user_id, email, verify_token, view_token, unsub_token)
  values (auth.uid(), v_email, new_report_token(), new_report_token(), new_report_token())
  on conflict (user_id) do update
    set email        = excluded.email,
        verify_token = new_report_token(),
        verified_at  = null,
        view_token   = new_report_token(),
        unsub_token  = new_report_token();
end;
$$;
revoke execute on function set_parent_email(text) from public, anon;
grant execute on function set_parent_email(text) to authenticated;

-- ── 5a) Sərbəst mətn sahələrinə tavan ────────────────────────────────────────
create or replace function request_scholarship(p_reason text default null)
returns text language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cur text;
begin
  if me is null then raise exception 'auth required'; end if;

  select status into cur from scholarships where user_id = me;
  if cur = 'pending' then return 'pending'; end if;
  if cur = 'approved' then return 'approved'; end if;

  insert into scholarships (user_id, reason, status)
  values (me, left(nullif(btrim(coalesce(p_reason, '')), ''), 1000), 'pending')
  on conflict (user_id) do update
    set status = 'pending',
        reason = excluded.reason,
        created_at = now(),
        decided_at = null,
        decided_by = null;

  return 'pending';
end; $$;
revoke execute on function request_scholarship(text) from public, anon;
grant execute on function request_scholarship(text) to authenticated;

create or replace function request_manual_payment(
  p_kind text, p_plan text, p_amount_cents int,
  p_method text default 'card', p_reference text default null, p_note text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid;
begin
  if me is null then raise exception 'auth required'; end if;
  if p_kind not in ('plus', 'sponsor') then raise exception 'invalid kind'; end if;
  -- Plan növə uyğun olmalıdır: admin təsdiqi müddəti plandan seçir.
  if (p_kind = 'plus' and p_plan not in ('monthly', 'yearly'))
     or (p_kind = 'sponsor' and p_plan <> 'sponsor') then
    raise exception 'invalid plan';
  end if;
  if coalesce(p_amount_cents, 0) <= 0 or p_amount_cents > 1000000 then raise exception 'invalid amount'; end if;
  if coalesce(p_method, 'card') not in ('card', 'm10', 'other') then raise exception 'invalid method'; end if;

  update payment_requests
     set kind = p_kind, plan = p_plan, amount_cents = p_amount_cents,
         method = coalesce(nullif(p_method, ''), 'card'),
         reference = left(nullif(btrim(coalesce(p_reference, '')), ''), 120),
         note = left(nullif(btrim(coalesce(p_note, '')), ''), 1000),
         created_at = now()
   where user_id = me and status = 'pending'
   returning id into new_id;
  if new_id is not null then return new_id; end if;

  insert into payment_requests (user_id, kind, plan, amount_cents, method, reference, note)
  values (me, p_kind, p_plan, p_amount_cents,
          coalesce(nullif(p_method, ''), 'card'),
          left(nullif(btrim(coalesce(p_reference, '')), ''), 120),
          left(nullif(btrim(coalesce(p_note, '')), ''), 1000))
  returning id into new_id;
  return new_id;
end; $$;
revoke execute on function request_manual_payment(text, text, int, text, text, text) from public, anon;
grant execute on function request_manual_payment(text, text, int, text, text, text) to authenticated;

-- ── 5b) Toplu video bağlama: yalnız həqiqətən yenilənən dərs sayılsın ────────
-- Əvvəl `src` boş olan element də "yeniləndi" sayılırdı (UPDATE heç nə etməsə də).
create or replace function admin_bulk_set_lesson_video(p_items jsonb)
returns table(updated int, missing int, missing_ids text[])
language plpgsql security definer set search_path = public as $$
declare
  it jsonb;
  lid text;
  n_ok int := 0;
  miss text[] := '{}';
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'array gözlənilir'; end if;

  for it in select * from jsonb_array_elements(p_items) loop
    lid := btrim(coalesce(it->>'lesson_id', ''));
    if lid = '' then continue; end if;

    if not exists (select 1 from lessons l where l.id = lid) then
      miss := miss || lid;
      continue;
    end if;

    update lessons
       set video = jsonb_strip_nulls(jsonb_build_object(
             'src', btrim(it->>'src'),
             'poster', nullif(btrim(coalesce(it->>'poster', '')), ''),
             'captions', nullif(btrim(coalesce(it->>'captions', '')), ''),
             'durationSec', nullif(it->>'duration_sec', '')::int
           ))
     where id = lid
       and coalesce(btrim(it->>'src'), '') <> '';

    if found then n_ok := n_ok + 1; end if;
  end loop;

  perform log_admin_action('bulk_set_lesson_video', 'lesson', null,
                           n_ok || ' dərs · ' || coalesce(array_length(miss, 1), 0) || ' tapılmadı');
  return query select n_ok, coalesce(array_length(miss, 1), 0), miss;
end; $$;
revoke execute on function admin_bulk_set_lesson_video(jsonb) from public, anon;
grant execute on function admin_bulk_set_lesson_video(jsonb) to authenticated;

-- ── 5c) İndeks ───────────────────────────────────────────────────────────────
create index if not exists task_attempts_lesson_idx on task_attempts (lesson_id);
