import { SITE_URL } from "@/lib/site-url";
import { sendEmail, notifyTo } from "@/lib/email/send";

/**
 * Build the admin "listing submitted for review" notification. Pure so the copy
 * is unit-tested. Fires for a landlord's first listing and any additional one.
 */
export function buildListingSubmitNotification(args: {
  title: string;
  submitterEmail?: string | null;
  isCommercial?: boolean;
}): { subject: string; text: string } {
  const title = args.title.trim() || "(untitled listing)";
  const by = args.submitterEmail?.trim() || "(unknown)";
  const kind = args.isCommercial ? "Commercial" : "Standard";
  return {
    subject: `New listing submitted for review: ${title}`,
    text: [
      "A landlord just submitted a listing for approval.",
      "",
      `Listing: ${title}`,
      `Type:    ${kind}`,
      `From:    ${by}`,
      "",
      `Review it in the queue: ${SITE_URL}/admin`,
    ].join("\n"),
  };
}

/**
 * Email the admin (CONTACT_NOTIFY_EMAIL) that a listing was submitted for review.
 * Best-effort: sendEmail never throws, and callers do not await-block the user's
 * save on it beyond the single fetch. No-op if no notify address is configured.
 */
export async function notifyAdminListingSubmitted(args: {
  title: string;
  submitterEmail?: string | null;
  isCommercial?: boolean;
}): Promise<void> {
  const to = notifyTo();
  if (!to) return;
  const { subject, text } = buildListingSubmitNotification(args);
  await sendEmail({ to, subject, text });
}
