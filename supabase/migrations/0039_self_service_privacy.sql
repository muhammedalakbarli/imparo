-- Özünə-xidmət məxfilik hüquqları (silmə + ixrac) — məxfilik siyasəti bunu "Ayarlar"da vəd edirdi,
-- amma yalnız admin silə bilirdi. Platformanın bütün istifadəçiləri uşaqdır (1-8-ci sinif) — bu,
-- xüsusilə əhəmiyyətlidir. Bütün FK-lər artıq `on delete cascade`/`set null` ilə düzgün qurulub
-- (profiles → auth.users cascade, digər cədvəllər → profiles/auth.users cascade) — auth.users
-- sətrini silmək bütün əlaqəli məlumatı (progress, stats, dostluqlar, liqa və s.) təmizləyir.

-- İstifadəçi öz hesabını silir (təsdiqsiz-geri-qaytarılmaz!). Admin təsdiqi lazım deyil — özünündür.
create or replace function delete_own_account()
returns void language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  -- Audit izi (auth.users silinəndən sonra user_id avtomatik null olur — bax security_events FK).
  perform log_security_event('self_delete_account', null, jsonb_build_object('user_id', me));
  delete from auth.users where id = me;
end; $$;
grant execute on function delete_own_account() to authenticated;

-- İstifadəçi öz məlumatının strukturlaşdırılmış JSON çıxarışını alır (GDPR-tərzi "məlumatlarımı ver").
create or replace function export_own_data()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  result jsonb;
begin
  if me is null then
    return jsonb_build_object('error', 'not authenticated');
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) - 'id' from profiles p where p.id = me),
    'stats', (select to_jsonb(s) - 'user_id' from user_stats s where s.user_id = me),
    'completed_lessons', (
      select coalesce(jsonb_agg(jsonb_build_object('lesson_id', up.lesson_id, 'score', up.score, 'completed_at', up.completed_at)), '[]'::jsonb)
      from user_progress up where up.user_id = me
    ),
    'league', (select to_jsonb(l) - 'user_id' from league l where l.user_id = me),
    'leaderboard_history', (
      select coalesce(jsonb_agg(jsonb_build_object('week', lb.week, 'xp', lb.xp)), '[]'::jsonb)
      from leaderboard lb where lb.user_id = me
    ),
    'friends', (
      select coalesce(jsonb_agg(case when f.a = me then f.b else f.a end), '[]'::jsonb)
      from friendships f where f.a = me or f.b = me
    )
  ) into result;

  return result;
end; $$;
grant execute on function export_own_data() to authenticated;
