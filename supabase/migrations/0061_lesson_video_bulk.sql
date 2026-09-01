-- ══════════════════════════════════════════════════════════════════════════════
-- DƏRS VİDEOLARI: TOPLU BAĞLAMA VƏ İSTEHSAL NÖVBƏSİ
-- ------------------------------------------------------------------------------
-- Qərar: HƏR dərsdə video olacaq — yəni 806 dərs üçün video bağlanmalıdır.
-- Admin panelindəki mövcud forma dərsi bir-bir açıb ünvanı əl ilə yazmağı tələb
-- edir; 806 dəfə bu, real olaraq mümkün deyil və istehsal elə orada dayanır.
--
-- Bu migration iki şeyi verir:
--   1. `admin_bulk_set_lesson_video` — bir çağırışda onlarla dərsə video bağlayır
--      (fayl adı və ya siyahı dərs id-si ilə uyğunlaşdırılır);
--   2. `admin_lesson_video_status` — hansı dərslərdə video var/yox və həmin dərsin
--      nə qədər işlədildiyi. Bu, çəkiliş növbəsinin sıralaması üçündür: əvvəlcə
--      şagirdlərin ən çox toxunduğu dərslər çəkilir.
-- ══════════════════════════════════════════════════════════════════════════════

-- Altyazı faylı (.vtt) da yüklənə bilsin — pleyer onsuz da `captions` sahəsini dəstəkləyir.
update storage.buckets
   set allowed_mime_types = array[
         'video/mp4', 'video/webm', 'image/jpeg', 'image/png',
         'text/vtt', 'text/plain'
       ]
 where id = 'lesson-videos';

-- ── Toplu bağlama ────────────────────────────────────────────────────────────
-- p_items: [{"lesson_id":"ry1-sayma-l1","src":"…","poster":"…","captions":"…","duration_sec":140}, …]
-- Mövcud olmayan dərs id-ləri sükutla ötürülmür — sayı qaytarılır ki, admin
-- səhv fayl adını görə bilsin.
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

    n_ok := n_ok + 1;
  end loop;

  perform log_admin_action('bulk_set_lesson_video', 'lesson', null,
                           n_ok || ' dərs · ' || coalesce(array_length(miss, 1), 0) || ' tapılmadı');
  return query select n_ok, coalesce(array_length(miss, 1), 0), miss;
end; $$;
revoke execute on function admin_bulk_set_lesson_video(jsonb) from public, anon;
grant execute on function admin_bulk_set_lesson_video(jsonb) to authenticated;

create or replace function admin_clear_lesson_video(p_lesson_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  update lessons set video = null where id = p_lesson_id;
  perform log_admin_action('clear_lesson_video', 'lesson', p_lesson_id, null);
end; $$;
revoke execute on function admin_clear_lesson_video(text) from public, anon;
grant execute on function admin_clear_lesson_video(text) to authenticated;

-- ── İstehsal növbəsi ─────────────────────────────────────────────────────────
-- `attempts` — həmin dərsin tapşırıqlarına edilmiş cəhd sayı. Çəkiliş sırası
-- üçün əsas siqnal budur: şagirdin faktiki toxunduğu dərs birinci çəkilməlidir.
create or replace function admin_lesson_video_status(
  p_subject text default null, p_only_missing boolean default false
)
returns table(
  lesson_id text, title text, unit_title text, subject text, grade int,
  kind text, has_video boolean, src text, attempts int, sort_order int
)
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then return; end if;
  return query
    select l.id, l.title, u.title, s.name, s.grade,
           coalesce(l.kind, 'lesson'),
           (l.video is not null),
           l.video->>'src',
           (select count(*)::int from task_attempts a where a.lesson_id = l.id),
           l.sort_order
      from lessons l
      join units u on u.id = l.unit_id
      join subjects s on s.id = u.subject_id
     where coalesce(l.kind, 'lesson') = 'lesson'          -- sandıq/test çəkilmir
       and (p_subject is null or s.id = p_subject)
       and (not p_only_missing or l.video is null)
     order by s.grade, s.name, u.sort_order, l.sort_order;
end; $$;
revoke execute on function admin_lesson_video_status(text, boolean) from public, anon;
grant execute on function admin_lesson_video_status(text, boolean) to authenticated;

comment on function admin_bulk_set_lesson_video(jsonb) is
  'Bir çağırışda çox dərsə video bağlayır; tapılmayan dərs id-lərini qaytarır.';
