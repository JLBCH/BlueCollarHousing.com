-- BlueCollarHousing · 0003_forms
-- Public form capture: worker leads ("help me find a place") and contact
-- inquiries (general site contact + per-listing contact).
-- Insert-only for the anon role; NO public read. Admins read these through the
-- service role / Supabase dashboard (and the admin app in M3).
-- Apply in the Supabase Dashboard → SQL Editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  phone         text not null default '',
  email         text not null default '',
  job_site_city text not null default '',
  state         text not null default '',
  note          text not null default ''
);

create table if not exists public.contact_inquiries (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  kind          text not null default 'general'
                  check (kind in ('general','listing')),
  listing_id    uuid references public.listings (id) on delete set null,
  listing_slug  text not null default '',
  sender_name   text not null,
  sender_phone  text not null default '',
  sender_email  text not null default '',
  message       text not null default ''
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists inquiries_created_idx on public.contact_inquiries (created_at desc);
create index if not exists inquiries_listing_idx on public.contact_inquiries (listing_id);

alter table public.leads enable row level security;
alter table public.contact_inquiries enable row level security;

-- Anyone may submit a form (INSERT only). No SELECT/UPDATE/DELETE for anon:
-- public submissions are write-only; admins read them elsewhere.
drop policy if exists "anon can submit leads" on public.leads;
create policy "anon can submit leads"
  on public.leads for insert to anon, authenticated with check (true);

drop policy if exists "anon can submit inquiries" on public.contact_inquiries;
create policy "anon can submit inquiries"
  on public.contact_inquiries for insert to anon, authenticated with check (true);

grant insert on public.leads to anon, authenticated;
grant insert on public.contact_inquiries to anon, authenticated;
