"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authInputCls, authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { useCaptcha } from "@/components/auth/use-captcha";
import { safePath } from "@/lib/safe-path";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safePath(params.get("redirect"));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const captcha = useCaptcha();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
      options: { captchaToken: captcha.captchaToken },
    });
    if (error) {
      setError(error.message);
      captcha.reset();
      setBusy(false);
      return;
    }
    // Full navigation so the server re-reads the refreshed session cookie.
    router.replace(redirect);
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <label className={authLabelCls} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={authInputCls} placeholder="you@email.com" />
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className={authLabelCls + " mb-0"} htmlFor="password">Password</label>
          <a href="/forgot-password" className="text-[13px] font-semibold text-orange hover:underline">
            Forgot password?
          </a>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" required placeholder="Your password" />
      </div>
      {captcha.field}
      {error && <p className="text-[13.5px] font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={authSubmitCls}>
        <LogIn className="h-[18px] w-[18px]" /> {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
