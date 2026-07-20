"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";

/**
 * Sets a new password. Reached from the recovery email link, which establishes
 * a short-lived recovery session (via /auth/confirm) before landing here.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password"));
    const confirm = String(fd.get("confirm"));
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <label className={authLabelCls} htmlFor="password">New password</label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required placeholder="At least 8 characters" />
      </div>
      <div>
        <label className={authLabelCls} htmlFor="confirm">Confirm new password</label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" required placeholder="Re-enter password" />
      </div>
      {error && <p className="text-[13.5px] font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={authSubmitCls}>
        <KeyRound className="h-[18px] w-[18px]" /> {busy ? "Saving..." : "Update password"}
      </button>
    </form>
  );
}
