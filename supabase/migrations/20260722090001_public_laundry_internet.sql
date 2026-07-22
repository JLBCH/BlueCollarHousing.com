-- BlueCollarHousing · expose laundry + internet on the public view
-- The builder saves `laundry` and `internet` to the base table, but the
-- listings_public view never selected them — which is why Joe's laundry
-- checkboxes never showed up on published listings. Recreate the view
-- (identical to 20260720090001) with those two columns added.

drop view if exists public.listings_public;
create view public.listings_public as
  select
    id, slug, status, title, property_type, listing_kind, bedroom_type,
    bedrooms, bathrooms, price_month, rate_amount, rate_billed,
    lease_length, description, nearby_projects, house_rules, amenities,
    utilities_included, pet_policy, payment_methods, room_details,
    laundry, internet,
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
