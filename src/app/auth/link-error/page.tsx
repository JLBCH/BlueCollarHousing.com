import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LinkErrorRecoveryForm } from "@/components/auth/link-error-recovery-form";

export const metadata: Metadata = { title: "Request a New Confirmation Email" };

export default function LinkErrorPage() {
  return (
    <AuthShell
      title="That confirmation link no longer works"
      subtitle="It may have expired or been replaced by a newer confirmation email."
      footer={
        <>
          Already confirmed?{" "}
          <Link href="/login" className="font-semibold text-orange hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <LinkErrorRecoveryForm />
    </AuthShell>
  );
}
