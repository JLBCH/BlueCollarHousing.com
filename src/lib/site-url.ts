/**
 * Canonical public origin for SEO surfaces (metadata, sitemap, robots).
 * NOTE: Stripe redirects use siteUrl() in @/lib/stripe instead — that one
 * deliberately falls back to the current Vercel deployment URL so checkout
 * round-trips work on previews, which would be wrong for canonical SEO URLs.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bluecollarhousing.com";
