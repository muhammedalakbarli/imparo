-- Bölmə strukturu: adi dərsdən başqa iki xüsusi düyün növü əlavə olunur —
--   • "chest" (bölmə sandığı): tapşırığı YOXDUR, açılanda sabit zümrüd verir
--   • "test"  (bölmə sonu testi): tapşırıqları bölmənin dərslərindən yığılır (adi kimi işləyir)
-- complete_lesson RPC indiyədək tapşırıq sayına görə mükafat hesablayırdı; sandığın tapşırığı
-- olmadığı üçün o, "yanlış lesson_id" kimi qiymətləndirilib heç nə etmirdi → sandıq heç vaxt
-- tamamlanmazdı və yol (path) həmin düyündə ilişərdi. Bu migration onu düzəldir.

alter table lessons add column if not exists kind text not null default 'lesson';

-- Yalnız gözlənilən dəyərlər (məzmun seed-i səhv yazsa erkən görünsün).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lessons_kind_check'
  ) then
    alter table lessons add constraint lessons_kind_check
      check (kind in ('lesson', 'chest', 'test'));
  end if;
end $$;

create or replace function complete_lesson(p_lesson_id text, p_grant_reward boolean default true)
returns table(xp int, gems int, already_completed boolean)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  l_kind text;
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

  select kind into l_kind from lessons where id = p_lesson_id;
  if l_kind is null then
    return query select 0, 0, false;  -- belə dərs yoxdur
    return;
  end if;

  select coalesce(is_plus, false) into user_is_plus from user_stats where user_id = me;

  if l_kind = 'chest' then
    -- Sandıq: tapşırıq yoxdur, sabit zümrüd mükafatı (Plus 2×).
    if p_grant_reward then
      reward_gems := 20 * (case when coalesce(user_is_plus, false) then 2 else 1 end);
    end if;
  else
    -- Adi dərs və bölmə testi: mükafat HƏQİQİ tapşırıq sayından hesablanır.
    select count(*) into main_count
    from tasks
    where lesson_id = p_lesson_id
      and coalesce((data->>'bonus')::boolean, false) = false;

    if main_count = 0 then
      return query select 0, 0, false;
      return;
    end if;

    if p_grant_reward then
      reward_xp := least(2 * main_count, 500);
      reward_gems := 5 * (case when coalesce(user_is_plus, false) then 2 else 1 end);
    end if;
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
