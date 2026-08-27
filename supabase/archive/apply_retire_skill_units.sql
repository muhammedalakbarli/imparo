-- Köhnə "bacarıq üzrə" bölmələri (Dinləmə/Oxu/Yazı) təqaüdə göndərir.
-- Dövrlər (Present Simple/Continuous) artıq bu bacarıqları verir — təkrar aradan qalxır.
-- user_progress FK-cascade ilə avtomatik təmizlənir. Supabase SQL Editor-da işə sal.

begin;
delete from tasks
  where lesson_id in (select id from lessons where unit_id in ('en-listen-speak', 'en-reading', 'en-skills'));
delete from lessons where unit_id in ('en-listen-speak', 'en-reading', 'en-skills');
delete from units where id in ('en-listen-speak', 'en-reading', 'en-skills');
commit;
