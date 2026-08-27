import { NextResponse, type NextRequest } from "next/server";
import { isEmailOtpType } from "@/lib/auth/email-confirmation";
import { createClient } from "@/lib/supabase/server";
import { safePath } from "@/lib/safe-path";

function linkError(origin: string, status?: number) {
  return NextResponse.redirect(new URL("/auth/link-error", origin), status);
}

function recoveryLinkError(origin: string, status?: number) {
  return NextResponse.redirect(
    new URL("/forgot-password?error=expired-link", origin),
    status,
  );
}

/**
 * Verifies an email link (signup confirmation or password recovery) and
 * establishes the session cookie, then redirects to `next` (dashboard for
 * confirmations, /reset-password for recovery). Handles both link formats:
 * a PKCE `?code=` and a `?token_hash=&type=`, so it works regardless of how the
 * Supabase email templates are configured.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  // `next` is attacker-controllable (it's in the email link); constrain it to a
  // same-origin path so /auth/confirm can't be used as an open redirect.
  const next = safePath(searchParams.get("next"));
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const isRecovery = type === "recovery" || next === "/reset-password";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (token_hash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return isRecovery ? recoveryLinkError(origin) : linkError(origin);
}

/**
 * Consumes an email token only after the person explicitly submits the
 * confirmation interstitial. A 303 ensures the browser follows the redirect
 * with GET rather than repeating the POST against the destination page.
 */
export async function POST(request: NextRequest) {
  const { origin } = request.nextUrl;
  let isRecovery = false;

  try {
    const form = await request.formData();
    const tokenHash = form.get("token_hash");
    const rawType = form.get("type");
    const rawNext = form.get("next");
    const type = typeof rawType === "string" ? rawType : null;
    isRecovery = type === "recovery";

    if (typeof tokenHash !== "string" || !tokenHash || !isEmailOtpType(type)) {
      return isRecovery ? recoveryLinkError(origin, 303) : linkError(origin, 303);
    }

    const next = safePath(typeof rawNext === "string" ? rawNext : null);
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) return NextResponse.redirect(new URL(next, origin), 303);
  } catch {
    // Malformed form data is handled like an invalid or expired email link.
  }

  return isRecovery ? recoveryLinkError(origin, 303) : linkError(origin, 303);
}
