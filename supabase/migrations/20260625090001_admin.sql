-- BlueCollarHousing · 0011_admin
-- M3 Phase 3.3: admin approval workflow. Adds an is_admin() helper, admin RLS
-- (read/update any listing, read any profile), an audit log, and review fields
-- so a rejected landlord can see the admin's note.

-- Who is an admin? SECURITY DEFINER so it reads profiles past RLS (the table
-- owner bypasses RLS, which also avoids policy recursion).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Admin can read and update any listing (for the queue + approve/reject).
-- These are additional permissive policies — they OR with the owner policies.
drop policy if exists "listings_admin_select" on public.listings;
create policy "listings_admin_select" on public.listings
  for select using (public.is_admin());

drop policy if exists "listings_admin_update" on public.listings;
create policy "listings_admin_update" on public.listings
  for update using (public.is_admin()) with check (public.is_admin());

-- Admin can read any profile (account management + showing owner on the queue).
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());

-- Review note + timestamp, surfaced to the landlord on their dashboard.
alter table public.listings add column if not exists review_note text not null default '';
alter table public.listings add column if not exists reviewed_at timestamptz;

-- Audit trail of every admin decision.
create table if not exists public.admin_actions (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  listing_id  uuid references public.listings (id) on delete set null,
  action      text not null check (action in ('approved','rejected')),
  note        text not null default '',
  created_at  timestamptz not null default now()
);
alter table public.admin_actions enable row level security;

drop policy if exists "admin_actions_admin_select" on public.admin_actions;
create policy "admin_actions_admin_select" on public.admin_actions
  for select using (public.is_admin());

drop policy if exists "admin_actions_admin_insert" on public.admin_actions;
create policy "admin_actions_admin_insert" on public.admin_actions
  for insert with check (public.is_admin() and auth.uid() = actor_id);
