"use client";

import { useCallback, useRef, useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Turnstile } from "@/components/turnstile";
import { PhoneField } from "@/components/phone-field";

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";

/**
 * General contact form. Posts to /api/contact, which validates, runs the spam
 * checks (honeypot + rate limit + Turnstile when configured), persists the
 * message and notifies the admin.
 */
export function ContactForm() {
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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          company: fd.get("company"), // honeypot
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
          Thanks, message received
        </h3>
        <p className="mt-2 max-w-[40ch] text-[14.5px] text-muted">
          We will get back to you soon. For anything urgent, please call the
          number listed.
        </p>
      </div>
    );
  }

  return (
    <form className="grid gap-3.5" onSubmit={handleSubmit}>
      {/* honeypot (hidden from people, bots fill it) */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <input className={inputCls} name="name" aria-label="Your name" placeholder="Your name" required />
        <input className={inputCls} name="email" type="email" aria-label="Email" placeholder="Email" required />
      </div>
      <PhoneField className={inputCls} placeholder="Phone (optional)" />
      <textarea
        className={`${inputCls} min-h-[130px] resize-y`}
        name="message"
        aria-label="Your message" placeholder="How can we help?"
        required
      />
      <Turnstile onToken={onToken} />
      {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}
      <p className="text-[12px] text-muted">
        Protected from spam. We never share your details.
      </p>
      <button
        type="submit"
        disabled={sending}
        className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-orange-dark disabled:opacity-60"
      >
        <Send className="h-[18px] w-[18px]" /> {sending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
