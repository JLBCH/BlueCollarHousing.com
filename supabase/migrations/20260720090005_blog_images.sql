-- BlueCollarHousing · blog_images
-- Storage bucket for blog images (cover + inline body images uploaded from the
-- admin blog editor). Public read so posts render for everyone; writes are
-- admin-only via public.is_admin(). Purely additive — creates a new bucket and
-- its own policies, touches nothing existing.
-- Apply in the Supabase Dashboard → SQL Editor (or via the Supabase CLI).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images', 'blog-images', true, 10485760,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (the bucket is public; explicit policy also covers authenticated reads).
drop policy if exists "blog_images_read" on storage.objects;
create policy "blog_images_read" on storage.objects
  for select using (bucket_id = 'blog-images');

-- Admin-only writes.
drop policy if exists "blog_images_insert" on storage.objects;
create policy "blog_images_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "blog_images_update" on storage.objects;
create policy "blog_images_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());

drop policy if exists "blog_images_delete" on storage.objects;
create policy "blog_images_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());
