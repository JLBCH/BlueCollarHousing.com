-- BlueCollarHousing · site settings
-- Joe wants to tune site behavior himself from the admin dashboard, starting
-- with the search proximity radius (previously hardcoded at 100 miles in the
-- search UI). A tiny key/value store: values are public (they configure public
-- pages, nothing secret), writes are admin-only.

create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Anyone may read settings (they drive public pages); only admins write.
drop policy if exists "settings_public_select" on public.site_settings;
create policy "settings_public_select" on public.site_settings
  for select using (true);

drop policy if exists "settings_admin_insert" on public.site_settings;
create policy "settings_admin_insert" on public.site_settings
  for insert with check (public.is_admin());

drop policy if exists "settings_admin_update" on public.site_settings;
create policy "settings_admin_update" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

-- Current behavior as the starting value.
insert into public.site_settings (key, value)
  values ('search_radius_mi', '100'::jsonb)
  on conflict (key) do nothing;
