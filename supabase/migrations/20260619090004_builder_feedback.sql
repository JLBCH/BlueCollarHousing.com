-- BlueCollarHousing · 0007_builder_feedback
-- Listing-builder changes from Joe's first-round feedback:
--   * Property type "Other" with a free-text label
--   * Internet as a multi-select (e.g. WiFi AND wired) stored comma-joined
--   * Laundry adds "Free laundry on site"
--   * Open-plan units: Studio / Efficiency captured as a bedroom type

-- Property type: allow 'other'; store the owner's custom label separately.
alter table public.listings drop constraint if exists listings_property_type_check;
alter table public.listings add constraint listings_property_type_check
  check (property_type in (
    -- builder (canonical) types
    'house','apartment','condo','cottage_cabin','duplex','flat','in_law',
    'townhouse','mobile_home','travel_trailer','rv_spot','rv_park','rv_resort',
    'hotel','apartment_complex','other',
    -- legacy seed values
    'cabin','rv','mobile-home','room'
  ));
alter table public.listings
  add column if not exists property_type_other text not null default '';

-- Internet: now multiple values can apply (WiFi + plug-in). Stored comma-joined
-- (e.g. 'wifi,wired'), so drop the single-value check.
alter table public.listings drop constraint if exists listings_internet_check;

-- Laundry: add a "free laundry on site" option.
alter table public.listings drop constraint if exists listings_laundry_check;
alter table public.listings add constraint listings_laundry_check
  check (laundry in ('in_unit','coin_op','laundromat','free_onsite','none'));

-- Bedrooms: open-plan units use a type label (studio/efficiency); bedrooms stays 0.
alter table public.listings
  add column if not exists bedroom_type text not null default '';
