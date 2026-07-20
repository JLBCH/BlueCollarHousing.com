-- BlueCollarHousing · 0017_public_rates
-- Expose the free-text `rates` column on the public view. Residential listings
-- show the structured map-pin rate, but commercial listings have free-text rates
-- only, so the public listing page needs the `rates` text to display them.

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
    commercial_details,
    rates
  from public.listings
  where status = 'approved'
    and (is_comp or subscription_status in ('active', 'trialing'));

grant select on public.listings_public to anon, authenticated;
