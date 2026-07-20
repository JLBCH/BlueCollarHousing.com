"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { saveSearchRadius } from "@/app/admin/settings/actions";

const inputCls =
  "w-24 rounded-lg border border-line bg-white px-3 py-2 text-[14.5px] text-ink outline-none focus:border-navy/40";

/** Admin form for the search proximity radius. */
export function SettingsForm({
  initialRadius,
  min,
  max,
}: {
  initialRadius: number;
  min: number;
  max: number;
}) {
  const router = useRouter();
  const [radius, setRadius] = useState(String(initialRadius));
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await saveSearchRadius(Number(radius));
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error || "Something went wrong.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
      <label className="text-[14px] font-semibold text-navy" htmlFor="radius">
        Search radius (miles)
      </label>
      <p className="-mt-2 text-[13px] text-muted">
        When someone searches a location, listings within this many miles count
        as &ldquo;nearby&rdquo;. Between {min} and {max} miles.
      </p>
      <div className="flex items-center gap-3">
        <input
          id="radius"
          type="number"
          min={min}
          max={max}
          step={5}
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2 text-[14px] font-semibold text-white hover:bg-orange-dark disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-navy">
            <CheckCircle2 className="h-4 w-4 text-orange" /> Saved
          </span>
        )}
      </div>
      {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}
    </form>
  );
}
