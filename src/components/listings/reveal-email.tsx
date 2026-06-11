"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

/**
 * Click-to-reveal email. The address is passed base64-encoded and only decoded
 * on click, so it never appears in the page HTML, basic email harvesters that
 * don't run JS can't scrape it. (The real anti-spam is routing through the
 * contact form; this is a lightweight extra for landlords who show an email.)
 */
export function RevealEmail({ encoded }: { encoded: string }) {
  const [email, setEmail] = useState<string | null>(null);

  const cls =
    "flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[15px] font-semibold text-navy hover:border-navy/40";

  if (!email) {
    return (
      <button type="button" onClick={() => setEmail(atob(encoded))} className={cls}>
        <Mail className="h-[18px] w-[18px]" /> Show email
      </button>
    );
  }
  return (
    <a href={`mailto:${email}`} className={cls}>
      <Mail className="h-[18px] w-[18px]" /> {email}
    </a>
  );
}
