-- ══════════════════════════════════════════════════════════════════════════════
-- MÜƏLLİM VİDEO DƏRSLƏRİ
-- ------------------------------------------------------------------------------
-- 0052 dərsə video BAĞLAMAĞI mümkün etdi, amma video əl ilə `public/videos/`-ə
-- qoyulurdu — yəni yalnız admin (repo sahibi) video əlavə edə bilirdi. Müəllim
-- öz sinfi üçün dərs çəkib yükləyə bilmirdi.
--
-- MODEL: video kurikulum dərsinə YAPIŞDIRILMIR, ayrıca resursdur.
--   · `class_id` doludursa  → sinif videosu: yalnız həmin sinfin üzvləri görür.
--     Qapalı auditoriya olduğu üçün moderasiya tələb olunmur (müəllim onsuz da
--     admin tərəfindən təsdiqlənib — bax 0030 teacher gate).
--   · `class_id` boşdursa   → ümumi kitabxana: BÜTÜN şagirdlərə görünür, ona görə
--     `status='pending'` ilə başlayır və admin təsdiqindən sonra açılır.
--     Uşaq platformasında açıq məzmun moderasiyasız buraxıla bilməz.
--
-- SAXLANC: fayl Supabase Storage-dakı `lesson-videos` bucket-inə düşür (pulsuz
-- plan: 1 GB). Böyüyəndə yalnız `src` ünvanı dəyişəcək (R2/Bunny) — sxem eynidir.
-- Uzun videolar üçün ikinci qapı var: xarici link (YouTube/Vimeo və ya .mp4).
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1) Saxlanc bucket-i ──────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-videos', 'lesson-videos', true,
  104857600,                       -- 100 MiB: 720p slayd dərsi ≈ 5 MB/dəq → ~20 dəq
  array['video/mp4', 'video/webm', 'image/jpeg', 'image/png']  -- şəkillər poster üçün
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Yazma yalnız təsdiqlənmiş müəllimə və YALNIZ öz qovluğuna (`<uid>/fayl.mp4`).
-- Prefiks yoxlaması vacibdir: əks halda bir müəllim digərinin faylını əvəzləyə bilər.
drop policy if exists lesson_videos_insert on storage.objects;
create policy lesson_videos_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lesson-videos'
    and is_teacher()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists lesson_videos_update on storage.objects;
