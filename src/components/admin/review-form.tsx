"use client";

import { useState, useTransition } from "react";
import { Check, X, Gift, Loader2 } from "lucide-react";
import { approveListing, approveListingFree, rejectListing } from "@/app/admin/actions";

type Kind = "approveFree" | "approve" | "reject";

/** Approve / reject controls with a shared note (required on reject).
 *  Two approve paths: "make free" comps + publishes instantly; "landlord pays"
 *  approves and emails them to complete checkout (it stays hidden until paid). */
export function ReviewForm({ id }: { id: string }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyKind, setBusyKind] = useState<Kind | null>(null);
  const [pending, startTransition] = useTransition();

  function act(kind: Kind) {
    setError(null);
    if (kind === "reject" && !note.trim()) {
      setError("Add a note so the landlord knows what to fix.");
      return;
    }
    setBusyKind(kind);
    startTransition(async () => {
      const fn =
        kind === "approveFree" ? approveListingFree : kind === "approve" ? approveListing : rejectListing;
      // On success the action redirects; only an error object comes back.
      const res = await fn(id, note);
      if (res && !res.ok) {
        setError(res.error);
        setBusyKind(null);
      }
    });
  }

  const busy = (k: Kind) => pending && busyKind === k;

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
      <label htmlFor="review-note" className="block text-[13px] font-bold uppercase tracking-wide text-muted">
        Note to the landlord
      </label>
      <textarea
        id="review-note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional on approve. Required on reject — explain what needs fixing."
        className="mt-2 min-h-[90px] w-full resize-y rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14.5px] text-ink outline-none focus:border-navy/40"
      />
      {error && <p className="mt-2 text-[13px] font-medium text-red-600">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => act("approveFree")}
          className="inline-flex items-center gap-2 rounded-[10px] bg-green-600 px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          {busy("approveFree") ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Gift className="h-[18px] w-[18px]" />}{" "}
          {busy("approveFree") ? "Publishing…" : "Approve & make free"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => act("approve")}
          className="inline-flex items-center gap-2 rounded-[10px] bg-navy px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-navy-soft hover:shadow-[0_2px_10px_rgba(16,32,48,0.28)] disabled:opacity-60"
        >
          {busy("approve") ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Check className="h-[18px] w-[18px]" />}{" "}
          {busy("approve") ? "Approving…" : "Approve — landlord pays"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => act("reject")}
          className="inline-flex items-center gap-2 rounded-[10px] border border-red-200 bg-white px-5 py-2.5 text-[15px] font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          {busy("reject") ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <X className="h-[18px] w-[18px]" />}{" "}
          {busy("reject") ? "Rejecting…" : "Reject with note"}
        </button>
      </div>
      <p className="mt-3 text-[12.5px] text-muted">
        <span className="font-semibold">Make free</span> publishes instantly at no charge.{" "}
        <span className="font-semibold">Landlord pays</span> approves it and emails them to complete
        checkout — it stays hidden until they pay.
      </p>
    </div>
  );
}
