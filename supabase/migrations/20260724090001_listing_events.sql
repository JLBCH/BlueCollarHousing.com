-- BlueCollarHousing . listing lifecycle history
-- Privacy Policy 2.1 says we keep the history of a listing - when it was
-- submitted, approved, revised, or removed. Approvals already live in
-- admin_actions and complaints in listing_reports, but submitted / revised /
-- removed were not recorded (deletes are hard, so a removed listing left no
-- trace). This adds an append-only event log fed by a trigger, so every path
-- (owner submit, admin decision, edit, delete) is captured without the app
-- having to log at each call site.

create table if not exists public.listing_events (
  id             bigint generated always as identity primary key,
  -- Null once the listing is deleted (ON DELETE SET NULL); the slug/title
  -- snapshot preserves which listing a 'removed' event refers to.
  listing_id     uuid references public.listings (id) on delete set null,
  listing_slug   text not null default '',
  listing_title  text not null default '',
  event          text not null
                   check (event in ('submitted','approved','rejected','revised','removed')),
  actor_id       uuid references auth.users (id) on delete set null,
  actor_is_admin boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists listing_events_listing_idx on public.listing_events (listing_id, created_at);

alter table public.listing_events enable row level security;

drop policy if exists "listing_events_admin_select" on public.listing_events;
create policy "listing_events_admin_select" on public.listing_events
  for select using (public.is_admin());

grant select on public.listing_events to authenticated;

create or replace function public.log_listing_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev text := null;
  -- Columns that change from Stripe/cron/admin churn, not an owner edit.
  -- Stripping them before comparing rows isolates a genuine content revision.
  ignore text[] := array['status','subscription_status','stripe_subscription_id',
    'is_comp','payment_reminder_at','reviewed_at','review_note','coupon_code'];
begin
  if tg_op = 'INSERT' then
    if new.status = 'pending' then ev := 'submitted'; end if;
  elsif tg_op = 'DELETE' then
    ev := 'removed';
  elsif new.status is distinct from old.status then
    if new.status = 'pending' then ev := 'submitted';
    elsif new.status = 'approved' then ev := 'approved';
    elsif new.status = 'rejected' then ev := 'rejected';
    end if;
  elsif (to_jsonb(new) - ignore) is distinct from (to_jsonb(old) - ignore) then
    ev := 'revised';
  end if;

  if ev is not null then
    insert into public.listing_events
      (listing_id, listing_slug, listing_title, event, actor_id, actor_is_admin)
    values (
      case when tg_op = 'DELETE' then null else new.id end,
      case when tg_op = 'DELETE' then old.slug else new.slug end,
      case when tg_op = 'DELETE' then old.title else new.title end,
      ev, auth.uid(), coalesce(public.is_admin(), false)
    );
  end if;
  return null;
end;
$$;

drop trigger if exists log_listing_event on public.listings;
create trigger log_listing_event
  after insert or update or delete on public.listings
  for each row execute function public.log_listing_event();
