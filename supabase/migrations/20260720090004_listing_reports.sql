-- BlueCollarHousing · listing reports
-- Joe expects ~80 imported/legacy listings he can't personally verify, so
-- renters need a way to flag a listing whose contact info is dead or whose
-- property is gone. Same shape as the public forms (0003): INSERT-only for
-- anon — public submissions are write-only; admins review and resolve them
-- from the admin dashboard.

create table if not exists public.listing_reports (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  listing_id     uuid references public.listings (id) on delete set null,
  listing_slug   text not null default '',
  listing_title  text not null default '',
  reason         text not null default 'bad-contact'
                   check (reason in ('bad-contact','not-available','other')),
  note           text not null default '',
  reporter_name  text not null default '',
  reporter_email text not null default '',
  resolved       boolean not null default false,
  resolved_at    timestamptz
);

create index if not exists reports_created_idx on public.listing_reports (created_at desc);
create index if not exists reports_open_idx on public.listing_reports (resolved, created_at desc);

alter table public.listing_reports enable row level security;

drop policy if exists "anon can submit reports" on public.listing_reports;
create policy "anon can submit reports"
  on public.listing_reports for insert to anon, authenticated with check (true);

drop policy if exists "reports_admin_select" on public.listing_reports;
create policy "reports_admin_select" on public.listing_reports
  for select using (public.is_admin());

drop policy if exists "reports_admin_update" on public.listing_reports;
create policy "reports_admin_update" on public.listing_reports
  for update using (public.is_admin()) with check (public.is_admin());

grant insert on public.listing_reports to anon, authenticated;
grant select, update on public.listing_reports to authenticated;
