-- BlueCollarHousing · 0014_owner_status_guard
-- SECURITY FIX: the owner update RLS policy gates the row (owner_id) but not
-- which columns change, so a landlord could PATCH their own listing's `status`
-- from 'pending' to 'approved' via the API and go live without admin review —
-- bypassing the M3 approval gate. Pure RLS WITH CHECK can't see the OLD row, so
-- enforce the allowed status transitions with a BEFORE UPDATE trigger, and lock
-- down owner inserts too.

create or replace function public.guard_listing_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins (and the admin server actions) may change anything.
  if public.is_admin() then
    return new;
  end if;
  -- Owners may submit/withdraw (move among draft/pending) but never set
  -- approved/rejected themselves. Unchanged status is always allowed (so editing
  -- an already-approved listing still works).
  if new.status is distinct from old.status and new.status not in ('draft', 'pending') then
    raise exception 'Only an admin can publish or reject a listing';
  end if;
  -- review_note / reviewed_at are admin-only; silently keep the old values so an
  -- owner can't forge a decision.
  new.review_note := old.review_note;
  new.reviewed_at := old.reviewed_at;
  return new;
end;
$$;

drop trigger if exists guard_listing_status on public.listings;
create trigger guard_listing_status
  before update on public.listings
  for each row execute function public.guard_listing_status();

-- Owner inserts can't start as approved/rejected either.
drop policy if exists "listings_owner_insert" on public.listings;
create policy "listings_owner_insert" on public.listings
  for insert with check (auth.uid() = owner_id and status in ('draft', 'pending'));
