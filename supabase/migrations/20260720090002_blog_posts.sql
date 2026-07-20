-- BlueCollarHousing · blog posts
-- M4 blog: admin-authored markdown posts for /blog. The admin pastes markdown
-- in /admin/blog and saves as draft, publishes now, or schedules for later.
-- Model: draft = published false · published = published true with a past
-- published_at · scheduled = published true with a FUTURE published_at (the
-- public policy below hides it until that time arrives).

create table if not exists public.blog_posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  body_md      text not null default '',
  cover_image  text,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.blog_posts enable row level security;

-- Public read: only published posts whose publish time has arrived. A future
-- published_at is a scheduled post — invisible to anon/authed until then.
drop policy if exists "blog_posts_public_select" on public.blog_posts;
create policy "blog_posts_public_select" on public.blog_posts
  for select using (published = true and published_at is not null and published_at <= now());

-- Admin full access (write posts from /admin/blog). Additional permissive
-- policies — they OR with the public select above.
drop policy if exists "blog_posts_admin_select" on public.blog_posts;
create policy "blog_posts_admin_select" on public.blog_posts
  for select using (public.is_admin());

drop policy if exists "blog_posts_admin_insert" on public.blog_posts;
create policy "blog_posts_admin_insert" on public.blog_posts
  for insert with check (public.is_admin());

drop policy if exists "blog_posts_admin_update" on public.blog_posts;
create policy "blog_posts_admin_update" on public.blog_posts
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "blog_posts_admin_delete" on public.blog_posts;
create policy "blog_posts_admin_delete" on public.blog_posts
  for delete using (public.is_admin());

-- Index for the public listing query (newest published first).
create index if not exists blog_posts_published_idx
  on public.blog_posts (published, published_at desc);

-- Explicit grants like every other table here — RLS does the real gating, but
-- we never rely on the database's default privileges staying intact.
grant select on public.blog_posts to anon, authenticated;
grant select, insert, update, delete on public.blog_posts to authenticated;
