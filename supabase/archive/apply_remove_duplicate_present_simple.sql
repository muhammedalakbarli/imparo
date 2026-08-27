-- Təkrar Present Simple dərsini (köhnə en-gr-l1) DB-dən silir.
-- Yeni dövrün "Qayda: Present Simple" (ps-rule) qalır. Supabase SQL Editor-da işə sal.
-- Qeyd: en-gr-l1 üçün user_progress FK-cascade ilə avtomatik silinir.

begin;
delete from tasks where lesson_id = 'en-gr-l1';
delete from lessons where id = 'en-gr-l1';
commit;
