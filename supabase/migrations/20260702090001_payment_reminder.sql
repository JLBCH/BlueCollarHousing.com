-- BlueCollarHousing · 0020_payment_reminder
-- Approve-first / pay-after flow: an approved-but-unpaid listing sits hidden
-- (the paid gate) until the landlord completes checkout. The daily sweep nudges
-- them once, then expires the approval after 30 days so they don't pile up.
-- This column records when the reminder was sent, so the sweep emails once
-- rather than every day.

alter table public.listings
  add column if not exists payment_reminder_at timestamptz;
