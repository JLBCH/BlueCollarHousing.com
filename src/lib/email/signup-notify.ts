import { SITE_URL } from "@/lib/site-url";

/** The bits of a profiles row a signup notification cares about. */
export type SignupRecord = {
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
};

/**
 * Build the admin "new account" notification from an inserted profiles row.
 * Pure so the formatting is unit-tested without a live webhook. Tolerates
 * missing fields (a bot signup may leave name/phone blank).
 */
export function buildSignupNotification(record: SignupRecord): {
  subject: string;
  text: string;
} {
  const email = record.email?.trim() || "(unknown email)";
  const name = record.full_name?.trim() || "(no name given)";
  const phone = record.phone?.trim() || "(none)";
  const role = record.role?.trim() || "landlord";

  return {
    subject: `New account: ${email}`,
    text: [
      "Someone just created an account on BlueCollarHousing.",
      "",
      `Name:  ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Role:  ${role}`,
      "",
      `See all accounts: ${SITE_URL}/admin/accounts`,
    ].join("\n"),
  };
}
