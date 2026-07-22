# Admin Guide (site owner)

Plain-language guide to running BlueCollarHousing from the admin dashboard. Sign in with
your admin account, then open **/admin**. (Only accounts with the `admin` role see it.)

## The tabs
- **Admin (home)** — the review queue: listings waiting for your approval.
- **Landlords / Accounts** — everyone who has registered; search, and delete spam accounts.
- **Blog** — write and publish posts.
- **Reports** — problems renters flagged on listings (e.g. bad contact info).
- **Settings** — site settings you can tune (e.g. the search radius).
- **Coupons** — discount / free-year codes.

## Approving listings
When a landlord submits a listing it shows up in your review queue as **pending**.
- **Approve** — the listing is accepted. If it's a paid listing, the landlord then
  completes checkout to make it live. If it isn't paid within 4 weeks, it automatically
  reminds them and eventually goes back to a draft.
- **Approve & make free (comp)** — accepts it *and* publishes it live with no payment
  needed. Use this for phone-in landlords, partners, or anyone you want to host for free.
- **Reject** — sends it back with a note (required) explaining what to fix. If it was a
  paid listing, rejecting also cancels its billing.

## Managing accounts (spam cleanup)
On the **Landlords** page, each non-admin row has a **Delete** button. It asks you to
confirm first — it names the email and warns if that person has any listings — then
permanently removes the account and anything they posted. Admin accounts (you) can't be
deleted here. **Deleting is permanent — there is no undo**, so read the confirmation.

You'll also get an **email whenever anyone creates an account** (to your notify inbox),
so spam signups are easy to catch and clear.

## The blog
On **Blog → New post**, fill in:
- **Title** — the headline.
- **Slug (URL)** — auto-fills from the title; it's the link ending. Don't change it after
  publishing (it breaks shared links).
- **Cover image** — the top photo / thumbnail. Use **Upload** to attach a file, or paste a URL.
- **Excerpt** — a 1–2 sentence summary shown in the blog list and search results.
- **Markdown** — the article body. Use `#` for headings, `**bold**`, `-` for bullets. The
  **Insert image** button above the box uploads a photo and drops it in at your cursor.
- The live **preview** on the right shows exactly how it'll look.
Then **Publish now**, **Schedule** for later, or **Save draft**.

## Reports
The **Reports** tab lists issues renters flagged (bad/dead contact info, listing not
available). Review each and act on the listing (edit, unpublish, or contact the landlord).

## Settings
Adjust site-wide values like the **search radius** (how many miles from a searched
location listings appear). Changes take effect on the public site shortly after saving.

## Coupons
Create codes for a free first year or a discount. Codes can be restricted to a specific
email. Landlords enter the code at checkout.

---
### Not yet live (launch items your developer is handling)
- Paid listings are **paused** right now (a "check back soon" note shows instead of a Pay
  button) until the business/Stripe setup is finished.
- Automatic anti-spam ("are you human?") at signup and a signup email-confirmation step
  are being turned on as part of launch.
