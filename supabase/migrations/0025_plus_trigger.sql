-- Imparo Plus — is_plus/plus_until sütunlarını müştəri dəyişikliyindən qoruyan trigger.
-- Supabase SQL Editor-da işə salınır. İdempotentdir.
--
-- Niyə: authenticated rolunun user_stats-a cədvəl-səviyyəli UPDATE icazəsi var, ona görə
-- sütun-səviyyəli REVOKE (0024) kifayət etmir. Trigger birbaşa müştəri (authenticated/anon)
-- is_plus/plus_until-i dəyişməyə çalışsa, köhnə dəyərləri geri qaytarır (sükutla ləğv edir).
-- SECURITY DEFINER funksiyalar (add_user_xp, grant_plus_to) owner kimi işlədiyi üçün
-- current_user 'postgres' olur — onlara təsir etmir.

create or replace function protect_plus_columns() returns trigger
language plpgsql as $$
begin
  if (new.is_plus is distinct from old.is_plus
      or new.plus_until is distinct from old.plus_until)
     and current_user in ('authenticated', 'anon') then
    new.is_plus := old.is_plus;
    new.plus_until := old.plus_until;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_plus on user_stats;
create trigger trg_protect_plus
  before update on user_stats
  for each row execute function protect_plus_columns();
