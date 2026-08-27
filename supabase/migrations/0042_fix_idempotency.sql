-- KRİTİK DÜZƏLİŞ: complete_lesson idempotent DEYİLDİ (0037-dən bəri).
--
-- Səbəb (PL/pgSQL tələsi): `insert ... on conflict do nothing returning true into is_new`
-- konflikt baş verəndə HEÇ SƏTİR qaytarmır və PostgreSQL bu halda hədəf dəyişənə
-- **NULL** təyin edir (əvvəlki `false` dəyəri saxlanmır!). Sonrakı `if not is_new then`
-- şərti `NOT NULL` = NULL kimi qiymətləndirilir → yalan sayılır → else budağı işə düşür
-- və MÜKAFAT TƏKRAR VERİLİR.
--
-- Nəticə: eyni dərsi/sandığı təkrar-təkrar "bitirməklə" hər dəfə XP və zümrüd almaq
-- mümkün idi (yalnız 0034-dəki gündəlik tavan məhdudlaşdırırdı). Test: ps-vocab 3 dəfə
-- çağırıldı → 90 XP (düzgünü 30). Düzəliş: `coalesce(is_new, false)`.

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
    if p_grant_reward then
      reward_gems := 20 * (case when coalesce(user_is_plus, false) then 2 else 1 end);
    end if;
  else
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

  insert into user_progress (user_id, lesson_id, score, completed_at)
  values (me, p_lesson_id, reward_xp, now())
  on conflict (user_id, lesson_id) do nothing
  returning true into is_new;

  -- ★ DÜZƏLİŞ: konfliktdə RETURNING sətir qaytarmır → is_new NULL olur. Onu açıq şəkildə
  --   false-a çevir, əks halda aşağıdakı `not is_new` şərti işləməz (NULL məntiqi).
  is_new := coalesce(is_new, false);

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
