/** Supabase Storage bucket holding listing photos. */
export const BUCKET = "listing-photos";

/** Extract the storage object path from a public photo URL, or null. */
export function storagePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}

/**
 * Stripe subscription IDs to cancel when a listing (and its cascade-deleted
 * child units) are removed — every row's non-empty subscription id, deduped.
 * Deleting a listing must end its auto-renewal (Terms 6.2); a missed child unit
 * would keep billing after its row is gone. Pure so it's unit-tested.
 */
export function subscriptionsToCancel(
  rows: { stripe_subscription_id?: string | null }[],
): string[] {
  const ids = rows
    .map((r) => r.stripe_subscription_id)
    .filter((s): s is string => !!s && s.trim() !== "");
  return [...new Set(ids)];
}
