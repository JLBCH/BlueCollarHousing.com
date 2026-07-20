/**
 * Returns `p` only if it is a same-origin relative path; otherwise the
 * fallback. Blocks open-redirects via absolute URLs ("https://evil.com") and
 * protocol-relative URLs ("//evil.com"). Use anywhere a redirect target comes
 * from user input (query params, email links).
 */
export function safePath(p: string | null | undefined, fallback = "/dashboard"): string {
  if (!p || !p.startsWith("/") || p.startsWith("//") || p.startsWith("/\\")) {
    return fallback;
  }
  return p;
}
