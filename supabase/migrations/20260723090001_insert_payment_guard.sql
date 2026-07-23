-- BlueCollarHousing · pin payment-gate columns on INSERT
-- The UPDATE guard (0021) pins is_comp / subscription_status /
-- stripe_subscription_id so an owner can't PATCH a listing live for free —
-- but INSERT was only status-gated (0014: draft/pending). A crafted direct
-- API insert could smuggle subscription_status='active' into a pending row;
-- after an innocent admin approval the public-view gate
-- (is_comp OR subscription_status in (...)) would put it live without payment.
-- Close it the same way: a BEFORE INSERT trigger that silently pins the
-- payment/review columns for authenticated non-admins. Service role
-- (webhook/cron, auth.uid() null) and admins are untouched.

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
    new.review_note := null;
    new.reviewed_at := null;
    new.payment_reminder_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_listing_insert on public.listings;
create trigger guard_listing_insert
  before insert on public.listings
  for each row execute function public.guard_listing_insert();
