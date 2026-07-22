# Operations Runbook

Developer-facing. How to deploy, manage environment, run the database, and flip the
launch switches.

## Environments
- **Production:** Vercel project `bch-demo`, scope `samednakhlas-projects`, domain
  `bluecollarhousing.com`. Branch: `main`.
- **Supabase project:** `lyahyyfjfllvewdguypw` (free tier — see the backup warning below).

## Environment variables (Vercel production)
Secrets are encrypted in Vercel (a `vercel env pull` returns blanks). Non-`NEXT_PUBLIC_`
vars are read at runtime by server code; `NEXT_PUBLIC_` vars are **baked at build time**
(changing them requires a redeploy).

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase client |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; webhook, cron, account deletion |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Map tiles / geocoding |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_NOTIFY_EMAIL` | Transactional email + admin notify inbox |
| `SIGNUP_WEBHOOK_SECRET` | Gates `/api/hooks/new-account`; must match the DB trigger's baked value |
| `CRON_SECRET` | Gates `/api/cron/*` (Vercel sends it as `Authorization: Bearer`) |
| Stripe keys | Billing (sandbox today; live keys at launch) |
| `NEXT_PUBLIC_PAYMENTS_PAUSED` | `1` = payments paused (see below) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Anti-spam (currently unset/inert) |

Set one: `vercel env add NAME production --force --scope samednakhlas-projects < value.txt`

## Deploy
```
cd web
npx vercel --prod --scope samednakhlas-projects
```
Pre-deploy sanity: `npx tsc --noEmit && npx vitest run && npm run build`.
Smoke test after: `curl -sI https://bluecollarhousing.com` (200), `/blog`, `/sitemap.xml`.

## Database
- Migrations live in `web/supabase/migrations/`, one SQL file per change, applied in
  filename order. They are applied to prod via the **Supabase Dashboard → SQL Editor**
  (the CLI auth is not set up). Paste, Run, confirm the "destructive operations" dialog
  (it fires on `drop ... if exists` guards even when additive).
- ⚠️ **NO BACKUPS.** Prod is free-tier; there is no point-in-time recovery. ~20 listings
  were once lost unrecoverably. **Never run direct `DELETE`/`TRUNCATE`** against prod —
  use the app's owner/admin delete paths. **Upgrade to Supabase Pro before launch.**
- ⚠️ One migration carries a placeholder secret: `20260720090006_signup_notify_trigger.sql`
  has `REPLACE_WITH_SIGNUP_WEBHOOK_SECRET` in the committed file; prod has the real value
  baked in. A fresh migration run would ship the placeholder — substitute the real secret.

## Cron
- `/api/cron/unpaid-sweep` (daily, Vercel Cron via `vercel.json`) reminds and expires
  unpaid approved listings. Gated by `CRON_SECRET`. Reverts approved-unpaid-non-comp
  listings older than 28 days to draft — **do not trigger manually during the payments
  pause** without checking the blast radius first (approved-unpaid listings would be
  wrongly expired).

## Launch switches (flip when going live)
1. **Unpause payments:** `vercel env rm NEXT_PUBLIC_PAYMENTS_PAUSED production` → redeploy
   (it's baked at build time, so a redeploy is required).
2. **Live Stripe:** swap sandbox keys for the live account (created under the LLC).
3. **Terms/Privacy:** replace the placeholder text in `src/app/terms/page.tsx` with the
   lawyer's final copy.
4. **Anti-spam:** add Cloudflare Turnstile keys (site + secret) → forms enforce it.
5. **Email confirmation + SMTP:** configure Resend SMTP in Supabase Auth, then enable
   "Confirm email" (see ADMIN_GUIDE / LAUNCH_CHECKLIST).

## Useful references
- Vercel dashboard: project `bch-demo`. Supabase dashboard: SQL editor, Auth, Storage,
  Database Webhooks. Resend dashboard: domain `send.bluecollarhousing.com`, API keys.
