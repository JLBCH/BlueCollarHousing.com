"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";

/**
 * General contact form. Submission is not yet wired to email delivery; an
 * invisible anti-spam challenge will be added alongside it.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-card border border-line bg-bg-soft px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-orange" />
        <h3 className="font-display mt-3 text-[22px] font-bold text-navy">
          Thanks, message received
        </h3>
        <p className="mt-2 max-w-[40ch] text-[14.5px] text-muted">
          We will get back to you soon. Email delivery is being connected, so for
          anything urgent please call the number listed.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-3.5"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
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
        <input className={inputCls} name="name" placeholder="Your name" required />
        <input className={inputCls} name="email" type="email" placeholder="Email" required />
      </div>
      <input className={inputCls} name="phone" placeholder="Phone (optional)" />
      <textarea
        className={`${inputCls} min-h-[130px] resize-y`}
        name="message"
        placeholder="How can we help?"
        required
      />
      <p className="text-[12px] text-muted">
        Protected from spam. We never share your details.
      </p>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-orange-dark"
      >
        <Send className="h-[18px] w-[18px]" /> Send message
      </button>
    </form>
  );
}
