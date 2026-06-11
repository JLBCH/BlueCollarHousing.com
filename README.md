# BlueCollarHousing

Furnished-rental listing directory connecting landlords with traveling workers who need housing near a job site. Workers browse and search for free; landlords subscribe to list a property.

## Stack
- **Next.js 15** (App Router, `src/` dir), **React 19**, **TypeScript**
- **Tailwind CSS v4**, design tokens in `src/app/globals.css` (`@theme`)
- **Supabase** (Postgres + Auth + Storage)
- **Mapbox GL JS** for the map
- **lucide-react** icons; fonts **Inter** + **Barlow Condensed** via `next/font`

## Getting started
```bash
pnpm install
cp .env.example .env.local   # fill in the values
pnpm dev                     # http://localhost:3000
pnpm build                   # production build
pnpm start                   # serve the production build
pnpm lint
```

## Environment
See `.env.example`. Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

## Project layout
- `src/app`, routes (App Router)
- `src/components`, UI components (layout, home sections, listings, search, brand)
- `src/lib/listings`, listing types, data access, filtering, seed data
- `src/lib/supabase`, Supabase clients (public read, server, browser)
- `supabase/migrations`, database schema + seed (see that folder's README)
- `public/`, images and brand assets

## Database
Schema and seed live in `supabase/migrations`. Apply with the Supabase CLI (`supabase db push`) or the dashboard SQL editor. `pnpm check:supabase` verifies connectivity and the read-security boundary.

## Notes
- Listing data reads through a `listings_public` view that exposes only approved rows and never the private address.
- The map component (`src/components/search/results-map.tsx`) is shared by the home, search and listing pages.
