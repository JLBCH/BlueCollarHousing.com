"use server";

import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICES, siteUrl, customerIdForEmail } from "@/lib/stripe";
import { isCommercial } from "@/lib/listings/types";
import { ACTIVE_STATUSES } from "@/lib/subscription-status";

type Result = { ok: true; url: string } | { ok: false; error: string };

/** Get the user's Stripe customer id, creating + storing one if needed. */
async function ensureCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  email: string | undefined,
): Promise<string> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, full_name")
    .eq("id", userId)
    .single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  // Reuse a customer that already exists for this email (e.g. one an admin
  // created when binding an email-restricted coupon), so that coupon matches at
  // checkout. Falls back to creating one when no email / no match.
  const name = profile?.full_name || undefined;
  const customerId = email
    ? await customerIdForEmail(email, { name, metadata: { user_id: userId } })
    : (await stripe.customers.create({ name, metadata: { user_id: userId } })).id;
  await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
  return customerId;
}

/**
 * Start a subscription checkout for one listing. The webhook marks the listing
 * paid + pending on success. Returns the Stripe Checkout URL for the client to
 * redirect to.
 */
export async function subscribeListing(listingId: string): Promise<Result> {
  // Pre-launch gate (Joe, Jul 19): purchases are paused until the LLC + final
  // terms are in place. The pay buttons are hidden client-side off the same
  // flag; this is the server-side backstop.
  if (process.env.NEXT_PUBLIC_PAYMENTS_PAUSED === "1") {
    return {
      ok: false,
      error: "Paid listings aren't open quite yet — check back soon.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, title, property_type, subscription_status, is_comp, stripe_subscription_id, parent_listing_id, address, unit",
    )
    .eq("id", listingId)
    .eq("owner_id", user.id)
    .single();
  if (!listing) return { ok: false, error: "Listing not found." };

  // Already has a live or retrying subscription → manage it in the billing
  // portal rather than creating a DUPLICATE subscription. (A fully-canceled sub
  // is dead, so a fresh checkout below is safe and won't double-charge.)
  if (["active", "trialing", "past_due"].includes(listing.subscription_status)) {
    return openBillingPortal();
  }

  const customerId = await ensureCustomer(supabase, user.id, user.email);

  // Pricing:
  //  • Additional unit (linked to a primary) → $10/yr — but only if its PRIMARY
  //    is already live, so the $99 base is paid first (and a unit can't be
  //    published on its own).
  //  • Commercial type → $249/yr.
  //  • Otherwise (a primary / standalone residential listing) → $99/yr.
  let price = PRICES.single;
  // Additional units get a per-unit product name (address + unit) so the five
  // identical $10 lines in the billing portal are tellable apart.
  let addonLabel: string | undefined;
  // When set, anchor the additional unit's billing to the primary's renewal date
  // so they renew together; Stripe prorates the first (partial) period.
  let billingCycleAnchor: number | undefined;
  if (listing.parent_listing_id) {
    const { data: primary } = await supabase
      .from("listings")
      .select("id, is_comp, subscription_status, stripe_subscription_id")
      .eq("id", listing.parent_listing_id)
      .eq("owner_id", user.id)
      .single();
    // Free (comped) listings can't spawn $10 units — the $99 base must be a
    // real paid subscription before additional units are available.
    if (primary?.is_comp) {
      return {
        ok: false,
        error:
          "Additional units aren't available on a free listing. The primary listing needs a paid subscription first.",
      };
    }
    const primaryLive = !!primary && ACTIVE_STATUSES.includes(primary.subscription_status);
    if (!primaryLive) {
      return {
        ok: false,
        error:
          "Publish your primary listing at this address first — additional units go live once the primary is live.",
      };
    }
    price = PRICES.addon;
    // "Additional unit — 1206 W Main St, Unit B" (title as the tiebreaker when
    // the unit field is blank). Stripe caps product names at 250 chars.
    addonLabel = [
      `Additional unit — ${(listing.address ?? "").trim()}`,
      listing.unit?.trim() ? `Unit ${listing.unit.trim()}` : (listing.title ?? "").trim(),
    ]
      .filter(Boolean)
      .join(", ")
      .slice(0, 250);
    if (primary?.stripe_subscription_id) {
      try {
        const primarySub = await stripe.subscriptions.retrieve(primary.stripe_subscription_id);
        const end = (primarySub.items?.data?.[0] as { current_period_end?: number } | undefined)
          ?.current_period_end;
        if (end && end > Math.floor(Date.now() / 1000)) billingCycleAnchor = end;
      } catch {
        /* no primary renewal date to align to → bill a normal annual cycle */
      }
    }
  } else if (isCommercial(listing.property_type)) {
    price = PRICES.commercial;
  }

  // Additional units use inline price_data so each subscription carries its own
  // product name (the portal/invoices then read "Additional unit — {address},
  // Unit {X}"); everything else uses the fixed catalog price. The amount/interval
  // still come from the catalog $10 price so pricing stays defined in one place.
  let lineItem: Stripe.Checkout.SessionCreateParams.LineItem = { price, quantity: 1 };
  if (addonLabel) {
    const addonPrice = await stripe.prices.retrieve(PRICES.addon);
    lineItem = {
      price_data: {
        currency: addonPrice.currency,
        unit_amount: addonPrice.unit_amount ?? 1000,
        recurring: { interval: addonPrice.recurring?.interval ?? "year" },
        product_data: { name: addonLabel },
      },
      quantity: 1,
    };
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    customer: customerId,
    line_items: [lineItem],
    client_reference_id: listing.id,
    metadata: { listing_id: listing.id, user_id: user.id },
    subscription_data: {
      metadata: { listing_id: listing.id, user_id: user.id },
      ...(addonLabel ? { description: addonLabel } : {}),
      ...(billingCycleAnchor ? { billing_cycle_anchor: billingCycleAnchor } : {}),
    },
    success_url: `${siteUrl()}/dashboard?subscribed=1`,
    cancel_url: `${siteUrl()}/dashboard?canceled=1`,
    allow_promotion_codes: true,
  };

  let session;
  try {
    session = await stripe.checkout.sessions.create(params);
  } catch (e) {
    // If Stripe rejects the billing-cycle anchor (e.g. out of range), retry with a
    // normal cycle so checkout never breaks over the proration nicety.
    if (billingCycleAnchor) {
      session = await stripe.checkout.sessions.create({
        ...params,
        subscription_data: {
          metadata: { listing_id: listing.id, user_id: user.id },
          ...(addonLabel ? { description: addonLabel } : {}),
        },
      });
    } else {
      throw e;
    }
  }
  if (!session.url) return { ok: false, error: "Could not start checkout." };
  return { ok: true, url: session.url };
}

/** Open the Stripe Customer Portal (manage card / cancel). */
export async function openBillingPortal(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) {
    return { ok: false, error: "No billing account yet. Subscribe a listing first." };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl()}/dashboard`,
  });
  return { ok: true, url: session.url };
}
