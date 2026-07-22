# Launch Checklist & QA Backlog

Last updated 2026-07-20. Status of the remaining work to go live, plus the findings
from the pre-launch QA / performance / accessibility audit.

## Launch blockers (must do before going live)
- [ ] **Upgrade Supabase to Pro** — prod is free-tier with **no backups**. Do this first.
- [ ] **Live Stripe under the LLC** — create the live account once the LLC is formed;
      swap sandbox keys for live keys in Vercel.
- [ ] **Unpause payments** — `vercel env rm NEXT_PUBLIC_PAYMENTS_PAUSED production` + redeploy.
- [ ] **Final Terms of Service + Privacy** — replace placeholder text in
      `src/app/terms/page.tsx` with the lawyer's copy.
- [ ] **Fix H1 (Stripe billing on delete)** — see QA findings below; real money loss at launch.
- [ ] **Email confirmation + Resend SMTP** — configure SMTP in Supabase Auth, then enable
      "Confirm email" (blocks bots + verifies real emails). See runbook at bottom.

## Launch hardening (strongly recommended before/at launch)
- [ ] **Cloudflare Turnstile** — add site + secret keys; enables the "are you human" check
      on signup + public forms (currently coded but inert).
- [ ] Verify the pay-after email cycle once live (approval → reminder → expiry) with real Stripe.

---

## QA / Performance / Accessibility findings (2026-07-20 audit)
Prioritized backlog. Nothing here is on fire today (tiny dataset, payments paused), but
several bite as traffic/listings grow. Severity: 🔴 high / 🟡 medium / ⚪ low.

### Correctness
- 🔴 **Stripe subscription not cancelled on listing delete** (`dashboard/listings/actions.ts`)
  — deleting a listing leaves its subscription billing forever; also affects cascade-deleted
  child units. Fix: cancel the listing's (and children's) subscriptions before delete,
  mirroring the admin reject path. *(Masked by the payments pause; fix before unpausing.)*
- 🟡 **Un-geocoded listings render at [0,0]** — a failed geocode stores null lat/lng, which
  `Number(null)===0` turns into a pin in the ocean, dragging `fitBounds` on `/search`. Fix:
  filter non-finite/0 coords out of map bounds + JSON-LD; consider blocking approval with no coords.
- 🟡 **Commercial listing edit doesn't refresh homepage map** (`commercial-actions.ts`) —
  missing `revalidatePath("/")`. Fix: add it (residential already does).
- 🟡 **`/api/listing-contact` emails owners regardless of status/allow_contact_form** — resolve
  via `listings_public` / check `allow_contact_form` + approved before forwarding.
- ⚪ Cascade-deleted child units orphan their Storage photos; possible duplicate Stripe subs on
  non-terminal states/double-submit; ACH async payment skips the draft→pending nudge; a
  dashboard comment says "30 days" but the cron uses 28.

### Performance (weighted for growth)
- 🔴 **`/search` ships every column of every listing and refetches the full table uncached**
  per request (`select("*")`, no `unstable_cache`). Fix: a column-scoped "card" projection +
  cache the search fetch. Biggest scaling risk.
- 🔴 **Admin listings page: one Stripe API call per subscription, every render** (N+1). Fix:
  store `current_period_end`/`cancel_at` on the row via webhook and read from Postgres; paginate.
- 🔴 **`getListingBySlug` not memoized** → 2 identical DB queries per listing page
  (generateMetadata + body). Fix: wrap in React `cache()` (one-liner).
- 🟡 `select("*")` over-fetches for map/sitemap/cities consumers; no list pagination +
  unclustered Mapbox markers; blog cover images use raw `<img>` (no optimization/CLS).
- ⚪ `getSearchRadiusMi` uncached; admin KPI counts sequential; minor map CSS in client chunk.

### Accessibility
- 🔴 **Primary search input has no accessible name** (`location-search.tsx`) — add `aria-label`.
- 🔴 **Autocomplete lacks combobox ARIA** (roles/`aria-expanded`/`aria-activedescendant`).
- 🔴 **Form errors not announced or linked to fields** (all forms) — add `role="alert"` +
  `aria-invalid`/`aria-describedby`.
- 🟡 Mobile menu isn't a managed modal (no focus trap/Escape/restore); "For Landlords"
  dropdown trigger isn't a real toggle button; placeholder-only labels + low-contrast
  placeholder (#9aa6b3 ≈2.5:1, below AA); no skip-to-content link; homepage heading skips
  h1→h3; `prefers-reduced-motion` not respected anywhere.
- ⚪ Search result count not a live region; gallery auto-scroll ignores reduced-motion.

---

## Runbook: enable email confirmation (needs the site owner's hands)
Custom SMTP is currently OFF in Supabase, so confirmation emails would use Supabase's
rate-limited built-in service. Set up Resend SMTP first, then enable confirmation:
1. Supabase → Authentication → Emails → **SMTP Settings** → enable custom SMTP.
2. Sender email `noreply@send.bluecollarhousing.com`, Sender name `BlueCollarHousing`,
   Host `smtp.resend.com`, Port `465`, Username `resend`, Password = **your Resend API key**.
   (Clear any browser-autofilled value in the password field first.)
3. **Save changes**, then send yourself a test.
4. Supabase → Authentication → Sign In / Providers → toggle **Confirm email** ON → Save.
