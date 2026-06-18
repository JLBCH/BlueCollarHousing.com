"use client";

import { useCallback, useRef, useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Turnstile } from "@/components/turnstile";

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";

/**
 * "Help me find a place" worker lead form. Posts to /api/leads. The worker
 * tells us where the job is and how to reach them, and we help match housing.
 */
export function LeadForm() {
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
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          jobSiteCity: fd.get("jobSiteCity"),
          state: fd.get("state"),
          note: fd.get("note"),
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
      <div className="flex flex-col items-center rounded-card border border-line bg-bg-soft px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-orange" />
        <h3 className="font-display mt-3 text-[22px] font-bold text-navy">
          Got it, we are on it
        </h3>
        <p className="mt-2 max-w-[42ch] text-[14.5px] text-muted">
          We will look for housing near your job site and reach out. In the
          meantime, browse what is already listed.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-3.5" onSubmit={handleSubmit}>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <input className={inputCls} name="name" placeholder="Your name" required />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <input className={inputCls} name="phone" placeholder="Phone" />
        <input className={inputCls} name="email" type="email" placeholder="Email (optional)" />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-[1fr_120px]">
        <input className={inputCls} name="jobSiteCity" placeholder="Job site city" required />
        <input className={inputCls} name="state" placeholder="State" />
      </div>
      <textarea
        className={`${inputCls} min-h-[110px] resize-y`}
        name="note"
        placeholder="Anything else? Dates, budget, type of place, number of people..."
      />
      <Turnstile onToken={onToken} />
      {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}
      <p className="text-[12px] text-muted">
        Give us a phone or email so we can reach you. We never share your details.
      </p>
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-orange-dark disabled:opacity-60"
      >
        <Send className="h-[18px] w-[18px]" /> {sending ? "Sending..." : "Help me find a place"}
      </button>
    </form>
  );
}
