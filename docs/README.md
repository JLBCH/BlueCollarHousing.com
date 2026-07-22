# BlueCollarHousing — Documentation

Furnished-rental listing directory that connects blue-collar/traveling workers with
landlords near job sites. Built with Next.js 15 (App Router), Supabase (Postgres +
Auth + Storage), Stripe billing, Resend email, Mapbox, and Tailwind. Deployed on Vercel.

## Docs in this folder
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the system fits together (stack, data model, key flows).
- **[OPERATIONS.md](./OPERATIONS.md)** — env vars, deploys, database, cron, and launch switches (developer runbook).
- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** — how the site owner runs the day-to-day (approvals, blog, accounts, reports).
- **[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)** — what remains before going live, plus the QA backlog.

> These are initial drafts (2026-07-20). Treat them as living documents — update
> as the app changes. The authoritative source is always the code.

## The one-paragraph mental model
Landlords register and build a listing. It stays a **draft** until submitted, then
sits **pending** admin review. An admin **approves** it (optionally "make free" =
comped). A non-comped approval requires the landlord to pay (Stripe) before it goes
**live**; unpaid approvals get reminder emails and expire back to draft after 4 weeks.
Public visitors search by location and see approved+live listings on a map; landlords
can hide their exact address (an anonymized pin is shown instead).

Payments are currently **paused** (`NEXT_PUBLIC_PAYMENTS_PAUSED=1`) pending the LLC +
live Stripe account — see OPERATIONS.md and LAUNCH_CHECKLIST.md.
