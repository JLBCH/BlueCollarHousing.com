"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authInputCls, authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { useCaptcha } from "@/components/auth/use-captcha";
import { formatPhone } from "@/lib/format-phone";
import {
  clearPendingVerification,
  pendingVerificationCooldownForEmail,
  savePendingVerification,
} from "@/lib/auth/pending-verification";
import {
  isVerificationEmailDeliveryError,
  SIGNUP_CONFIRMATION_PATH,
} from "@/lib/auth/email-confirmation";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const captcha = useCaptcha();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }
    const email = String(fd.get("email")).trim();
    if (pendingVerificationCooldownForEmail(email)) {
      router.replace("/verify-email");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: String(fd.get("full_name")).trim(),
          phone: String(fd.get("phone")).trim(),
        },
        emailRedirectTo: `${window.location.origin}${SIGNUP_CONFIRMATION_PATH}`,
        captchaToken: captcha.captchaToken,
      },
    });
    if (error) {
      if (isVerificationEmailDeliveryError(error)) {
        savePendingVerification({ email, sentAt: Date.now(), deliveryFailed: true });
        captcha.reset();
        router.replace("/verify-email");
        return;
      }
      setError(error.message);
      captcha.reset();
      setBusy(false);
      return;
    }
    // Supabase intentionally returns the same no-session response for a new
    // signup and some duplicate emails. Preserve that privacy boundary here.
    if (data.session) {
      clearPendingVerification();
      router.replace("/dashboard");
      router.refresh();
    } else {
      savePendingVerification({ email, sentAt: Date.now(), deliveryFailed: false });
      router.replace("/verify-email");
    }
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <label className={authLabelCls} htmlFor="full_name">Full name</label>
        <input id="full_name" name="full_name" autoComplete="name" required className={authInputCls} placeholder="Jane Smith" />
      </div>
      <div>
        <label className={authLabelCls} htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className={authInputCls} placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
      </div>
      <div>
        <label className={authLabelCls} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={authInputCls} placeholder="you@email.com" />
      </div>
      <div>
        <label className={authLabelCls} htmlFor="password">Password</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required placeholder="At least 8 characters" />
      </div>
      {captcha.field}
      {error && <p className="text-[13.5px] font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={authSubmitCls}>
        <UserPlus className="h-[18px] w-[18px]" /> {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
