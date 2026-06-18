"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authInputCls, authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/dashboard";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(fd.get("email")).trim(),
      password: String(fd.get("password")),
    });
    if (error) {
      setError(error.message);
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
        <input id="password" name="password" type="password" autoComplete="current-password" required className={authInputCls} placeholder="Your password" />
      </div>
      {error && <p className="text-[13.5px] font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={authSubmitCls}>
        <LogIn className="h-[18px] w-[18px]" /> {busy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
