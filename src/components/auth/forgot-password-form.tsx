"use client";

import { useState } from "react";
import { MailCheck, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authInputCls, authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";
import { useCaptcha } from "@/components/auth/use-captcha";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const captcha = useCaptcha();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      String(fd.get("email")).trim(),
      {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
        captchaToken: captcha.captchaToken,
      },
    );
    if (error) {
      setError(error.message);
      captcha.reset();
      setBusy(false);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center text-center">
        <MailCheck className="h-10 w-10 text-orange" />
        <h2 className="font-display mt-3 text-[20px] font-bold text-navy">Check your email</h2>
        <p className="mt-2 text-[14.5px] text-muted">
          If an account exists for that email, we sent a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <label className={authLabelCls} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={authInputCls} placeholder="you@email.com" />
      </div>
      {captcha.field}
      {error && <p className="text-[13.5px] font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={authSubmitCls}>
        <Send className="h-[18px] w-[18px]" /> {busy ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
