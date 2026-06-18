import { rateLimit } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";

export type GuardResult = { ok: true } | { ok: false; status: number; error: string };

/** First client IP from the proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

export function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Trim + length-cap an untrusted value into a safe string. */
export function clean(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/**
 * Rate-limit + Turnstile gate shared by every public form route. Honeypot is
 * checked in each route before this (a bot hit returns a silent success so the
 * bot can't tell it was caught).
 */
export async function spamGuard(
  req: Request,
  turnstileToken: string | undefined,
): Promise<GuardResult> {
  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    return { ok: false, status: 429, error: "Too many messages just now. Please try again in a few minutes." };
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, status: 400, error: "Spam check failed. Please reload and try again." };
  }
  return { ok: true };
}
