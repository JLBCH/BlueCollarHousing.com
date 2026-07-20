-- BlueCollarHousing · gate exact coordinates in SQL (defense in depth)
-- The street `address` has been SQL-gated since 0018 so it can never leak for
-- anonymized listings even if the app forgets to check — but `lat`/`lng` were
-- still exposed exact, so anyone querying listings_public directly with the
-- publishable key could recover the precise spot the app's jitter hides.
--
-- Fix: each listing gets a SECRET random pin offset (500-600 ft, stored in
-- base-table columns the public view never selects), and the view serves
-- lat/lng pre-shifted by it for anonymized listings. Random-per-row (not a
-- hash of the slug) on purpose: a hash-derived offset is a pure function of
-- public data, so anyone could compute it and subtract to recover the exact
-- point. Stored offsets are stable (the pin never jumps between queries) and
-- unrecoverable without base-table access. Exact coordinates stay admin/owner
-- only; the app no longer jitters database rows (it would stack offsets).

-- Volatile defaults are evaluated per row, so the backfill rewrite gives every
-- existing listing its own offset, and future inserts get one automatically.
alter table public.listings
  add column if not exists pin_angle double precision not null
    default (random() * 2 * pi()),
  add column if not exists pin_dist_ft double precision not null
    default (500 + random() * 100);

drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, listing_kind, bedroom_type,
    bedrooms, bathrooms, price_month, rate_amount, rate_billed,
    lease_length, description, nearby_projects, house_rules, amenities,
    utilities_included, pet_policy, payment_methods, room_details,
    city, state, zip, public_area,
    case
      when anonymize_address and lat is not null and lng is not null then
        lat + pin_dist_ft * cos(pin_angle) / 364000
      else lat
    end as lat,
    case
      when anonymize_address and lat is not null and lng is not null then
        lng + pin_dist_ft * sin(pin_angle)
            / (364000 * greatest(0.2, cos(radians(lat))))
      else lng
    end as lng,
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
  from public.listings l
  where status = 'approved'
    and (is_comp or subscription_status in ('active', 'trialing', 'past_due'))
    and (
      parent_listing_id is null
      or exists (
        select 1 from public.listings p
        where p.id = l.parent_listing_id
          and p.status = 'approved'
          and (p.is_comp or p.subscription_status in ('active', 'trialing', 'past_due'))
      )
    );

grant select on public.listings_public to anon, authenticated;
