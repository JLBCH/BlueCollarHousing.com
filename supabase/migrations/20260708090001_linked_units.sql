-- BlueCollarHousing · linked units (primary + additional units)
-- Additional units at one address are now explicitly linked to their PRIMARY
-- listing via parent_listing_id, instead of being inferred by matching address.
-- This makes primary/secondary marking explicit, caps sub-units per primary,
-- and lets the public view hide a unit whenever its primary isn't live — which
-- closes the "pay the $99 primary, add $10 units, then cancel the primary and
-- keep the units for $10" loophole. Deleting a primary removes its units.

alter table public.listings
  add column if not exists parent_listing_id uuid
    references public.listings(id) on delete cascade;

create index if not exists listings_parent_idx
  on public.listings(parent_listing_id);

-- Rebuild the public read view: same projection as before, plus a secondary unit
-- (parent_listing_id set) is only visible when its primary is ALSO live.
drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, listing_kind, bedroom_type,
    bedrooms, bathrooms, price_month, rate_amount, rate_billed,
    lease_length, description, nearby_projects, house_rules, amenities,
    utilities_included, pet_policy, payment_methods, room_details,
    city, state, zip, public_area, lat, lng,
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
