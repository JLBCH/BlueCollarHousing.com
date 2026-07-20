import { ACTIVE_STATUSES } from "@/lib/subscription-status";

/** The billing state of an APPROVED listing (draft/pending/rejected → "none"). */
export type BillingState =
  | "live" // comped or paid & in good standing
  | "past_due" // payment failing; still visible during Stripe's retry grace
  | "awaiting_payment" // approved, never paid
  | "lapsed" // had a subscription that ended → offline
  | "none";

export function billingState(opts: {
  status: string;
  subscriptionStatus?: string | null;
  isComp?: boolean;
  hasSubscription?: boolean;
}): BillingState {
  const { status, isComp } = opts;
  const sub = opts.subscriptionStatus ?? "none";
  if (status !== "approved") return "none";
  if (isComp || ACTIVE_STATUSES.includes(sub)) return "live";
  if (sub === "past_due") return "past_due";
  if (opts.hasSubscription) return "lapsed";
  return "awaiting_payment";
}
