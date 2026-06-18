/**
 * Best-effort in-memory rate limiter, keyed by IP. This is per serverless
 * instance, not global, so it's one layer among several (honeypot, Turnstile,
 * server validation), not the only defense. It caps abusive bursts cheaply
 * without a Redis dependency.
 */
const HITS = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX = 5;

export function rateLimit(key: string, max = MAX, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const recent = (HITS.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    HITS.set(key, recent);
    return false; // limited
  }
  recent.push(now);
  HITS.set(key, recent);
  return true; // allowed
}
