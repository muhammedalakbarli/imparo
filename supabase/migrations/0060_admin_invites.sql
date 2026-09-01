-- ══════════════════════════════════════════════════════════════════════════════
-- ADMİN DƏVƏTLƏRİ
-- ------------------------------------------------------------------------------
-- Problem: `admins` cədvəli `auth.users(id)`-ə bağlıdır, yəni komanda yoldaşını
-- admin etmək üçün onun ARTIQ qeydiyyatdan keçmiş olması lazımdır. Nəticədə
-- "əvvəl sən qeydiyyatdan keç, sonra mən səni əlavə edim" gedişi yaranır və
-- adətən yarıda qalır.
--
-- Həll: e-poçt üzrə dəvət. Dəvət olunan şəxs qeydiyyatdan keçib ilk dəfə daxil
-- olanda `claim_admin_invite()` onu avtomatik admin edir.
--
-- TƏHLÜKƏSİZLİK: dəvət YALNIZ e-poçtu TƏSDİQLƏNMİŞ hesaba tətbiq olunur
-- (`email_confirmed_at is not null`). Əks halda kimsə başqasının e-poçtu ilə
-- qeydiyyatdan keçib admin ola bilərdi. Dəvət istifadə olunan kimi silinir.
-- ══════════════════════════════════════════════════════════════════════════════

create table if not exists admin_invites (
  email      text primary key,
  role       text not null default 'admin' check (role in ('admin', 'super')),
  invited_by uuid references auth.users(id) on delete set null,
  note       text,
  created_at timestamptz not null default now()
);
alter table admin_invites enable row level security;
-- Siyasət yoxdur: bütün giriş yalnız aşağıdakı RPC-lərdən.

-- ── Dəvəti tələb et (giriş etmiş istifadəçi özü çağırır) ─────────────────────
create or replace function claim_admin_invite()
returns boolean language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); my_email text; confirmed timestamptz; inv admin_invites%rowtype;
begin
  if me is null then return false; end if;
  if exists (select 1 from admins where user_id = me) then return true; end if;

  select lower(u.email), u.email_confirmed_at into my_email, confirmed
    from auth.users u where u.id = me;
  -- Təsdiqlənməmiş e-poçt admin edilmir (bax başlıqdakı izah).
  if my_email is null or confirmed is null then return false; end if;

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

-- ── Admin: dəvətlərin idarəsi ────────────────────────────────────────────────
create or replace function admin_invite_admin(p_email text, p_role text default 'admin', p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare e text := lower(btrim(coalesce(p_email, ''))); uid uuid;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if e = '' or position('@' in e) = 0 then raise exception 'düzgün e-poçt deyil'; end if;
  -- Super rolunu yalnız super-admin verə bilər.
  if p_role = 'super' and not is_super_admin() then
    raise exception 'super rolunu yalnız super-admin verə bilər';
  end if;

  -- Hesab artıq varsa dəvətə ehtiyac yoxdur — birbaşa admin edilir.
  select u.id into uid from auth.users u where lower(u.email) = e;
  if uid is not null then
    insert into admins (user_id, role) values (uid, coalesce(p_role, 'admin'))
    on conflict (user_id) do update set role = excluded.role;
    perform log_admin_action('add_admin', 'user', uid::text, e || ' · ' || coalesce(p_role, 'admin'));
    return 'added';
  end if;

  insert into admin_invites (email, role, invited_by, note)
  values (e, coalesce(p_role, 'admin'), auth.uid(), nullif(btrim(coalesce(p_note, '')), ''))
  on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by;
  perform log_admin_action('invite_admin', 'email', e, coalesce(p_role, 'admin'));
  return 'invited';
end; $$;
revoke execute on function admin_invite_admin(text, text, text) from public, anon;
grant execute on function admin_invite_admin(text, text, text) to authenticated;

create or replace function admin_list_invites()
returns table(email text, role text, note text, created_at timestamptz, invited_by_email text)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select i.email, i.role, i.note, i.created_at, u.email::text
      from admin_invites i
      left join auth.users u on u.id = i.invited_by
     order by i.created_at desc;
end; $$;
revoke execute on function admin_list_invites() from public, anon;
grant execute on function admin_list_invites() to authenticated;

create or replace function admin_revoke_invite(p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  delete from admin_invites where email = lower(btrim(p_email));
  perform log_admin_action('revoke_admin_invite', 'email', lower(btrim(p_email)), null);
end; $$;
revoke execute on function admin_revoke_invite(text) from public, anon;
grant execute on function admin_revoke_invite(text) to authenticated;

-- Admin səlahiyyətini geri al (super-admin; özünü çıxara bilməz).
create or replace function admin_remove_admin(p_uid uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_super_admin() then raise exception 'yalnız super-admin'; end if;
  if p_uid = auth.uid() then raise exception 'özünü admin siyahısından çıxara bilməzsən'; end if;
  delete from admins where user_id = p_uid;
  perform log_admin_action('remove_admin', 'user', p_uid::text, null);
end; $$;
revoke execute on function admin_remove_admin(uuid) from public, anon;
grant execute on function admin_remove_admin(uuid) to authenticated;

comment on table admin_invites is
  'E-poçt üzrə admin dəvətləri. Qeydiyyatdan keçib e-poçtunu təsdiqləyən şəxs claim_admin_invite() ilə avtomatik admin olur.';
