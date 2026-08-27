-- Imparo — Web Push abunələri (re-engagement bildirişləri).
-- Supabase SQL Editor-da işə salınır.
--
-- Niyə: istifadəçini geri qaytarmaq üçün (streak yanır, gündəlik quest hazırdır) push
-- göndərmək lazımdır. Brauzer abunəsi (endpoint + açarlar) burada saxlanılır; server
-- (cron) service_role ilə oxuyub web-push göndərir.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

-- İstifadəçi yalnız öz abunələrini idarə edir (oxu/əlavə/yenilə/sil).
drop policy if exists "own push select" on push_subscriptions;
create policy "own push select" on push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "own push insert" on push_subscriptions;
create policy "own push insert" on push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "own push update" on push_subscriptions;
create policy "own push update" on push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own push delete" on push_subscriptions;
create policy "own push delete" on push_subscriptions
  for delete using (auth.uid() = user_id);

-- Qeyd: göndərici (cron) service_role ilə işləyir → RLS-i keçir, hamısını oxuyur.
