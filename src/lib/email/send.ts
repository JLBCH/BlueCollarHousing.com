/**
 * Transactional email via Resend's REST API (no extra dependency, keeps the
 * bundle light). Best-effort by design: if the key or a verified domain isn't
 * set up yet, it logs and resolves false instead of throwing, so a form
 * submission is never lost to an email outage. Delivery becomes real once
 * RESEND_API_KEY + a verified CONTACT_FROM_EMAIL domain + CONTACT_NOTIFY_EMAIL
 * are all in place.
 */
type SendArgs = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, text, replyTo }: SendArgs): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from =
    process.env.CONTACT_FROM_EMAIL || "BlueCollarHousing <onboarding@resend.dev>";

  if (!key) {
    console.warn("[email] RESEND_API_KEY not set; skipping:", subject);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text, reply_to: replyTo }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send failed", e);
    return false;
  }
}

/** Admin/owner notification address for contact + lead forms. */
export function notifyTo(): string | null {
  return process.env.CONTACT_NOTIFY_EMAIL || null;
}
