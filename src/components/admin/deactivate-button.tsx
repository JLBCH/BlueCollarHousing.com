"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deactivatePromo } from "@/app/admin/coupons/actions";

export function DeactivateButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await deactivatePromo(id);
            if (res.ok) router.refresh();
            else setError(res.error ?? "Failed");
          })
        }
        className="text-[13px] font-semibold text-red-600 hover:underline disabled:opacity-50"
      >
        {pending ? "…" : "Deactivate"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
