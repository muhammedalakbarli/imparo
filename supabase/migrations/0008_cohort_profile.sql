-- Imparo — get_cohort-a username + avatar əlavə (liqadan public profilə keçid üçün).
-- Return tipi dəyişdiyi üçün əvvəl DROP. Supabase SQL Editor-da işə salınır.

drop function if exists get_cohort(text, int);

create or replace function get_cohort(p_week text, p_size int default 15)
returns table(
  user_id uuid, name text, username text, avatar jsonb,
  weekly_xp int, tier int, is_me boolean
)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare my_tier int;
begin
  select coalesce(l.tier, 0) into my_tier from league l where l.user_id = auth.uid();
  if my_tier is null then my_tier := 0; end if;
  insert into league(user_id, name, tier, weekly_xp, week)
  select auth.uid(),
    coalesce((select pr.name from profiles pr where pr.id = auth.uid()), 'İstifadəçi'),
    my_tier, 0, p_week
  where auth.uid() is not null on conflict(user_id) do nothing;
  return query
    select l.user_id, l.name, p.username, p.avatar,
      (case when l.week = p_week then l.weekly_xp else 0 end)::int,
      l.tier, (l.user_id = auth.uid())
    from league l
    left join profiles p on p.id = l.user_id
    where l.tier = my_tier
    order by (case when l.week = p_week then l.weekly_xp else 0 end) desc, l.updated_at asc
    limit p_size;
end; $$;
grant execute on function get_cohort(text, int) to authenticated;