create policy lesson_videos_update on storage.objects for update to authenticated
  using (bucket_id = 'lesson-videos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists lesson_videos_delete on storage.objects;
create policy lesson_videos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'lesson-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── 2) Video reyestri ────────────────────────────────────────────────────────
create table if not exists teacher_videos (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references auth.users(id) on delete cascade,
  class_id     uuid references classes(id) on delete cascade,   -- null → ümumi kitabxana
  subject_slug text,                                            -- kitabxana üçün süzgəc
  grade        int,
  title        text not null,
  description  text,
  src          text not null,
  poster       text,
  provider     text not null default 'upload' check (provider in ('upload','youtube','url')),
  duration_sec int,
  status       text not null default 'approved' check (status in ('pending','approved','rejected')),
  created_at   timestamptz not null default now()
);

create index if not exists teacher_videos_class_idx on teacher_videos (class_id, created_at desc);
create index if not exists teacher_videos_lib_idx
  on teacher_videos (grade, subject_slug) where class_id is null and status = 'approved';

alter table teacher_videos enable row level security;
-- Bütün giriş RPC-lərdən gedir (aşağıda) — cədvələ birbaşa REST girişi yoxdur.

create table if not exists video_views (
  video_id   uuid not null references teacher_videos(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (video_id, user_id)
);
alter table video_views enable row level security;

-- ── 3) Müəllim əməliyyatları ─────────────────────────────────────────────────
-- Sinif videosu üçün sahiblik `is_class_teacher()` (0054) ilə yoxlanılır;
-- kitabxana videosu üçün `is_teacher()` (0030) kifayətdir, amma moderasiyaya düşür.
create or replace function create_teacher_video(
  p_title text,
  p_src text,
  p_class_id uuid default null,
  p_description text default null,
  p_provider text default 'upload',
  p_poster text default null,
  p_duration_sec int default null,
  p_subject_slug text default null,
  p_grade int default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); new_id uuid; st text;
begin
  if me is null then raise exception 'auth required'; end if;
  if not is_teacher() then raise exception 'not a teacher'; end if;
  if p_class_id is not null and not is_class_teacher(p_class_id) then
    raise exception 'not the teacher';
  end if;
  if coalesce(btrim(p_src), '') = '' then raise exception 'src required'; end if;

  -- Sinif videosu dərhal açılır, ümumi kitabxana videosu admin təsdiqi gözləyir.
  st := case when p_class_id is null then 'pending' else 'approved' end;

  insert into teacher_videos (
    teacher_id, class_id, subject_slug, grade, title, description,
    src, poster, provider, duration_sec, status
  ) values (
    me, p_class_id, p_subject_slug, p_grade,
    coalesce(nullif(btrim(p_title), ''), 'Video dərs'), nullif(btrim(coalesce(p_description, '')), ''),
    btrim(p_src), nullif(btrim(coalesce(p_poster, '')), ''),
    case when p_provider in ('upload','youtube','url') then p_provider else 'upload' end,
    p_duration_sec, st
  )
  returning id into new_id;
  return new_id;
end; $$;
revoke execute on function create_teacher_video(text, text, uuid, text, text, text, int, text, int) from public, anon;
grant execute on function create_teacher_video(text, text, uuid, text, text, text, int, text, int) to authenticated;

create or replace function update_teacher_video(
  p_id uuid, p_title text default null, p_description text default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from teacher_videos v where v.id = p_id and v.teacher_id = auth.uid()) then
    raise exception 'not the owner';
  end if;
  update teacher_videos
     set title = coalesce(nullif(btrim(coalesce(p_title, '')), ''), title),
         description = coalesce(nullif(btrim(coalesce(p_description, '')), ''), description)
   where id = p_id;
end; $$;
revoke execute on function update_teacher_video(uuid, text, text) from public, anon;
grant execute on function update_teacher_video(uuid, text, text) to authenticated;

create or replace function delete_teacher_video(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Sahibi və ya admin silə bilər (moderasiya üçün admin də lazımdır).
  if not exists (select 1 from teacher_videos v where v.id = p_id and v.teacher_id = auth.uid())
     and not is_admin() then
    raise exception 'not the owner';
  end if;
  delete from teacher_videos where id = p_id;
end; $$;
revoke execute on function delete_teacher_video(uuid) from public, anon;
grant execute on function delete_teacher_video(uuid) to authenticated;

-- ── 4) Oxuma ─────────────────────────────────────────────────────────────────
-- Sinif videoları: müəllim VƏ sinif üzvləri (0023-dəki `class_assignments` qaydası).
-- `views` sütunu müəllimə "neçə şagird baxdı" göstərir.
create or replace function class_videos(p_class_id uuid)
returns table(
  id uuid, title text, description text, src text, poster text,
  provider text, duration_sec int, created_at timestamptz, views int, watched boolean
)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from classes c where c.id = p_class_id and c.teacher_id = auth.uid()
    union all
    select 1 from class_members m where m.class_id = p_class_id and m.user_id = auth.uid()
  ) then return; end if;

  return query
    select v.id, v.title, v.description, v.src, v.poster, v.provider, v.duration_sec, v.created_at,
           (select count(*)::int from video_views w where w.video_id = v.id),
           exists (select 1 from video_views w where w.video_id = v.id and w.user_id = auth.uid())
      from teacher_videos v
     where v.class_id = p_class_id and v.status = 'approved'
     order by v.created_at desc;
end; $$;
revoke execute on function class_videos(uuid) from public, anon;
grant execute on function class_videos(uuid) to authenticated;

