-- BlueCollarHousing · 0010_rate_limit
-- Durable, cross-instance rate limiting for the public form endpoints. The
-- in-memory limiter only caps bursts within a single warm serverless instance;
-- this shared store enforces the cap globally. Only the SECURITY DEFINER
-- function touches the table (RLS on, no policies → no direct anon access).

create table if not exists public.form_rate_limits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);
create index if not exists form_rate_limits_bucket_idx
  on public.form_rate_limits (bucket, created_at);

alter table public.form_rate_limits enable row level security;
-- no policies on purpose: reachable only via check_rate_limit() below.

-- Returns true if the hit is allowed (and records it), false if the bucket has
-- already reached p_max within p_window_seconds.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_max int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Opportunistic prune so the table stays small (keep ~6 windows of history).
  delete from public.form_rate_limits
    where created_at < now() - make_interval(secs => p_window_seconds * 6);

  select count(*) into v_count
    from public.form_rate_limits
   where bucket = p_bucket
     and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max then
    return false;
  end if;

  insert into public.form_rate_limits (bucket) values (p_bucket);
  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated;
