-- BlueCollarHousing · signup_notify_trigger
-- Emails the admin whenever a new account is created, by POSTing the newly
-- inserted profile row to /api/hooks/new-account (which sends the email). Uses
-- pg_net so it fires server-side on the real INSERT — signup itself is
-- client-side, so there's no server action to hook, and this is independent of
-- the email-confirmation setting.
--
-- SECRET: the endpoint is gated by Authorization: Bearer <secret>. The literal
-- below is a PLACEHOLDER. In production the function is created with the real
-- value of Vercel's SIGNUP_WEBHOOK_SECRET substituted in (kept out of git). To
-- rotate: update SIGNUP_WEBHOOK_SECRET in Vercel AND re-create this function
-- with the matching value.

create extension if not exists pg_net;

create or replace function public.notify_new_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Fire-and-forget: pg_net queues the request, so a slow/failed notification
  -- never blocks or rolls back the signup.
  perform net.http_post(
    url := 'https://bluecollarhousing.com/api/hooks/new-account',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer REPLACE_WITH_SIGNUP_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_profile_created_notify on public.profiles;
create trigger on_profile_created_notify
  after insert on public.profiles
  for each row execute function public.notify_new_account();
