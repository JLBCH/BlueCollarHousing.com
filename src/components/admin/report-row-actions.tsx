"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setReportResolved } from "@/app/admin/reports/actions";

/** Resolve / reopen toggle for one report row. */
export function ReportRowActions({ id, resolved }: { id: string; resolved: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await setReportResolved(id, !resolved);
      if (res.ok) router.refresh();
      else setError(res.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={toggle}
        className="rounded-lg border border-line bg-white px-2.5 py-1 text-[12.5px] font-semibold text-navy hover:border-navy/40 disabled:opacity-50"
      >
        {resolved ? "Reopen" : "Mark handled"}
      </button>
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
      {error && <span className="text-[12px] text-red-600">{error}</span>}
    </span>
  );
}
