"use client";

import { useCallback, useRef, useState } from "react";
import { Send, CheckCircle2, MessageSquare } from "lucide-react";
import { Turnstile } from "@/components/turnstile";

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2.5 text-[14.5px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";

/**
 * Per-listing contact form for landlords who take messages instead of showing
 * a number. Posts to /api/listing-contact; the landlord's address is never
 * exposed to the sender. `open` controls whether it starts expanded (used when
 * there's no phone/email to call at all).
 */
export function ListingContactForm({
  slug,
  title,
  startOpen = false,
}: {
  slug: string;
  title: string;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
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
      const res = await fetch("/api/listing-contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listingSlug: slug,
          listingTitle: title,
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          message: fd.get("message"),
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
      <div className="flex flex-col items-center rounded-[10px] border border-line bg-bg-soft px-4 py-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-orange" />
        <p className="font-display mt-2 text-[16px] font-bold text-navy">
          Message sent
        </p>
        <p className="mt-1 text-[13px] text-muted">
          The owner will get your message and reach out.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[15px] font-semibold text-navy hover:border-navy/40"
      >
        <MessageSquare className="h-[18px] w-[18px]" /> Message the owner
      </button>
    );
  }

  return (
    <form className="grid gap-2.5 rounded-[10px] border border-line bg-bg-soft p-3.5" onSubmit={handleSubmit}>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <input className={inputCls} name="name" placeholder="Your name" required />
      <input className={inputCls} name="phone" placeholder="Phone" />
      <input className={inputCls} name="email" type="email" placeholder="Email" />
      <textarea
        className={`${inputCls} min-h-[90px] resize-y`}
        name="message"
        placeholder="Ask about availability, dates, rates..."
        required
      />
      <Turnstile onToken={onToken} />
      {error && <p className="text-[12.5px] font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-5 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-orange-dark disabled:opacity-60"
      >
        <Send className="h-[16px] w-[16px]" /> {sending ? "Sending..." : "Send message"}
      </button>
      <p className="text-[11.5px] leading-snug text-muted">
        Give a phone or email so the owner can reply. Spam-protected.
      </p>
    </form>
  );
}
