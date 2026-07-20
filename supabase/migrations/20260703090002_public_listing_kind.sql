-- BlueCollarHousing · 0022_public_listing_kind
-- The public view omitted listing_kind and bedroom_type, so the public search /
-- card / detail pages couldn't tell a private room from a whole place, or a
-- studio/efficiency from a 0-bedroom — they rendered "0 bd · 0 ba". Expose both.
-- Drop + recreate so the new columns can sit mid-list.

drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, listing_kind, bedroom_type,
    bedrooms, bathrooms, price_month, rate_amount, rate_billed,
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
