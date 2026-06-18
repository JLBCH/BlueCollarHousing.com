"use client";

import { useState } from "react";
import { Ban, CalendarX, Handshake, ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// Explanations for each claim (shown on hover/click).
const ITEMS = [
  { icon: Ban, title: "No booking fees", body: "Keep 100% of your rent." },
  {
    icon: CalendarX,
    title: "No calendar",
    body: "No availability to manage. Your listing is always visible.",
  },
  {
    icon: Handshake,
    title: "No middle man",
    body: "Direct contact with tenants. We connect you, then step out of the way.",
  },
];

/**
 * Action strip below the hero: the Find Housing and List My Property cards now
 * bookend the three "no fees / no calendar / no middle man" boxes (per the
 * approved layout), so the cards sit off the hero image.
 */
export function ExplainerBanner() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="border-b border-line bg-bg-soft py-8">
      <Container className="grid gap-3 lg:grid-cols-[14rem_1fr_1fr_1fr_14rem] lg:items-center">
        <ActionCard
          title="Find Furnished Housing Close to Jobsite"
          sub="Browse furnished places near your next project. No account needed."
          href="/search"
          cta="Find Housing"
          variant="orange"
        />

        {ITEMS.map(({ icon: Icon, title, body }, i) => {
          const isOpen = open === i;
          return (
            <div key={title} className="group rounded-card border border-line bg-white">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
              >
                <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-navy text-orange-tint">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="font-display flex-1 text-[15px] font-bold uppercase leading-tight text-navy">
                  {title}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 flex-shrink-0 text-muted transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <div
                className={cn(
                  "px-3.5 pb-3.5 text-[13.5px] leading-relaxed text-[#3a4a5a]",
                  isOpen ? "block" : "hidden lg:group-hover:block",
                )}
              >
                {body}
              </div>
            </div>
          );
        })}

        <ActionCard
          title="List Your Furnished Rental"
          sub="Put your property in front of traveling workers who need it."
          href="/list-your-property"
          cta="List My Property"
          variant="orange"
        />
      </Container>
    </section>
  );
}

function ActionCard({
  title,
  sub,
  href,
  cta,
  variant,
}: {
  title: string;
  sub: string;
  href: string;
  cta: string;
  variant: "orange" | "navy";
}) {
  return (
    <div className="rounded-card bg-navy-deep p-4 text-center text-white">
      <p className="font-display text-[16px] font-bold uppercase leading-tight">{title}</p>
      <p className="mt-1.5 text-[12.5px] leading-snug text-[#cdd9e6]">{sub}</p>
      <Button href={href} variant={variant} className="mt-3 w-full">
        {cta}
      </Button>
    </div>
  );
}
