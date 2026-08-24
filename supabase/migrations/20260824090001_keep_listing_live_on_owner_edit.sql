-- BlueCollarHousing · keep an approved listing live when its owner edits it
--
-- The Aug 6 security_remediation migration taught guard_listing_status to force
-- an approved listing back to 'pending' on any material_change. In production
-- that took real, already-live listings offline the moment a landlord opened
-- Edit and saved — and it fired even on near-empty re-saves, because the edit
-- form re-normalizes fields (price_month ?? 0, bedrooms || 0, room_details : {}),
-- so a stored null becomes 0/{} and reads as a change. Confirmed on 4 listings
-- (Boling TX, Moline IL, Roseville CA, a test) that each got approved, flipped
-- back to pending by an owner edit, then had to be re-approved.
--
-- Option A: owner edits to an approved listing keep it LIVE. Every other
-- guarantee is preserved verbatim — owners still can't self-approve/reject,
-- can't touch billing/identity/review fields, and can't change a priced
-- listing's tier-defining category. Revisions are still captured in
-- listing_events (as 'revised') and the admin is notified out-of-band by the
-- app, so review of edits is not lost — the listing just doesn't disappear.

create or replace function public.guard_listing_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Service-role webhooks/jobs (no auth uid) and authenticated admins retain
  -- full control over review, billing, and listing classification fields.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Identity, billing, review, and private pin-randomization fields are never
  -- owner-managed, even when sent through PostgREST directly.
  new.id := old.id;
  new.created_at := old.created_at;
  new.owner_id := old.owner_id;
  new.is_comp := old.is_comp;
  new.subscription_status := old.subscription_status;
  new.stripe_subscription_id := old.stripe_subscription_id;
  new.coupon_code := old.coupon_code;
  new.payment_reminder_at := old.payment_reminder_at;
  new.pin_angle := old.pin_angle;
  new.pin_dist_ft := old.pin_dist_ft;

  -- Once a listing has been approved or has entered a paid/comped lifecycle,
  -- its price-defining relationship and category cannot be changed by its
  -- owner. Admin/service-role correction paths remain available above.
  if old.status = 'approved'
     or old.is_comp
     or old.stripe_subscription_id is not null
     or old.subscription_status is distinct from 'none' then
    new.parent_listing_id := old.parent_listing_id;
    new.property_type := old.property_type;
  end if;

  -- Owners may submit or withdraw, but may not publish/reject themselves.
  if new.status is distinct from old.status
     and new.status not in ('draft', 'pending') then
    raise exception 'Only an admin can publish or reject a listing';
  end if;

  -- Option A: an owner editing their approved listing keeps it live. We no
  -- longer force status back to 'pending' on a content change. Review fields
  -- remain admin-only (an owner can't forge a decision).
  new.review_note := old.review_note;
  new.reviewed_at := old.reviewed_at;

  return new;
end;
$$;
