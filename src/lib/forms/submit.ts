import { createHash } from "crypto";
import { rateLimit } from "./rate-limit";
import { verifyTurnstile } from "./turnstile";
import { createPublicClient } from "@/lib/supabase/public";

export type GuardResult = { ok: true } | { ok: false; status: number; error: string };

const RL_MAX = 5;
const RL_WINDOW_SECONDS = 10 * 60;

/**
 * Durable, cross-instance rate limit backed by Postgres (the in-memory limiter
 * only sees one warm serverless instance, so bots can fan out around it).
 * Fails OPEN on any infra error so a DB hiccup never blocks a real submission.
 */
async function dbRateLimit(ip: string): Promise<boolean> {
  try {
    // Hash the IP so we never store raw addresses for this.
    const bucket = createHash("sha256").update(ip).digest("hex");
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_max: RL_MAX,
      p_window_seconds: RL_WINDOW_SECONDS,
    });
    if (error) return true; // fail open
    return data !== false;
  } catch {
    return true; // fail open
  }
}

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
  // Fast per-instance burst damper, then the durable cross-instance limit.
  const tooMany = "Too many messages just now. Please try again in a few minutes.";
  if (!rateLimit(ip)) {
    return { ok: false, status: 429, error: tooMany };
  }
  if (!(await dbRateLimit(ip))) {
    return { ok: false, status: 429, error: tooMany };
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, status: 400, error: "Spam check failed. Please reload and try again." };
  }
  return { ok: true };
}
