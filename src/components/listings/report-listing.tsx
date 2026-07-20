"use client";

import { useCallback, useRef, useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { Turnstile } from "@/components/turnstile";
import { REPORT_REASONS, REPORT_REASON_LABELS } from "@/lib/reports";
import { inputCls } from "@/components/ui/field";

/**
 * "Report a problem" for a public listing — many legacy listings can't be
 * verified by the admin, so renters flag dead contact info / gone properties.
 * Deliberately quiet UI: a muted text link that expands into a small form.
 * Posts to /api/listing-report.
 */
export function ReportListing({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenRef = useRef<string>("");
  const onToken = useCallback((t: string) => {
    tokenRef.current = t;
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/listing-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingSlug: slug,
          listingTitle: title,
          reason: fd.get("reason"),
          note: fd.get("note"),
          name: fd.get("name"),
          email: fd.get("email"),
          company: fd.get("company"),
          turnstileToken: tokenRef.current,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p className="inline-flex items-center gap-1.5 text-[12.5px] text-muted">
        <CheckCircle2 className="h-4 w-4 text-orange" /> Thanks — we&apos;ll look into
        this listing.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12.5px] text-muted underline hover:text-navy"
      >
        <Flag className="h-3.5 w-3.5" /> Report a problem with this listing
      </button>
    );
  }

  return (
    <form
      className="grid max-w-[420px] gap-2.5 rounded-[10px] border border-line bg-bg-soft p-3.5 text-left"
      onSubmit={handleSubmit}
    >
      <p className="text-[13px] font-semibold text-navy">
        What&apos;s wrong with this listing?
      </p>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <select className={inputCls} name="reason" aria-label="Reason" defaultValue="bad-contact">
        {REPORT_REASONS.map((r) => (
          <option key={r} value={r}>
            {REPORT_REASON_LABELS[r]}
          </option>
        ))}
      </select>
      <textarea
        className={`${inputCls} min-h-[70px] resize-y`}
        name="note"
        aria-label="Details"
        placeholder="Anything that helps us check it (optional for the first two reasons)"
      />
      <input
        className={inputCls}
        name="name"
        aria-label="Your name (optional)"
        placeholder="Your name (optional)"
      />
      <input
        className={inputCls}
        name="email"
        type="email"
        aria-label="Your email (optional)"
        placeholder="Your email (optional, in case we have questions)"
      />
      <Turnstile onToken={onToken} />
      {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-navy px-4 py-2 text-[13.5px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Send report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[13px] text-muted underline hover:text-navy"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
