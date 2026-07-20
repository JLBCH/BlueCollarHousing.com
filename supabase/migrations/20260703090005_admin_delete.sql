-- BlueCollarHousing · 0025_admin_delete
-- Admins can already select + update any listing (0011_admin). Give them delete
-- too, so an admin can remove any listing for cause. Owners keep their existing
-- owner-scoped delete policy; this is additive.

drop policy if exists "listings_admin_delete" on public.listings;
create policy "listings_admin_delete" on public.listings
  for delete using (public.is_admin());
