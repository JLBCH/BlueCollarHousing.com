"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authInputCls, authLabelCls, authSubmitCls } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { formatPhone } from "@/lib/format-phone";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [phone, setPhone] = useState("");

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
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: String(fd.get("email")).trim(),
      password,
      options: {
        data: {
          full_name: String(fd.get("full_name")).trim(),
          phone: String(fd.get("phone")).trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    // Supabase returns a privacy "decoy" for an already-registered email: no
    // error, no session, and an empty identities array. Without this check the
    // form would falsely say "check your email" and silently create nothing.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("An account with this email already exists. Try signing in instead.");
      setBusy(false);
      return;
    }
    // If the project requires email confirmation, there is no active session
    // yet, show the "check your email" state. Otherwise go straight in.
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
    } else {
      setNeedsVerify(true);
      setBusy(false);
    }
  }

  if (needsVerify) {
    return (
      <div className="flex flex-col items-center text-center">
        <MailCheck className="h-10 w-10 text-orange" />
        <h2 className="font-display mt-3 text-[20px] font-bold text-navy">Check your email</h2>
        <p className="mt-2 text-[14.5px] text-muted">
          We sent you a link to confirm your account. Click it, then sign in.
        </p>
      </div>
    );
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
      {error && <p className="text-[13.5px] font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={authSubmitCls}>
        <UserPlus className="h-[18px] w-[18px]" /> {busy ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
