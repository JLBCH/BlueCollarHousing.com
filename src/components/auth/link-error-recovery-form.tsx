"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { authInputCls, authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";
import { useCaptcha } from "@/components/auth/use-captcha";
import {
  isAuthRateLimitError,
  SIGNUP_CONFIRMATION_PATH,
} from "@/lib/auth/email-confirmation";
import {
  beginPendingVerificationAttempt,
  type PendingVerification,
  pendingVerificationCooldownForEmail,
  verificationResendCooldownRemainingMs,
  verificationResendSecondsRemaining,
} from "@/lib/auth/pending-verification";
import { createClient } from "@/lib/supabase/client";

export function LinkErrorRecoveryForm() {
  const router = useRouter();
  const captcha = useCaptcha();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<PendingVerification | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!attempt) return;
    const remaining = verificationResendCooldownRemainingMs(attempt, Date.now());
    if (remaining === 0) return;

    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(1_000, remaining),
    );
    return () => window.clearTimeout(timer);
  }, [attempt, now]);

  const secondsRemaining = attempt
    ? verificationResendSecondsRemaining(attempt, now)
    : 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const email = String(new FormData(event.currentTarget).get("email") ?? "")
      .trim()
      .toLowerCase();
    if (pendingVerificationCooldownForEmail(email)) {
      router.push("/verify-email");
      return;
    }

    setBusy(true);
    const pendingAttempt = beginPendingVerificationAttempt(email);
    setAttempt(pendingAttempt);
    setNow(pendingAttempt.sentAt);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${SIGNUP_CONFIRMATION_PATH}`,
        captchaToken: captcha.captchaToken,
      },
    });
    captcha.reset();

    if (error) {
      setMessage(
        isAuthRateLimitError(error)
          ? "Too many attempts were made. Please wait about a minute before trying again."
          : "We couldn't complete that request. Please try again in a moment.",
      );
      setBusy(false);
      return;
    }

    router.push("/verify-email");
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <p className="text-[14.5px] text-muted">
        Enter your email and we&apos;ll send a new confirmation message if an account is waiting
        for verification.
      </p>
      <div>
        <label className={authLabelCls} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={authInputCls}
          placeholder="you@email.com"
        />
      </div>
      {captcha.field}
      {message && <p className="text-[13.5px] font-medium text-amber-800">{message}</p>}
      <button type="submit" disabled={busy || secondsRemaining > 0} className={authSubmitCls}>
        <Send className="h-[18px] w-[18px]" aria-hidden="true" />
        {busy
          ? "Sending..."
          : secondsRemaining > 0
            ? `Try again in ${secondsRemaining}s`
            : "Send a new confirmation email"}
      </button>
    </form>
  );
}
