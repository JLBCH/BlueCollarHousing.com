"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { deleteListing } from "@/app/dashboard/listings/actions";

/** Admin-only edit/delete for any listing (owner-scoping is dropped for admins
 *  in the underlying actions). */
export function AdminListingControls({ id }: { id: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
      <p className="text-[13px] font-bold uppercase tracking-wide text-muted">Admin controls</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Link
          href={`/dashboard/listings/${id}/edit`}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-4 py-2.5 text-[14px] font-semibold text-navy hover:border-navy/40"
        >
          <Pencil className="h-4 w-4" /> Edit listing
        </Link>
        {confirm ? (
          <span className="inline-flex items-center gap-2 rounded-[10px] border border-red-300 bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-700">
            Delete permanently?
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const res = await deleteListing(id);
                  if (res.ok) router.push("/admin?done=1");
                  else setError(res.error ?? "Could not delete.");
                })
              }
              className="inline-flex items-center gap-1 underline hover:no-underline"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Yes, delete
            </button>
            <button type="button" disabled={pending} onClick={() => setConfirm(false)} className="text-navy underline hover:no-underline">
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="inline-flex items-center gap-2 rounded-[10px] border border-red-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete listing
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-[12.5px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
