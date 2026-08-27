-- Yeni tapşırıq tiplərini icazə verilən siyahıya əlavə edir:
-- listening (dinlə-seç) və word_order (cümlə quran) — İngilis dili məşqləri.
-- 0001_init.sql-dəki köhnə CHECK yalnız 3 tipə icazə verirdi.

alter table tasks drop constraint if exists tasks_type_check;

alter table tasks add constraint tasks_type_check
  check (type in ('multiple_choice', 'fill_blank', 'numeric', 'word_order', 'listening'));
