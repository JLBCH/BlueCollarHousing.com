-- BlueCollarHousing · 0021_security_guards
-- Two privilege-escalation fixes found in the security audit:
--   1. profiles: the owner-update RLS policy (profiles_update_own) checks only
--      that id stays the caller's, so a landlord could PATCH their own role to
--      'admin' and gain full admin powers. Pin the role for non-admins.
--   2. listings: guard_listing_status pinned status/review fields but NOT
--      is_comp or subscription_status. Those are the columns the public view
--      uses to decide if a listing is live, so an owner could PATCH their
--      approved listing live for free (bypassing Stripe entirely). Pin them.
--
-- The Stripe webhook and the cron sweep write these columns via the service-role
-- key, where auth.uid() is NULL. Both guards trust a NULL uid so those keep
-- working; RLS already prevents anon users from updating these rows at all.

-- 1. Role-escalation guard --------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Non-admin end users keep whatever role they already had. Service-role
  -- (auth.uid() null) and admins may change it.
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- 2. Payment-gate + status guard (replaces the 0014 function in place) ------
create or replace function public.guard_listing_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role (webhook/cron: auth.uid() null) and admins may change anything.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Owners may NEVER set the payment-gate columns — only Stripe (via the
  -- service-role webhook) or an admin comp can make a listing go live.
  new.is_comp := old.is_comp;
  new.subscription_status := old.subscription_status;
  new.stripe_subscription_id := old.stripe_subscription_id;

  -- Owners may submit/withdraw (draft <-> pending) but never self-approve/reject.
  if new.status is distinct from old.status and new.status not in ('draft', 'pending') then
    raise exception 'Only an admin can publish or reject a listing';
  end if;

  -- Admin review fields are read-only for owners.
  new.review_note := old.review_note;
  new.reviewed_at := old.reviewed_at;
  return new;
end;
$$;
