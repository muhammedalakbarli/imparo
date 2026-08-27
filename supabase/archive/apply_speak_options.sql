-- İngilis variantlı tapşırıqlara speakOptions əlavə edir (seçiləndə avtomatik səslənir).
-- Yalnız data jsonb-ə {"speakOptions": true} qatır; başqa heç nəyə toxunmur.
begin;
update tasks
set data = data || '{"speakOptions": true}'::jsonb
where id in ('ps-rule-t1', 'ps-rule-t2', 'ps-rule-t3', 'ps-rule-t4', 'ps-rule-t7', 'ps-rule-t8', 'ps-rule-t9', 'ps-rule-t10', 'ps-rule-t11', 'ps-rule-t12', 'ps-rule-b1', 'ps-rule-b3', 'ps-rule-b4', 'ps-vocab-t9', 'ps-vocab-t10', 'ps-vocab-t11', 'ps-vocab-b3', 'ps-read-t1', 'ps-read-t2', 'ps-read-t3', 'ps-read-t4', 'ps-read-t5', 'ps-read-t6', 'ps-read-t8', 'ps-read-t10', 'ps-read-b3');
commit;
