-- Imparo — sual rəyi (feedback): istifadəçilər sualla bağlı problem bildirir.
-- Supabase SQL Editor-da işə salınır.
--
-- Niyə: praktika/dərsdə istifadəçi "cavab səhvdir / anlaşılmır / yazı xətası" kimi
--       rəy göndərə bilsin; komanda admin panelindən oxusun və düzəltsin.

create table if not exists task_feedback (
  id uuid primary key default gen_random_uuid(),
  task_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  category text not null,
  message text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table task_feedback enable row level security;

-- İstifadəçi yalnız öz adından rəy göndərə bilər (insert).
drop policy if exists "insert own feedback" on task_feedback;
create policy "insert own feedback" on task_feedback
  for insert to authenticated with check (auth.uid() = user_id);

-- Admin bütün rəyləri oxuyur, həll olundu işarələyir və silir (is_admin — bax 0012).
drop policy if exists "admin manage feedback" on task_feedback;
create policy "admin manage feedback" on task_feedback
  for all using (is_admin()) with check (is_admin());

-- Sürətli oxuma üçün: həll olunmamışlar + tarix üzrə.
create index if not exists task_feedback_open_idx
  on task_feedback (resolved, created_at desc);
