-- BlueCollarHousing · 0004_auth_profiles
-- Landlord/admin profiles bound to auth.users, auto-created on signup.
-- Apply in the Supabase Dashboard → SQL Editor (or via the Supabase CLI).

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  role        text not null default 'landlord'
                check (role in ('landlord','admin')),
  full_name   text not null default '',
  phone       text not null default '',
  email       text not null default ''
);

alter table public.profiles enable row level security;

-- A user can read and update their own profile. Admin-wide policies arrive in M3.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up. SECURITY DEFINER so
-- it inserts past RLS; search_path pinned for safety. full_name/phone come from
-- the signUp metadata the register form sends.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
