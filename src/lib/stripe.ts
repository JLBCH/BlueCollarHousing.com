import Stripe from "stripe";

/** Server-side Stripe client. Secret key is server-only (never NEXT_PUBLIC). */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

/** Annual subscription prices (test-mode), created in Stripe. */
export const PRICES = {
  single: process.env.STRIPE_PRICE_SINGLE ?? "",
  addon: process.env.STRIPE_PRICE_ADDON ?? "",
  commercial: process.env.STRIPE_PRICE_COMMERCIAL ?? "",
};

// Re-exported for server-side convenience. Client components MUST import these
// from "@/lib/subscription-status" directly — importing from here would pull the
// Stripe Node SDK (instantiated above) into the browser bundle and crash.
export { ACTIVE_STATUSES, VISIBLE_STATUSES, LAPSED_STATUSES } from "@/lib/subscription-status";

/**
 * Return the Stripe customer id for an email, reusing an existing customer
 * before creating a new one. Both coupon creation (which binds a promo code to
 * a customer) and checkout must resolve to the SAME customer for the email, or
 * an email-restricted coupon won't match at checkout. Searching by email first
 * keeps them aligned even when the landlord had no customer at coupon time.
 */
export async function customerIdForEmail(
  email: string,
  extra?: { name?: string; metadata?: Record<string, string> },
): Promise<string> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const created = await stripe.customers.create({
    email,
    name: extra?.name,
    metadata: extra?.metadata,
  });
  return created.id;
}

/** Absolute base URL for Stripe redirect (success/cancel) URLs. */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://bch-demo.vercel.app")
  );
}
