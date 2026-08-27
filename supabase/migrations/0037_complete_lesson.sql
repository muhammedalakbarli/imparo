-- Kök-səbəb düzəlişi: dərs bitimi mükafatı (XP+zümrüd) indiyədək TAMAMİLƏ client-etibarlı idi —
-- client "mən bu qədər qazandım" deyirdi (finalXp), server yalnız YUXARI HƏDDİNİ yoxlayırdı (0033/
-- 0034), amma HEÇ VAXT "bu dərsi doğrudan bitirdinmi, artıq mükafatlandırılıbmı" yoxlamırdı. Nəticə:
-- eyni dərsi təkrar-təkrar "bitirərək" gündəlik tavana (300 gems/1500 XP) qədər hər gün sərbəst
-- doldurmaq mümkün idi.
--
-- Bu RPC XP/gems-i SERVER-DƏ, dərsin HƏQİQİ tapşırıq sayından hesablayır (client heç bir məbləğ
-- göndərmir) və `user_progress`-un artıq mövcud olan `primary key (user_id, lesson_id)`-ni
-- İDEMPOTENTLİK açarı kimi işlədir: eyni dərs ikinci dəfə "bitirilsə", sıfır əlavə mükafat verilir.
--
-- p_grant_reward=false — YALNIZ onboarding diaqnostikası üçün (bildiyi dərsi XP-siz "bilinən" kimi
-- işarələmək, bax app/onboarding/page.tsx) — bu halda belə YENƏ DƏ heç bir mükafat verilmir, yalnız
-- tamamlanma statusu yazılır.

create or replace function complete_lesson(p_lesson_id text, p_grant_reward boolean default true)
returns table(xp int, gems int, already_completed boolean)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  main_count int;
  reward_xp int := 0;
  reward_gems int := 0;
  is_new boolean := false;
  user_is_plus boolean;
begin
  if me is null then
    return query select 0, 0, false;
    return;
  end if;

  -- Dərsin həqiqətən mövcud olub-olmadığını və əsas (bonus olmayan) tapşırıq sayını tap.
  select count(*) into main_count
  from tasks
  where lesson_id = p_lesson_id
    and coalesce((data->>'bonus')::boolean, false) = false;

  if main_count = 0 then
    return query select 0, 0, false;  -- yanlış/mövcud olmayan lesson_id
    return;
  end if;

  if p_grant_reward then
    reward_xp := least(2 * main_count, 500);          -- add_user_xp-in tək-çağırış tavanı ilə uyğun
    select coalesce(is_plus, false) into user_is_plus from user_stats where user_id = me;
    reward_gems := 5 * (case when coalesce(user_is_plus, false) then 2 else 1 end); -- GEMS_PER_LESSON=5
  end if;

  -- İDEMPOTENTLİK: yalnız sətir HƏQİQƏTƏN daxil olarsa (ilk dəfədirsə) mükafat ver.
  insert into user_progress (user_id, lesson_id, score, completed_at)
  values (me, p_lesson_id, reward_xp, now())
  on conflict (user_id, lesson_id) do nothing
  returning true into is_new;

  if not is_new then
    reward_xp := 0;
    reward_gems := 0;
  else
    if reward_xp > 0 then
      perform add_user_xp(reward_xp, true);
    end if;
    if reward_gems > 0 then
      perform add_gems(reward_gems);
    end if;
  end if;

  return query select reward_xp, reward_gems, not is_new;
end; $$;
grant execute on function complete_lesson(text, boolean) to authenticated;

-- ══════════════ user_progress-ı RPC-only et ══════════════
-- İndiyədək client birbaşa upsert edirdi (istənilən lesson_id/score) — artıq YALNIZ complete_lesson
-- RPC-dən yazıla bilər (o da SECURITY DEFINER olduğu üçün öz sahibinin adından yazır, buradan təsirlənmir).
drop policy if exists "own progress" on user_progress;
drop policy if exists "own progress read" on user_progress;
create policy "own progress read" on user_progress
  for select using (auth.uid() = user_id);
revoke insert, update, delete on user_progress from authenticated, anon;
