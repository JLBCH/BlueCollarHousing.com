import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { AuthShell, authSubmitCls } from "@/components/auth/auth-shell";
import { isEmailOtpType } from "@/lib/auth/email-confirmation";
import { safePath } from "@/lib/safe-path";

export const metadata: Metadata = {
  title: "Confirm Email",
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string | string[];
    type?: string | string[];
    next?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : null;
  const type = typeof params.type === "string" ? params.type : null;
  const next = safePath(typeof params.next === "string" ? params.next : null);

  if (!tokenHash || !isEmailOtpType(type)) {
    return (
      <AuthShell
        title="This confirmation link is incomplete"
        subtitle="Request a fresh email to continue securely."
      >
        <Link href="/auth/link-error" className={authSubmitCls}>
          Request a new confirmation email
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Confirm your email"
      subtitle="For your security, finish confirming your address with the button below."
    >
      <form action="/auth/confirm" method="post" className="text-center">
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="next" value={next} />
        <MailCheck className="mx-auto mb-4 h-10 w-10 text-orange" aria-hidden="true" />
        <button type="submit" className={authSubmitCls}>
          Confirm my email
        </button>
        <p className="mt-4 text-[13px] text-muted">
          The link is not used until you press the button.
        </p>
      </form>
    </AuthShell>
  );
}
