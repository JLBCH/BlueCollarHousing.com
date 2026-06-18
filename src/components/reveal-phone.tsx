"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

/**
 * Click-to-reveal phone number. The number is passed base64-encoded and only
 * decoded on click, so it never sits in the page HTML for bots to scrape. The
 * `display` value is the formatted number shown once revealed.
 */
export function RevealPhone({
  encoded,
  display,
}: {
  encoded: string;
  display: string;
}) {
  const [tel, setTel] = useState<string | null>(null);

  if (!tel) {
    return (
      <button
        type="button"
        onClick={() => setTel(atob(encoded))}
        className="text-left text-[15px] font-semibold text-orange hover:underline"
      >
        Click to show phone number
      </button>
    );
  }
  return (
    <a
      href={`tel:${tel}`}
      className="flex items-center gap-2 text-[18px] font-bold text-navy"
    >
      <Phone className="h-4 w-4 text-orange" /> {display}
    </a>
  );
}
