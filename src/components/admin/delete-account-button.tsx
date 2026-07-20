"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteAccount } from "@/app/admin/accounts/actions";

/**
 * Inline two-step delete for a landlord account. Inline (not window.confirm)
 * because confirm() is silently blocked in some installed PWAs / Android in-app
 * browsers. Shows what will be removed so the admin can't nuke a real landlord
 * (and their listings) by reflex.
 */
export function DeleteAccountButton({
  userId,
  email,
  listingCount,
}: {
  userId: string;
  email: string;
  listingCount: number;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      const res = await deleteAccount(userId);
      if (!res.ok) {
        setError(res.error ?? "Could not delete the account.");
        return;
      }
      router.refresh();
    });
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12.5px] font-semibold text-red-600 hover:border-red-300"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-700">
      Delete {email}
      {listingCount > 0 ? ` and ${listingCount} listing${listingCount === 1 ? "" : "s"}` : ""}?
      <button type="button" disabled={pending} onClick={run} className="underline hover:no-underline">
        {pending ? <Loader2 className="inline h-3.5 w-3.5 animate-spin" /> : "Yes, delete"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setConfirm(false)}
        className="text-navy underline hover:no-underline"
      >
        Cancel
      </button>
      {error && <span className="w-full font-normal text-red-600">{error}</span>}
    </span>
  );
}
