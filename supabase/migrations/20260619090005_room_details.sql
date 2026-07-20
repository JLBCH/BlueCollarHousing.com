-- BlueCollarHousing · 0008_room_details
-- Private Room listings capture extra detail about the room and what's shared
-- (household type, bathroom, shared amenities, free-text notes). Stored as a
-- single JSON object since these fields only apply to room listings and aren't
-- filtered/queried individually.
alter table public.listings
  add column if not exists room_details jsonb not null default '{}'::jsonb;