-- Müəllimin bütün videoları (kitabxanaya göndərdikləri də — statusu ilə).
create or replace function my_teacher_videos()
returns table(
  id uuid, class_id uuid, class_name text, title text, src text, provider text,
  status text, created_at timestamptz, views int
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_teacher() then return; end if;
  return query
    select v.id, v.class_id, c.name, v.title, v.src, v.provider, v.status, v.created_at,
           (select count(*)::int from video_views w where w.video_id = v.id)
      from teacher_videos v
      left join classes c on c.id = v.class_id
     where v.teacher_id = auth.uid()
     order by v.created_at desc;
end; $$;
revoke execute on function my_teacher_videos() from public, anon;
grant execute on function my_teacher_videos() to authenticated;

-- Ümumi kitabxana: yalnız təsdiqlənmiş, sinfə bağlı olmayan videolar.
create or replace function library_videos(p_grade int default null, p_subject text default null)
returns table(
  id uuid, title text, description text, src text, poster text, provider text,
  duration_sec int, subject_slug text, grade int, teacher_name text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select v.id, v.title, v.description, v.src, v.poster, v.provider, v.duration_sec,
         v.subject_slug, v.grade, coalesce(p.name, 'Müəllim'), v.created_at
    from teacher_videos v
    left join profiles p on p.id = v.teacher_id
   where v.class_id is null
     and v.status = 'approved'
     and (p_grade is null or v.grade = p_grade)
     and (p_subject is null or v.subject_slug = p_subject)
   order by v.created_at desc
   limit 200;
$$;
revoke execute on function library_videos(int, text) from public, anon;
grant execute on function library_videos(int, text) to authenticated;

-- ── 5) Baxış qeydi ───────────────────────────────────────────────────────────
-- Şagird videonu sona qədər izləyəndə çağırılır. Yalnız GÖRMƏ HÜQUQU olan
-- istifadəçi yaza bilər — əks halda sayğac saxtalaşdırıla bilərdi.
create or replace function mark_video_watched(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); cid uuid;
begin
  if me is null then return; end if;
  select class_id into cid from teacher_videos where id = p_id and status = 'approved';
  if not found then return; end if;

  if cid is not null and not exists (
    select 1 from class_members m where m.class_id = cid and m.user_id = me
    union all
    select 1 from classes c where c.id = cid and c.teacher_id = me
  ) then
    return;  -- sinfin üzvü deyil → qeyd yoxdur
  end if;

  insert into video_views (video_id, user_id) values (p_id, me)
  on conflict (video_id, user_id) do nothing;
end; $$;
revoke execute on function mark_video_watched(uuid) from public, anon;
grant execute on function mark_video_watched(uuid) to authenticated;

-- ── 6) Admin moderasiyası ────────────────────────────────────────────────────
create or replace function admin_video_queue()
returns table(
  id uuid, title text, description text, src text, provider text, status text,
  teacher_email text, teacher_name text, subject_slug text, grade int, created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select v.id, v.title, v.description, v.src, v.provider, v.status,
           u.email::text, coalesce(p.name, '—'), v.subject_slug, v.grade, v.created_at
      from teacher_videos v
      left join auth.users u on u.id = v.teacher_id
      left join profiles p on p.id = v.teacher_id
     where v.class_id is null
     order by (v.status = 'pending') desc, v.created_at desc;
end; $$;
revoke execute on function admin_video_queue() from public, anon;
grant execute on function admin_video_queue() to authenticated;

create or replace function admin_decide_video(p_id uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update teacher_videos
     set status = case when p_approve then 'approved' else 'rejected' end
   where id = p_id;
  perform log_admin_action(
    case when p_approve then 'approve_video' else 'reject_video' end,
    'video', p_id::text, null
  );
end; $$;
revoke execute on function admin_decide_video(uuid, boolean) from public, anon;
grant execute on function admin_decide_video(uuid, boolean) to authenticated;

comment on table teacher_videos is
  'Müəllimin yüklədiyi video dərslər. class_id doludursa sinifə məxsusdur (moderasiyasız), boşdursa ümumi kitabxanadır (admin təsdiqi ilə).';
