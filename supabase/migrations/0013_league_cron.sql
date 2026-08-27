-- Imparo — liqa rollover-in həftəlik avtomatlaşdırılması (pg_cron).
-- Supabase SQL Editor-da işə salınır.
--
-- Niyə: run_league_rollover() (bax 0011) mövcuddur, amma heç vaxt avtomatik çağırılmırdı
-- → liqa yüksəliş/enmə baş vermirdi. pg_cron ilə həftədə bir dəfə işə salınır.

-- 1. pg_cron uzantısı (Supabase-də: Dashboard → Database → Extensions → pg_cron aktiv;
--    və ya bu SQL çalışırsa birbaşa).
create extension if not exists pg_cron;

-- 2. Həftəlik cədvəl: hər bazar 20:05 UTC = bazar ertəsi 00:05 Asia/Baku (həftə başı).
--    Əvvəlki eyni adlı cədvəli təhlükəsiz sil, sonra yenidən qur.
select cron.unschedule('league-weekly-rollover')
where exists (select 1 from cron.job where jobname = 'league-weekly-rollover');

select cron.schedule(
  'league-weekly-rollover',
  '5 20 * * 0',
  $$ select run_league_rollover() $$
);

-- Yoxlama:  select jobid, schedule, command, active from cron.job where jobname = 'league-weekly-rollover';
-- Silmək:   select cron.unschedule('league-weekly-rollover');
-- Dərhal test:  select run_league_rollover();  (diqqət: real rollover edir!)
