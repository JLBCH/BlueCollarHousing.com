# Database migrations

SQL schema and seed for the BlueCollarHousing database, applied with the Supabase CLI. Until applied, the app falls back to the local seed (`src/lib/listings/seed.json`), so development works either way.

## Apply
```bash
supabase link --project-ref <project-ref>   # one-time
supabase db push                            # applies un-applied migrations
pnpm check:supabase                         # verifies listings + the security boundary
```

## Files (applied in order)
- **`20260610090001_init.sql`**, `listings` table, indexes, RLS, and the public
  read view (`listings_public`): approved rows only, no private `address`, and
  phone/email masked when the owner hides them.
- **`20260610090002_seed.sql`**, sample listings. **Generated** from the app
  seed by `pnpm seed:sql`; do not edit by hand. Idempotent (on conflict by slug).

## Notes
- Reads use the public view via the publishable key. Owner/admin write policies
  are added with authentication.
- `photos` is a `text[]` column for now; a `listing_photos` table will follow
  when uploads and reordering are added.
