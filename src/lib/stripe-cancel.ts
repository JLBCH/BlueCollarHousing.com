/**
 * Cancellation-scheduling detection for Stripe subscriptions.
 *
 * One place for "is this subscription scheduled to end?" so the admin page
 * and the webhook can't drift apart. Kept dependency-free (plain field
 * shapes, no Stripe import) so it's unit-testable.
 */

/** The cancel-related fields of a Stripe subscription. */
export type SubCancelFields = {
  cancel_at_period_end?: boolean | null;
  /** Unix seconds when a scheduled cancellation takes effect (or null). */
  cancel_at?: number | null;
  /** Unix seconds when the cancellation was requested (or null). */
  canceled_at?: number | null;
};

/** `previous_attributes` of a customer.subscription.updated event. */
export type SubCancelPrev = {
  cancel_at_period_end?: boolean;
  cancel_at?: number | null;
  canceled_at?: number | null;
};

/** True when the subscription is scheduled to end at a future date (the
 *  landlord canceled but the listing stays live until the period ends).
 *  Legacy cancels set cancel_at_period_end=true; newer Stripe API versions
 *  (2026-06-24.dahlia) schedule via cancel_at and leave the boolean false. */
export function isCancelScheduled(sub: SubCancelFields): boolean {
  return !!sub.cancel_at_period_end || sub.cancel_at != null;
}

/** When the scheduled cancellation takes effect (unix seconds): the explicit
 *  cancel_at when set (a dashboard cancel can pick a custom date), falling
 *  back to the current period end. */
export function cancelEffectiveAt(
  sub: SubCancelFields,
  currentPeriodEnd?: number | null,
): number | null {
  return sub.cancel_at ?? currentPeriodEnd ?? null;
}

/** Did THIS update event newly schedule a cancellation? (Used by the webhook
 *  to notify the owner + admin exactly once, at the moment they cancel.)
 *  previous_attributes lists changed fields with their OLD values, so a new
 *  cancel shows either cancel_at_period_end=false (legacy) or cancel_at=null
 *  (modern). Both gates require the sub to be cancel-scheduled NOW, so a
 *  resume (which removes the cancellation) never fires. */
export function cancelJustScheduled(sub: SubCancelFields, prev?: SubCancelPrev): boolean {
  if (!isCancelScheduled(sub) || !prev) return false;
  const legacyFlip = prev.cancel_at_period_end === false;
  const modernFlip = "cancel_at" in prev && prev.cancel_at == null;
  return legacyFlip || modernFlip;
}
