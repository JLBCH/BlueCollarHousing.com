-- BlueCollarHousing · 0015_stripe
-- M3 Phase 3.1/3.2: subscription fields + paid-gating of the public read surface.
-- A listing is publicly visible only when approved AND (an active subscription
-- OR comped by admin). Also fixes the public view to expose the structured-rate
-- columns (rate_amount / rate_billed) that the app already reads.

-- One Stripe customer per landlord.
alter table public.profiles add column if not exists stripe_customer_id text;

-- Per-listing subscription state.
alter table public.listings add column if not exists stripe_subscription_id text;
alter table public.listings add column if not exists subscription_status text not null default 'none';
alter table public.listings add column if not exists is_comp boolean not null default false;

-- Existing approved listings (seed + anything already live) predate payments, so
-- comp them — otherwise the paid-gate below would hide them.
update public.listings set is_comp = true where status = 'approved';

-- Rebuild the public read surface: add rate_amount/rate_billed, and gate on
-- (active subscription OR comp). Owners/admins still read the base table directly.
-- Drop + create (not "or replace") because we're inserting new columns mid-list.
drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, bedrooms, bathrooms, price_month,
    rate_amount, rate_billed,
    lease_length, description, nearby_projects, amenities, utilities_included,
    pet_policy, city, state, public_area, lat, lng,
    case when show_phone then contact_phone end as contact_phone,
    show_phone,
    case when show_email then contact_email end as contact_email,
    show_email,
    allow_contact_form,
    photos
  from public.listings
  where status = 'approved'
    and (is_comp or subscription_status in ('active', 'trialing'));

grant select on public.listings_public to anon, authenticated;
