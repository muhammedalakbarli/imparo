-- Yeni tapşırıq tipi: match_pairs (cütləri tap).
--
-- NİYƏ: mövcud beş tipin hamısı OXUMAĞI tələb edir. 1-2-ci sinif şagirdi hələ
-- yaxşı oxumur. Cütləşdirmə emoji/rəqəm/qısa sözlə işlədiyi üçün oxumadan da
-- həll edilir — uşaq mənanı görür, sonra toxunur. (sofatutor Sofahero-dakı
-- "match the pairs" tipinin qarşılığı.)
--
-- 0015-dəki kimi: konstraint əvvəlcə silinir, sonra genişlənmiş siyahı ilə
-- yenidən qurulur. `data` jsonb-də forma: { pairs: [{ left, right }, ...] }.
-- Massivin SIRASI düzgün cavabdır; ekranda sağ sütun qarışdırılır.
alter table tasks drop constraint if exists tasks_type_check;

alter table tasks add constraint tasks_type_check
  check (type in ('multiple_choice', 'fill_blank', 'numeric', 'word_order', 'listening', 'match_pairs'));
