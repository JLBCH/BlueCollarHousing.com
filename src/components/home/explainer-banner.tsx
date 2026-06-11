"use client";

import { useState } from "react";
import { Ban, CalendarX, Handshake, ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

// Explanations for each claim.
const ITEMS = [
  {
    icon: Ban,
    title: "No booking fees",
    body: "You never pay a booking fee, not to us and not to the landlord. Find a place, reach out, that is it.",
  },
  {
    icon: CalendarX,
    title: "No calendar",
    body: "No availability calendars to keep updated. Just call the landlord and ask. If it is open, it is open.",
  },
  {
    icon: Handshake,
    title: "No middle man",
    body: "You deal directly with the property owner. We connect you and then step out of the way.",
  },
];

export function ExplainerBanner() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-b border-line bg-bg-soft py-10">
      <Container className="grid gap-4 md:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, body }, i) => {
          const isOpen = open === i;
          return (
            <div
              key={title}
              className="group rounded-card border border-line bg-white"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-navy text-orange-tint">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-display flex-1 text-[20px] font-bold uppercase text-navy">
                  {title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 flex-shrink-0 text-muted transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {/* expands on click (any device) and on hover (desktop) */}
              <div
                className={cn(
                  "px-5 pb-4 text-[14.5px] leading-relaxed text-[#3a4a5a]",
                  isOpen ? "block" : "hidden lg:group-hover:block",
                )}
              >
                {body}
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
