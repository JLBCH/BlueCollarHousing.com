"use client";

import { useState, useTransition } from "react";
import { Ticket, Plus } from "lucide-react";
import { createPromo } from "@/app/admin/coupons/actions";

const input =
  "rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-navy/40";

export function CouponForm() {
  const [code, setCode] = useState("");
  const [percentOff, setPercentOff] = useState(100);
  const [duration, setDuration] = useState<"once" | "forever">("once");
  const [restrictEmail, setRestrictEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    setSuccess(null);
    const created = code.trim().toUpperCase();
    start(async () => {
      const res = await createPromo({
        code,
        percentOff,
        duration,
        restrictEmail: restrictEmail.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      if (res.ok) {
        setCode("");
        setRestrictEmail("");
        setExpiresAt("");
        setSuccess(`Code ${created} created — it’s in the list below.`);
      } else setError(res.error ?? "Could not create the code.");
    });
  }

  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
      <h2 className="font-display flex items-center gap-2 text-[18px] font-bold text-navy">
        <Ticket className="h-5 w-5 text-orange" /> Create a coupon code
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">
        Landlords enter the code at checkout to discount their subscription.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted">Code</label>
          <input
            className={`${input} w-[160px] uppercase`}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            placeholder="FREEYEAR"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted">% off</label>
          <input
            type="number"
            min={1}
            max={100}
            className={`${input} w-[90px]`}
            value={percentOff}
            onChange={(e) => setPercentOff(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted">Applies to</label>
          <select className={input} value={duration} onChange={(e) => setDuration(e.target.value as "once" | "forever")}>
            <option value="once">First year only</option>
            <option value="forever">Every year (forever)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted">Restrict to email (optional)</label>
          <input
            type="email"
            className={`${input} w-[220px]`}
            value={restrictEmail}
            onChange={(e) => setRestrictEmail(e.target.value)}
            placeholder="landlord@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted">Expires (optional)</label>
          <input type="date" className={input} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-orange px-5 py-2 text-[14px] font-semibold text-white hover:bg-orange-dark disabled:opacity-60"
        >
          <Plus className="h-[18px] w-[18px]" /> Create
        </button>
      </div>
      <p className="mt-2 text-[12.5px] text-muted">
        Leave <span className="font-semibold">email</span> blank for a code anyone can use. Set it to lock the code to one landlord — only they can redeem it at checkout.
      </p>
      {error && <p className="mt-2 text-[12.5px] font-medium text-red-600">{error}</p>}
      {success && <p className="mt-2 text-[12.5px] font-medium text-green-700">{success}</p>}
    </div>
  );
}
