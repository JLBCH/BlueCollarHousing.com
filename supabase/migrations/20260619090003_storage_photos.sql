-- BlueCollarHousing · 0006_storage_photos
-- Storage bucket for listing photos: public read, owner-scoped writes (the
-- first path segment must be the uploader's user id, e.g. {uid}/{draft}/file).
-- Apply in the Supabase Dashboard → SQL Editor (or via the Supabase CLI).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos', 'listing-photos', true, 10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (the bucket is public; explicit policy also covers authenticated reads).
drop policy if exists "listing_photos_read" on storage.objects;
create policy "listing_photos_read" on storage.objects
  for select using (bucket_id = 'listing-photos');

-- Owner-scoped writes: a landlord can only write under their own user-id folder.
drop policy if exists "listing_photos_insert" on storage.objects;
create policy "listing_photos_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_photos_update" on storage.objects;
create policy "listing_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing_photos_delete" on storage.objects;
create policy "listing_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
