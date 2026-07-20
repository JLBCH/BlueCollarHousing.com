import type { Metadata } from "next";
import Link from "next/link";
import { MailWarning } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set New Password" };

export default async function ResetPasswordPage() {
  // The recovery email link runs through /auth/confirm, which establishes a
  // session before landing here. No session => the link was never valid or has
  // expired, so don't show an actionable password form (it would otherwise let
  // anyone open /reset-password directly).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AuthShell
        title="Reset link expired"
        subtitle="This password reset link is invalid or has expired."
        footer={
          <>
            Remembered it?{" "}
            <Link href="/login" className="font-semibold text-orange hover:underline">
              Sign in
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center text-center">
          <MailWarning className="h-10 w-10 text-orange" />
          <p className="mt-3 text-[14.5px] text-muted">
            Reset links can only be used once and expire after a short time. Request a
            fresh one and we will email it to you.
          </p>
          <Link
            href="/forgot-password"
            className="mt-5 inline-flex items-center justify-center rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white hover:bg-orange-dark"
          >
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
