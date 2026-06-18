/**
 * Cloudflare Turnstile verification (invisible anti-spam). Gated on
 * TURNSTILE_SECRET_KEY: until Turnstile keys are provisioned this is a no-op
 * that returns true, so the forms work today. The moment the secret is set,
 * a valid token becomes required. The matching site key drives the widget
 * client-side (see components/turnstile.tsx).
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured yet
  if (!token) return false;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token, remoteip: ip }),
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
