"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { adminAction } from "@/lib/admin";
import { stripe, customerIdForEmail } from "@/lib/stripe";

type Result = { ok: boolean; error?: string };

async function isAdmin(): Promise<boolean> {
  return (await adminAction()).ok;
}

function msg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong with Stripe.";
}

/**
 * Create a coupon + a redeemable promotion code. The landlord enters the code at
 * checkout (promo codes are already enabled there) to discount the subscription.
 * Optionally bind it to a single email (only that landlord can redeem it) and/or
 * give it an expiration date.
 */
export async function createPromo(input: {
  code: string;
  percentOff: number;
  duration: "once" | "forever";
  restrictEmail?: string;
  expiresAt?: string; // yyyy-mm-dd from the form, optional
}): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Admins only." };
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,}$/.test(code)) {
    return { ok: false, error: "Code must be 3+ letters/numbers, no spaces." };
  }
  const pct = Math.round(input.percentOff);
  if (!(pct > 0 && pct <= 100)) return { ok: false, error: "Percent off must be 1-100." };

  const email = input.restrictEmail?.trim().toLowerCase();
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email to restrict the code, or leave it blank." };
  }

  let expiresUnix: number | undefined;
  if (input.expiresAt) {
    const ms = Date.parse(`${input.expiresAt}T23:59:59`);
    if (Number.isNaN(ms)) return { ok: false, error: "Invalid expiration date." };
    if (ms <= Date.now()) return { ok: false, error: "Expiration must be in the future." };
    expiresUnix = Math.floor(ms / 1000);
  }

  try {
    const coupon = await stripe.coupons.create({ percent_off: pct, duration: input.duration });
    const params: Stripe.PromotionCodeCreateParams = {
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      metadata: { restrict_email: email ?? "" },
    };
    // Bind to a single customer (only that email can redeem it). ensureCustomer
    // resolves the same customer at checkout, so the restriction matches.
    if (email) params.customer = await customerIdForEmail(email);
    if (expiresUnix) params.expires_at = expiresUnix;
    await stripe.promotionCodes.create(params);
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}

/** Turn a promotion code off so it can no longer be redeemed. */
export async function deactivatePromo(id: string): Promise<Result> {
  if (!(await isAdmin())) return { ok: false, error: "Admins only." };
  try {
    await stripe.promotionCodes.update(id, { active: false });
    revalidatePath("/admin/coupons");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: msg(e) };
  }
}
