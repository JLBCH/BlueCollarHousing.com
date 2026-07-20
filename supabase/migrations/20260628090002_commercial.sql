-- BlueCollarHousing · 0016_commercial
-- M3 Phase 3.6: commercial listings (RV Park / Hotel / Apartment Complex) reuse
-- the listings table. Type-specific fields (hookups, room types, etc.) live in a
-- commercial_details JSONB blob; everything else (title=name, location, photos,
-- pet policy, free-text rates) uses existing columns. Identified by property_type.

alter table public.listings add column if not exists commercial_details jsonb not null default '{}';

-- Expose commercial_details on the public view (appended at the end, which
-- create-or-replace allows).
create or replace view public.listings_public as
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
    photos,
    commercial_details
  from public.listings
  where status = 'approved'
    and (is_comp or subscription_status in ('active', 'trialing'));

grant select on public.listings_public to anon, authenticated;
