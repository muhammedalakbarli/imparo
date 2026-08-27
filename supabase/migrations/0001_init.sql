-- Imparo — verilənlər bazası sxemi (ilkin)
-- Bu SQL Supabase layihəsində SQL Editor-da işə salınır.
-- MVP-də proqres localStorage-dadır; bu sxem persistensiyaya keçidin təməlidir.

-- 1. İstifadəçi profili (Supabase auth.users-ə bağlıdır)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  grade int not null default 5,
  created_at timestamptz not null default now()
);

-- 2. Fənlər
create table if not exists subjects (
  id text primary key,           -- məs. "riyaziyyat"
  name text not null,
  grade int not null default 5,
  icon text,
  color text,
  sort_order int not null default 0
);

-- 3. Bölmələr
create table if not exists units (
  id text primary key,
  subject_id text not null references subjects(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0
);

-- 4. Dərslər
create table if not exists lessons (
  id text primary key,
  unit_id text not null references units(id) on delete cascade,
  title text not null,
  intro text,
  sort_order int not null default 0
);

-- 5. Tapşırıqlar (sual və cavab jsonb-də saxlanılır ki, tip-çevik olsun)
create table if not exists tasks (
  id text primary key,
  lesson_id text not null references lessons(id) on delete cascade,
  type text not null check (type in ('multiple_choice','fill_blank','numeric')),
  prompt text not null,
  data jsonb not null,           -- variantlar/qəbul olunan cavablar/düzgün cavab
  xp int not null default 10,
  sort_order int not null default 0
);

-- 6. İstifadəçi proqresi (hansı dərs tamamlanıb)
create table if not exists user_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  score int not null default 0,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- 7. İstifadəçi statistikası (XP, streak)
create table if not exists user_stats (
  user_id uuid primary key references profiles(id) on delete cascade,
  total_xp int not null default 0,
  streak_days int not null default 0,
  last_active_date date
);

-- RLS: hər istifadəçi yalnız öz məlumatını görsün.
-- (Məzmun cədvəlləri — subjects/units/lessons/tasks — hamıya açıq oxunur.)
alter table profiles enable row level security;
alter table user_progress enable row level security;
alter table user_stats enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own progress" on user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own stats" on user_stats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
