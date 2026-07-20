-- BlueCollarHousing · 0009_structured_rate
-- A structured rate (amount + billing period) drives the map preview card.
-- Separate from the existing free-text `rates` box, which stays for full detail
-- on the listing page. "call" = call for rates (no amount).
alter table public.listings
  add column if not exists rate_amount numeric,
  add column if not exists rate_billed text not null default 'call'
    check (rate_billed in ('weekly','four_weeks','monthly','call'));
