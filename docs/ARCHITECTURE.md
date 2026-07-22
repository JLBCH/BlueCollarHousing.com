# Architecture

## Stack
- **Framework:** Next.js 15 App Router (React 19), TypeScript, Tailwind CSS.
- **Data/Auth:** Supabase — Postgres with Row-Level Security (RLS), Supabase Auth
  (email/password), Supabase Storage (listing photos, blog images).
- **Payments:** Stripe (subscriptions; one per listing).
- **Email:** Resend (transactional) via a thin REST wrapper (`src/lib/email/send.ts`).
- **Maps:** Mapbox — a static raster on the homepage; interactive GL map on `/search`.
- **Hosting:** Vercel (production project `bch-demo`, domain `bluecollarhousing.com`).

## Directory map (web/src)
- `app/` — routes. Public pages, `dashboard/` (landlord), `admin/` (owner), `api/`
  (form endpoints, Stripe webhook, cron, the signup-notify hook).
- `components/` — UI, grouped by area (`search/`, `listings/`, `admin/`, `auth/`, `blog/`).
- `lib/` — server/data logic: `listings/`, `supabase/` (server/client/admin/middleware),
  `email/`, `stripe.ts`, `admin.ts` (admin gating), `settings.ts`, `blog.ts`.
- `supabase/migrations/` — the database schema, one SQL file per change, applied in order.

## Data model (core tables)
- **profiles** — one per auth user; `role` is `landlord` or `admin`. Auto-created on
  signup by the `handle_new_user()` trigger.
- **listings** — the heart of the app. `status` (draft/pending/approved/rejected),
  `is_comp`, Stripe fields, address + anonymization fields, rates, amenities, photos[].
  `owner_id → auth.users` (ON DELETE SET NULL). Linked units (multi-unit) reference a
  primary listing (ON DELETE CASCADE).
- **listings_public** — a VIEW that exposes only public-safe columns and pre-shifts
  lat/lng for anonymized rows (the secret offset never leaves the DB). Anon reads go
  through this, never the base table.
- **blog_posts**, **site_settings** (e.g. search radius), **listing_reports**,
  **leads**, **contact_inquiries**, **coupons**, **admin_actions** (audit log).

## Security model (important)
- **RLS on every table**, plus a `public.is_admin()` SECURITY DEFINER helper. Anon
  users get INSERT-only on public form tables and SELECT only through `listings_public`.
- **App-level admin gate** (`src/lib/admin.ts`): `requireAdmin()` for pages,
  `adminAction()` for server actions. Needed because an RLS-filtered zero-row write
  returns no error — the app check prevents false "success" for non-admins.
- **DB guards** (`guard_profile_role`, `guard_listing_status`): BEFORE UPDATE triggers
  that pin sensitive columns (role, is_comp, subscription_status, status transitions) so
  a landlord can't self-promote to admin or self-publish a listing for free.
- **Service-role key** is server-only (`src/lib/supabase/admin.ts`) — used by the Stripe
  webhook, the cron, and account deletion. Never import it into client code.

## Key flows
- **Signup:** client-side `supabase.auth.signUp` (register-form) → `handle_new_user()`
  creates the profile → a `pg_net` trigger POSTs to `/api/hooks/new-account` → admin
  gets a "new account" email.
- **Listing lifecycle:** draft → (submit) pending → (admin) approved/rejected. Approved
  non-comp listings need Stripe checkout to go live; the daily cron
  (`/api/cron/unpaid-sweep`) reminds then expires unpaid approvals (day 3/10/17/24 →
  expire at 28).
- **Search:** `/search` geocodes the query (Mapbox), filters approved listings within
  the admin-configured radius, renders list + map.
- **Address anonymization:** landlord sets `anonymize_address`; the base `address` is
  nulled for the public and `listings_public` serves a lat/lng offset ~500 ft by a
  secret per-row random vector (irreversible, computed in SQL).

## Caching
- React `cache()` dedupes per-request DB reads (`getListings`, `getCities`).
- `unstable_cache(..., { revalidate })` for site-wide bits (footer cities); homepage
  uses `revalidate = 3600`.
- Never embed `new Date()` in a cached query (unique keys defeat memoization) — RLS
  already enforces published/date filters.
