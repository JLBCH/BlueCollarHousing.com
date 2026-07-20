-- BlueCollarHousing · 0018_address_pin
-- Joe feedback #10/#11: the "Show full address" option did nothing and the
-- "Show city and zip only" option never surfaced the zip.
--
-- The public view previously exposed neither the street `address`, the
-- `anonymize_address` flag, nor `zip`. So a landlord who chose to show their
-- full address still saw only "City, State" with an approximate pin, and a
-- landlord who chose city/zip-only never saw their zip.
--
-- Fix: expose `zip` and `anonymize_address` always, and expose the street
-- `address` ONLY when the landlord opted out of anonymizing. The street address
-- stays gated in SQL (defense in depth) so it can never leak for anonymized
-- listings even if the app forgets to check.

-- Drop + recreate (not CREATE OR REPLACE): we insert `zip` mid-list, and
-- CREATE OR REPLACE only allows appending columns at the end. Nothing else in
-- the database depends on this view, so dropping it is safe.
drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, bedrooms, bathrooms, price_month,
    rate_amount, rate_billed,
    lease_length, description, nearby_projects, amenities, utilities_included,
    pet_policy, city, state, zip, public_area, lat, lng,
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
