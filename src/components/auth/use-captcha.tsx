"use client";

import { useCallback, useState } from "react";
import { Turnstile } from "@/components/turnstile";

/**
 * Captcha helper for the auth forms. Renders the Turnstile widget and tracks the
 * solved token to hand to Supabase auth calls (`options.captchaToken`). When
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY isn't set the widget renders nothing and
 * captchaToken stays undefined — which matches Supabase ignoring the token while
 * its CAPTCHA setting is off, so nothing breaks before keys are provisioned.
 *
 * Tokens are single-use: after any auth call (success or failure) call reset()
 * to remount the widget and mint a fresh token for the next attempt.
 */
export function useCaptcha() {
  const [token, setToken] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const onToken = useCallback((t: string) => setToken(t), []);
  const onExpire = useCallback(() => setToken(null), []);
  const reset = useCallback(() => {
    setToken(null);
    setNonce((n) => n + 1);
  }, []);

  const field = <Turnstile key={nonce} onToken={onToken} onExpire={onExpire} />;

  return { field, captchaToken: token ?? undefined, reset };
}
