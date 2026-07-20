-- BlueCollarHousing · 0019_house_rules
-- Joe feedback #4: landlords want a dedicated "House rules" box, separate from
-- the free-text description, so rules (quiet hours, smoking, guests, parking,
-- deposits, etc.) are easy to find on the listing.

alter table public.listings
  add column if not exists house_rules text not null default '';

-- Recreate the public view to expose house_rules alongside the address/zip
-- columns added in 0018_address_pin. Drop + recreate so the new column can sit
-- mid-list (CREATE OR REPLACE only allows appending at the end).
drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, bedrooms, bathrooms, price_month,
    rate_amount, rate_billed,
    lease_length, description, nearby_projects, house_rules, amenities,
    utilities_included, pet_policy, city, state, zip, public_area, lat, lng,
    anonymize_address,
    case when anonymize_address then null else address end as address,
    case when show_phone then contact_phone end as contact_phone,
    show_phone,
    case when show_email then contact_email end as contact_email,
    show_email,
    allow_contact_form,
    photos,
    commercial_details,
    rates
  from public.listings
  where status = 'approved'
    and (is_comp or subscription_status in ('active', 'trialing'));

grant select on public.listings_public to anon, authenticated;
