-- BlueCollarHousing · 0005_listing_builder
-- Adds the listing-builder fields (M2 Phase 2.2), expands the property-type set,
-- and adds owner row-level security so a landlord can manage their own listings.
-- Apply in the Supabase Dashboard → SQL Editor (or via the Supabase CLI).

-- New builder fields (safe defaults so existing rows stay valid).
alter table public.listings
  add column if not exists listing_kind text not null default 'entire'
    check (listing_kind in ('entire','room')),
  add column if not exists rates text not null default '',
  add column if not exists internet text not null default 'none'
    check (internet in ('wifi','wired','none')),
  add column if not exists laundry text not null default 'none'
    check (laundry in ('in_unit','coin_op','laundromat','none')),
  add column if not exists payment_methods text not null default '',
  add column if not exists unit text not null default '',
  add column if not exists zip text not null default '';

-- Expand the property-type set. Superset: the 15 builder types plus the legacy
-- seed values, so existing rows stay valid (legacy ones get cleaned up later).
alter table public.listings drop constraint if exists listings_property_type_check;
alter table public.listings add constraint listings_property_type_check
  check (property_type in (
    -- builder (canonical) types
    'house','apartment','condo','cottage_cabin','duplex','flat','in_law',
    'townhouse','mobile_home','travel_trailer','rv_spot','rv_park','rv_resort',
    'hotel','apartment_complex',
    -- legacy seed values
    'cabin','rv','mobile-home','room'
  ));

-- Owner row-level security: a landlord can read and manage only their own rows.
-- (Public reads still go through the listings_public view; admin policies M3.)
drop policy if exists "listings_owner_select" on public.listings;
create policy "listings_owner_select" on public.listings
  for select using (auth.uid() = owner_id);

drop policy if exists "listings_owner_insert" on public.listings;
create policy "listings_owner_insert" on public.listings
  for insert with check (auth.uid() = owner_id);

drop policy if exists "listings_owner_update" on public.listings;
create policy "listings_owner_update" on public.listings
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "listings_owner_delete" on public.listings;
create policy "listings_owner_delete" on public.listings
  for delete using (auth.uid() = owner_id);
