import { SITE_URL } from "@/lib/site-url";

/**
 * Build the email a landlord gets when the admin creates a coupon code
 * restricted to their address. Pure so the copy is unit-tested.
 */
export function buildCouponNotification(args: {
  code: string;
  percentOff: number;
  duration: "once" | "forever";
  expiresAt?: string; // yyyy-mm-dd, optional
}): { subject: string; text: string } {
  const amount =
    args.percentOff >= 100 ? "100% off (free)" : `${args.percentOff}% off`;
  const span =
    args.duration === "forever"
      ? "It applies every billing period for as long as your listing runs."
      : "It applies to your first payment.";
  const expiry = args.expiresAt
    ? `\nThe code expires on ${args.expiresAt}, so don't wait too long.`
    : "";

  return {
    subject: `Your BlueCollarHousing discount code: ${args.code}`,
    text: [
      `Good news — we've set up a discount code just for you: ${args.code}`,
      "",
      `It gives you ${amount} on your listing. ${span}${expiry}`,
      "",
      "How to use it: when you check out to publish your listing, enter the",
      `code ${args.code} in the promo code box. The code only works for this`,
      "email address.",
      "",
      `Get started: ${SITE_URL}/dashboard`,
      "",
      "— The BlueCollarHousing team",
    ].join("\n"),
  };
}
