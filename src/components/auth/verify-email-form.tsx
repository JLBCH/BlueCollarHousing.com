"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MailCheck } from "lucide-react";
import { authSubmitCls } from "@/components/auth/auth-shell";
import { useCaptcha } from "@/components/auth/use-captcha";
import {
  isAuthRateLimitError,
  SIGNUP_CONFIRMATION_PATH,
} from "@/lib/auth/email-confirmation";
import {
  beginPendingVerificationAttempt,
  clearPendingVerification,
  type PendingVerification,
  pendingVerificationCooldownForEmail,
  readPendingVerification,
  verificationResendCooldownRemainingMs,
  verificationResendSecondsRemaining,
} from "@/lib/auth/pending-verification";
import { createClient } from "@/lib/supabase/client";

function maskEmail(email: string) {
  const separator = email.lastIndexOf("@");
  if (separator <= 0) return "your email address";

  const local = email.slice(0, separator);
  const domain = email.slice(separator + 1);
  return `${local[0]}***@${domain}`;
}

function sentTiming(pending: PendingVerification, now: number) {
  if (pending.deliveryFailed) return "The first delivery attempt did not complete.";

  const elapsedMinutes = Math.max(0, Math.floor((now - pending.sentAt) / 60_000));
  if (elapsedMinutes < 1) return "Email sent less than a minute ago.";
  if (elapsedMinutes === 1) return "Email sent about 1 minute ago.";
  return `Email sent about ${elapsedMinutes} minutes ago.`;
}

export function VerifyEmailForm() {
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState<PendingVerification | null>(null);
  const [now, setNow] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const captcha = useCaptcha();

  useEffect(() => {
    setPending(readPendingVerification());
    setNow(Date.now());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !pending) return;

    let timer: number;
    const scheduleNextUpdate = () => {
      const currentTime = Date.now();
      const cooldownRemaining = verificationResendCooldownRemainingMs(pending, currentTime);
      const elapsedSinceSent = Math.max(0, currentTime - pending.sentAt);
      const nextMinuteBoundary = 60_000 - (elapsedSinceSent % 60_000);
      const delay =
        cooldownRemaining > 0 ? Math.min(1_000, cooldownRemaining) : nextMinuteBoundary;

      timer = window.setTimeout(() => {
        setNow(Date.now());
        scheduleNextUpdate();
      }, delay);
    };

    scheduleNextUpdate();

    return () => window.clearTimeout(timer);
  }, [loaded, pending]);

  if (!loaded) {
    return <p className="text-[14.5px] text-muted">Loading verification details…</p>;
  }

  if (!pending) {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
        <h2 className="font-display mt-3 text-[20px] font-bold text-navy">
          No email is waiting for verification
        </h2>
        <p className="mt-2 text-[14.5px] text-muted">
          Start again to create an account, or sign in if you already confirmed your email.
        </p>
        <div className="mt-5 grid gap-3">
          <Link href="/register" className={authSubmitCls}>
            Create account
          </Link>
          <Link href="/login" className="text-[14px] font-semibold text-orange hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const secondsRemaining = verificationResendSecondsRemaining(pending, now);
  const canResend = secondsRemaining === 0 && !busy;

  async function resend() {
    if (!pending || !canResend) return;

    const existingAttempt = pendingVerificationCooldownForEmail(pending.email);
    if (existingAttempt) {
      setPending(existingAttempt);
      setNow(Date.now());
      return;
    }

    setBusy(true);
    setError(null);
    setResent(false);
    const attempt = beginPendingVerificationAttempt(pending.email);
    setPending(attempt);
    setNow(attempt.sentAt);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: pending.email,
      options: {
        emailRedirectTo: `${window.location.origin}${SIGNUP_CONFIRMATION_PATH}`,
        captchaToken: captcha.captchaToken,
      },
    });
    captcha.reset();

    if (resendError) {
      setError(
        isAuthRateLimitError(resendError)
          ? "Too many attempts were made. Please wait about a minute before trying again."
          : "We couldn't resend that email. Please try again in a moment.",
      );
      setBusy(false);
      return;
    }

    setResent(true);
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-center text-center">
      <MailCheck className="h-10 w-10 text-orange" />
      <h2 className="font-display mt-3 text-[20px] font-bold text-navy">Check your email</h2>
      <p className="mt-2 text-[14.5px] text-muted">
        We sent a confirmation link to{" "}
        <span className="font-semibold text-navy">{maskEmail(pending.email)}</span>.
      </p>
      <p className="mt-1 text-[13px] text-muted">{sentTiming(pending, now)}</p>

      <div className="mt-5 flex w-full items-start gap-2.5 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-left">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <p className="text-[14px] font-medium text-amber-900">
          Don&apos;t see it in your inbox? Check your{" "}
          <span className="font-bold">spam, junk, Other, or quarantine</span> folders. Corporate
          email systems may hold automated messages for review.
        </p>
      </div>

      {pending.deliveryFailed && (
        <p className="mt-4 text-[13.5px] font-medium text-amber-800">
          The first send did not complete. You can try again now.
        </p>
      )}
      {error && <p className="mt-4 text-[13.5px] font-medium text-red-600">{error}</p>}
      {resent && (
        <p className="mt-4 text-[13.5px] font-medium text-green-700">
          Sent again — check your inbox and filtered folders.
        </p>
      )}

      {secondsRemaining === 0 && <div className="mt-4">{captcha.field}</div>}
      <button
        type="button"
        onClick={resend}
        disabled={!canResend}
        className={`${authSubmitCls} mt-4`}
      >
        <MailCheck className="h-[18px] w-[18px]" />
        {busy
          ? "Resending..."
          : secondsRemaining > 0
            ? `Resend available in ${secondsRemaining}s`
            : "Resend verification email"}
      </button>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13.5px] font-semibold">
        <Link href="/login" className="text-orange hover:underline">
          Sign in
        </Link>
        <Link href="/forgot-password" className="text-orange hover:underline">
          Reset password
        </Link>
        <Link
          href="/register"
          onClick={clearPendingVerification}
          className="text-orange hover:underline"
        >
          Change email
        </Link>
      </div>
    </div>
  );
}
