-- Run in Supabase SQL Editor.
-- Supports both Supabase Auth (auth.users + RLS with publishable/anon key)
-- and backend service-role key operations.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key,
  name text not null,
  email text not null unique,
  password_hash text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key,
  user_id uuid references public.users(id) on delete cascade,
  risk_level text not null check (risk_level in ('low','medium','high','critical')),
  risk_score integer not null check (risk_score between 0 and 100),
  finding_types jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists scans_user_created_idx on public.scans(user_id, created_at desc);

alter table public.users enable row level security;
alter table public.scans enable row level security;

-- Grant table access to authenticated role for Data API access
grant select, insert, update on public.users to authenticated;
grant select, insert, delete on public.scans to authenticated;

-- RLS Policies for public.users (using (select auth.uid()) per Supabase Postgres best practices)
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select to authenticated
  using ( (select auth.uid()) = id );

drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated
  with check ( (select auth.uid()) = id );

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update to authenticated
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- RLS Policies for public.scans
drop policy if exists "scans_select_own" on public.scans;
create policy "scans_select_own" on public.scans
  for select to authenticated
  using ( (select auth.uid()) = user_id );

drop policy if exists "scans_insert_own" on public.scans;
create policy "scans_insert_own" on public.scans
  for insert to authenticated
  with check ( (select auth.uid()) = user_id );

drop policy if exists "scans_delete_own" on public.scans;
create policy "scans_delete_own" on public.scans
  for delete to authenticated
  using ( (select auth.uid()) = user_id );
