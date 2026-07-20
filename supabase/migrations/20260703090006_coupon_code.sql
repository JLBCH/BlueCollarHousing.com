-- BlueCollarHousing · 0026_coupon_code
-- Record which promo code (if any) a listing's subscription was created with,
-- so the admin can see it on the review screen. Captured by the Stripe webhook
-- at checkout. Not exposed on the public view.

alter table public.listings
  add column if not exists coupon_code text;
