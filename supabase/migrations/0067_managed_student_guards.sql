-- ══════════════════════════════════════════════════════════════════════════════
-- MÜƏLLİMİN YARATDIĞI ŞAGİRD HESABLARININ QORUNMASI (0065-in davamı)
-- ------------------------------------------------------------------------------
-- Problem: sinif kodu ilə daxil olan 6–9 yaşlı uşaq Ayarlar/Profil ekranlarından
--   • sinfini dəyişə bilirdi (1-ci sinif şagirdi 6-cı sinif dərslərini görürdü),
--   • hesabını "SİL" ilə həmişəlik silə bilirdi (bütün sinif irəliləyişi gedir),
--   • müəllimin siyahısındakı adını təsadüfi hərflərlə əvəz edə bilirdi.
-- Ekranda bu idarələr gizlədilir (app/ayarlar, app/profil/redakte), amma Supabase
-- API-si brauzerdən birbaşa da çağırıla bilər — qoruma burada da olmalıdır.
--
-- Sinif: user_metadata-nı istifadəçi özü yaza bilir, app_metadata-nı isə yalnız
-- server. Ona görə sinif `app_metadata.managed_grade`-ə yazılır və lib/grade.ts
-- (userGrade) əvvəlcə onu oxuyur. Yeni hesablar onu route-da alır
-- (app/api/mekteb/students); aşağıdakı UPDATE mövcud hesabları doldurur.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Mövcud sinif hesabları: etibarlı sinif + metadata sinxronu ─────────────
update auth.users u
   set raw_app_meta_data  = coalesce(u.raw_app_meta_data, '{}'::jsonb)
                            || jsonb_build_object('managed_class', m.class_id, 'managed_grade', c.grade),
       raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
                            || jsonb_build_object('grade', c.grade)
  from managed_students m
  join classes c on c.id = m.class_id
 where u.id = m.user_id;

-- ── 2) "Mən sinif hesabıyam?" — yalnız özü haqqında cavab verir ───────────────
-- managed_students-də RLS siyasəti yoxdur (0065), ona görə invoker trigger birbaşa
-- oxuya bilməz. Parametr qəbul etmir: başqasının hesabını yoxlamaq olmur.
create or replace function managed_self()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from managed_students where user_id = auth.uid());
$$;
revoke execute on function managed_self() from public, anon;
grant execute on function managed_self() to authenticated;

-- ── 3) Ad: şagird özü dəyişə bilməz (avatar/username dəyişir) ─────────────────
-- Upsert-in qalan sahələri (avatar) keçsin deyə xəta atılmır — yalnız ad köhnə
-- qiymətində saxlanılır. INVOKER funksiyadır: current_user müştəri rolunu göstərir
-- (0036-dakı protect_profile_columns ilə eyni üsul). Müəllimin RPC-si
-- (rename_managed_student, SECURITY DEFINER) və service_role keçir.
create or replace function protect_managed_name() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated', 'anon')
     and new.name is distinct from old.name
     and managed_self() then
    new.name := old.name;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_managed_name on profiles;
create trigger trg_protect_managed_name
  before update on profiles
  for each row execute function protect_managed_name();

-- ── 4) Hesabı silmək: sinif hesabını yalnız müəllim silir ─────────────────────
-- Gövdə 0039 ilə eynidir, yalnız sinif hesabı yoxlaması əlavə olunub.
create or replace function delete_own_account()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if exists (select 1 from managed_students where user_id = me) then
    raise exception 'managed_account'
      using hint = 'Bu hesabı yalnız sinfin müəllimi silə bilər (delete_managed_student).';
  end if;
  -- Audit izi (auth.users silinəndən sonra user_id avtomatik null olur — bax security_events FK).
  perform log_security_event('self_delete_account', null, jsonb_build_object('user_id', me));
  delete from auth.users where id = me;
end; $$;
grant execute on function delete_own_account() to authenticated;

-- ── 5) Müəllim şagirdin adını düzəldir ───────────────────────────────────────
-- Ad şagird üçün kilidli olduğuna görə səhv yazılmış adı müəllim düzəltməlidir
-- (yoxsa yeganə yol hesabı silib yenidən yaratmaq olardı — irəliləyiş itərdi).
-- Ad üç yerdə saxlanılır: managed_students (giriş siyahısı, kartlar), profiles
-- (müəllim reyestri, liqa — 0064 trigger-i "Ad S." formasına salır) və
-- user_metadata (ehtiyat oxunuş). Üçü də birlikdə yenilənir.
create or replace function rename_managed_student(p_user_id uuid, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare cid uuid; v_name text := left(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g'), 60);
begin
  select class_id into cid from managed_students where user_id = p_user_id;
  if cid is null or not is_class_teacher(cid) then raise exception 'not the teacher'; end if;
  -- AZ hərfləri açıq yazılıb: C kollasiyasında [[:alpha:]] yalnız ASCII ola bilər.
  if char_length(v_name) < 2 or v_name !~ '[[:alpha:]əƏıİöÖüÜçÇşŞğĞ]' then raise exception 'invalid name'; end if;

  update managed_students set full_name = v_name where user_id = p_user_id;
  update profiles set name = v_name where id = p_user_id;
  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('name', v_name)
   where id = p_user_id;
  return v_name;
end; $$;
revoke execute on function rename_managed_student(uuid, text) from public, anon;
grant execute on function rename_managed_student(uuid, text) to authenticated;
