-- Dərs videosu — sofatutor modeli: əvvəl izlə, sonra məşq et.
--
-- jsonb seçildi, ayrı sütunlar yox: video obyektinə vaxtla altyazı, poster,
-- keyfiyyət variantları və s. əlavə olunacaq. Hər dəfə miqrasiya yazmaq əvəzinə
-- forma `LessonVideo` tipində saxlanılır (bax lib/types.ts).
--
-- İçindəki `src` QƏSDƏN sadə URL-dir, host identifikatoru deyil: videolar indi
-- Worker static assets-dən verilir, həcm artanda R2-yə keçəcək — o zaman yalnız
-- ünvan dəyişəcək, sxem yox.
alter table lessons add column if not exists video jsonb;

comment on column lessons.video is
  'LessonVideo: { src, poster?, durationSec?, captions? }. Yoxdursa dərsdə video yoxdur.';
