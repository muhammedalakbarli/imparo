-- Content cədvəlləri üçün təhlükəsizlik: hamıya yalnız OXUMA (public read-only).
-- RLS artıq aktivdir; burada yalnız SELECT policy əlavə olunur.
-- INSERT/UPDATE/DELETE policy YOXDUR → yalnız service_role (seed) yaza bilər.

alter table subjects enable row level security;
alter table units enable row level security;
alter table lessons enable row level security;
alter table tasks enable row level security;

create policy "public read subjects" on subjects for select using (true);
create policy "public read units" on units for select using (true);
create policy "public read lessons" on lessons for select using (true);
create policy "public read tasks" on tasks for select using (true);
