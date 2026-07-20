"use client";

import { useState, useTransition } from "react";
import { Gift } from "lucide-react";
import { setListingComp } from "@/app/admin/actions";
import { ACTIVE_STATUSES } from "@/lib/subscription-status";

/** Admin control to mark a listing free (comp) so it can go live without a paid
 *  subscription. Shows the listing's current payment status. */
export function CompToggle({
  id,
  isComp,
  subscriptionStatus = "none",
}: {
  id: string;
  isComp: boolean;
  subscriptionStatus?: string;
}) {
  const [comp, setComp] = useState(isComp);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const paid = ACTIVE_STATUSES.includes(subscriptionStatus);

  const statusLabel = comp ? "Comped — free" : paid ? "Subscribed (paid)" : "Not paid";

  function toggle() {
    setError(null);
    start(async () => {
      const res = await setListingComp(id, !comp);
      if (res.ok) setComp(!comp);
      else setError(res.error ?? "Could not update.");
    });
  }

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-muted">Payment</p>
          <p className="mt-0.5 text-[15px] font-semibold text-navy">{statusLabel}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={
            comp
              ? "inline-flex items-center gap-2 rounded-[10px] border border-green-200 bg-green-50 px-4 py-2.5 text-[14px] font-semibold text-green-800 hover:bg-green-100 disabled:opacity-60"
              : "inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-navy hover:border-navy/40 disabled:opacity-60"
          }
        >
          <Gift className="h-[18px] w-[18px]" /> {comp ? "Remove free" : "Mark as free"}
        </button>
      </div>
      {comp && (
        <p className="mt-2 text-[12.5px] text-green-700">
          This listing counts as paid — it goes live as soon as you approve it, at no charge.
        </p>
      )}
      {error && <p className="mt-2 text-[12.5px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
