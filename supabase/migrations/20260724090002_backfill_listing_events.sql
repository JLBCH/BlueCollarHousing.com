-- BlueCollarHousing · backfill listing lifecycle history
-- The log_listing_event trigger (20260724090001) only records events from the
-- moment it was installed. Every listing that existed before that has no rows
-- in listing_events, so the admin History panel shows nothing for them. This
-- reconstructs the history we can prove from the listings table itself:
--   submitted  <- listings.created_at  (when the row first appeared)
--   approved   <- listings.reviewed_at (for currently-approved listings)
-- admin_actions is NOT used: its rows have listing_id = null, so they can't be
-- mapped back to a listing.
--
-- Idempotent: each insert skips listings that already have that event, so this
-- is safe to re-run and won't duplicate anything the trigger later records.

-- Submitted for review (attributed to the landlord). created_at is the best
-- proxy we have for the submission moment.
insert into public.listing_events
  (listing_id, listing_slug, listing_title, event, actor_id, actor_is_admin, created_at)
select l.id, coalesce(l.slug, ''), coalesce(l.title, ''), 'submitted', l.owner_id, false, l.created_at
from public.listings l
where not exists (
  select 1 from public.listing_events e
  where e.listing_id = l.id and e.event = 'submitted'
);

-- Approved (attributed to an admin; the specific admin isn't recoverable, so
-- actor_id stays null and actor_is_admin = true → "Approved by admin").
insert into public.listing_events
  (listing_id, listing_slug, listing_title, event, actor_id, actor_is_admin, created_at)
select l.id, coalesce(l.slug, ''), coalesce(l.title, ''), 'approved', null, true, l.reviewed_at
from public.listings l
where l.status = 'approved'
  and l.reviewed_at is not null
  and not exists (
    select 1 from public.listing_events e
    where e.listing_id = l.id and e.event = 'approved'
  );
