// Subscription-status constants ONLY — no Stripe SDK import, so this is safe to
// import from client components (importing @/lib/stripe pulls the Node Stripe
// SDK into the browser bundle and crashes the page).

/** Subscription statuses that count as fully paid / in good standing. */
export const ACTIVE_STATUSES = ["active", "trialing"];
/** Statuses that keep a listing publicly VISIBLE, including the payment-retry
 *  grace period (`past_due`). */
export const VISIBLE_STATUSES = ["active", "trialing", "past_due"];
/** A subscription that once existed but is no longer keeping the listing live. */
export const LAPSED_STATUSES = ["past_due", "canceled", "unpaid", "incomplete_expired"];
