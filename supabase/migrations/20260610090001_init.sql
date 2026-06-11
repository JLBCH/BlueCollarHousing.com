-- BlueCollarHousing · 0001_init
-- Listings schema, indexes, RLS, and a public read view.
-- Apply in the Supabase Dashboard → SQL Editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

create table if not exists public.listings (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  owner_id           uuid references auth.users (id) on delete set null,
  status             text not null default 'pending'
                       check (status in ('draft','pending','approved','rejected')),
  slug               text not null unique,
  title              text not null,
  property_type      text not null
                       check (property_type in
                         ('house','cabin','rv','duplex','mobile-home','apartment','room')),
  bedrooms           int not null default 0,
  bathrooms          numeric not null default 0,
  price_month        int not null default 0,
  lease_length       text not null default '',
  description        text not null default '',
  -- Free-text nearby plants/projects the owner knows of (replaces facility DB).
  nearby_projects    text not null default '',
  amenities          text[] not null default '{}',
  utilities_included boolean not null default false,
  pet_policy         text not null default 'no'
                       check (pet_policy in ('allowed','no','case_by_case')),
  city               text not null default '',
  state              text not null default '',
  public_area        text not null default '',
  lat                double precision,
  lng                double precision,
  -- Private: exact address, for admin verification only. NEVER exposed publicly.
  address            text,
  anonymize_address  boolean not null default false,
  contact_phone      text,
  show_phone         boolean not null default true,
  contact_email      text,
  show_email         boolean not null default false,
  allow_contact_form boolean not null default true,
  is_comp            boolean not null default false,
  photos             text[] not null default '{}'
);

create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_city_idx   on public.listings (city);
create index if not exists listings_state_idx  on public.listings (state);
create index if not exists listings_type_idx   on public.listings (property_type);
create index if not exists listings_price_idx  on public.listings (price_month);

-- RLS: base table is NOT publicly readable (protects address + hidden contacts).
-- Owner + admin write/read policies are added with authentication.
alter table public.listings enable row level security;

-- Public read surface: approved rows only, no private address, contact info
-- masked when the owner chose to hide it.
create or replace view public.listings_public as
  select
    id, slug, status, title, property_type, bedrooms, bathrooms, price_month,
    lease_length, description, nearby_projects, amenities, utilities_included,
    pet_policy, city, state, public_area, lat, lng,
    case when show_phone then contact_phone end as contact_phone,
    show_phone,
    case when show_email then contact_email end as contact_email,
    show_email,
    allow_contact_form,
    photos
  from public.listings
  where status = 'approved';

grant select on public.listings_public to anon, authenticated;
