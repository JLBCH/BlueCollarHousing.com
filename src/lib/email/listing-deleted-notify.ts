import { SITE_URL } from "@/lib/site-url";
import { sendEmail, notifyTo } from "@/lib/email/send";

/**
 * Build the admin "listing deleted, subscription canceled" notification. Pure so
 * the copy is unit-tested. This covers the dashboard-delete path: deleting a
 * listing cancels its Stripe subscription (Terms 6.2), but the listing row is
 * gone by the time Stripe's webhook fires, so the webhook can't email about it —
 * we notify here instead. (A cancel done directly in Stripe is still covered by
 * the webhook, since that leaves the listing row in place.)
 */
export function buildListingDeletedNotification(args: {
  title: string;
  actorEmail?: string | null;
  wasAdmin?: boolean;
  subscriptionCount?: number;
}): { subject: string; text: string } {
  const title = args.title.trim() || "(untitled listing)";
  const by = args.actorEmail?.trim() || "(unknown)";
  const role = args.wasAdmin ? "admin" : "landlord";
  const n = args.subscriptionCount ?? 1;
  const subLine =
    n > 1
      ? `${n} subscriptions were canceled (the listing and its units).`
      : "Its subscription was canceled.";
  return {
    subject: `Listing deleted — subscription canceled: ${title}`,
    text: [
      "A listing was deleted from the dashboard.",
      subLine,
      "",
      `Listing:     ${title}`,
      `Deleted by:  ${by} (${role})`,
      "",
      `Manage listings: ${SITE_URL}/admin`,
    ].join("\n"),
  };
}

/**
 * Email the admin (CONTACT_NOTIFY_EMAIL) that a listing was deleted and its
 * subscription canceled. Best-effort: sendEmail never throws, and this is a
 * no-op if no notify address is configured.
 */
export async function notifyAdminListingDeleted(args: {
  title: string;
  actorEmail?: string | null;
  wasAdmin?: boolean;
  subscriptionCount?: number;
}): Promise<void> {
  const to = notifyTo();
  if (!to) return;
  const { subject, text } = buildListingDeletedNotification(args);
  await sendEmail({ to, subject, text });
}
