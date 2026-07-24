-- BlueCollarHousing · fix guard_listing_insert null review_note
-- The insert guard (20260723090001) pins payment/review columns for non-admin
-- owners, but set review_note := null. listings.review_note is `not null
-- default ''` (20260625090001), so every landlord INSERT failed with
-- "null value in column review_note violates not-null constraint" — landlords
-- could not create listings at all. Pin it to '' (the column default) instead;
-- the security intent (owner can't seed a review note) is unchanged.

create or replace function public.guard_listing_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_comp := false;
    new.subscription_status := 'none';
    new.stripe_subscription_id := null;
    new.review_note := '';
    new.reviewed_at := null;
    new.payment_reminder_at := null;
  end if;
  return new;
end;
$$;
