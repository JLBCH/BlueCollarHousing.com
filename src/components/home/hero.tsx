"use client";

import { useEffect, useState } from "react";
import { MapPin, Home, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// Hero background: a wide, high-res shot where the refinery dominates the
// frame, so it fills the hero without upscaling or looking zoomed in.
const HERO_BG = "/heroes/hero-08.png";

// Rotating hero taglines.
const TAGLINES = [
  "Connecting workers with housing",
  "Furnished housing minutes from the gate",
  "Stop living in a hotel",
];

export function Hero() {
  const [tag, setTag] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTag((i) => (i + 1) % TAGLINES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden bg-navy-deep text-white">
      {/* image: a wide landscape band on mobile (refinery fully visible),
          full-bleed background on desktop */}
      <div
        className="absolute inset-x-0 top-0 z-0 h-[230px] bg-cover bg-center sm:h-[300px] lg:inset-0 lg:h-full"
        style={{ backgroundImage: `url('${HERO_BG}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-deep lg:hidden" />
      </div>
      {/* desktop scrim for legibility over the full-bleed image */}
      <div className="absolute inset-0 z-[1] hidden bg-gradient-to-b from-[rgba(8,20,35,0.5)] via-[rgba(8,20,35,0.42)] to-[rgba(8,20,35,0.62)] lg:block" />

      <Container className="relative z-[2] pb-12 pt-[214px] sm:pt-[288px] lg:py-20">
        {/* headline + flanking CTA cards */}
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(360px,1.4fr)_1fr]">
          {/* left card */}
          <CtaCard
            label="Looking for housing?"
            sub="Find a furnished place near your next jobsite."
            href="/search"
            cta="Find Housing"
            variant="orange"
          />

          {/* center headline */}
          <div className="order-first text-center lg:order-none">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-orange-tint">
              Hotel alternatives for the road
            </p>
            <h1 className="font-display relative mx-auto mt-3 flex min-h-[2.2em] max-w-[16ch] items-center justify-center text-[38px] font-bold leading-[1.04] drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-[46px] lg:text-[52px]">
              {TAGLINES.map((t, i) => (
                <span
                  key={t}
                  className={cn(
                    "transition-opacity duration-700",
                    i === tag
                      ? "opacity-100"
                      : "absolute inset-x-0 opacity-0",
                  )}
                  aria-hidden={i !== tag}
                >
                  {t}
                </span>
              ))}
            </h1>
            <p className="mx-auto mt-3 max-w-[44ch] text-[16px] text-[#e7eef6] md:text-[18px]">
              Quality housing for the people who keep America working.
            </p>
          </div>

          {/* right card */}
          <CtaCard
            label="Own a property?"
            sub="Reach thousands of traveling workers."
            href="/list-your-property"
            cta="List My Property"
            variant="navy"
          />
        </div>

        {/* search bar */}
        <form
          className="mx-auto mt-9 flex max-w-[760px] flex-col gap-2 rounded-[14px] bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:flex-row sm:items-stretch"
          action="/search"
        >
          <label className="flex flex-1 items-center gap-2.5 rounded-[9px] px-3.5 py-2">
            <MapPin className="h-5 w-5 flex-shrink-0 text-orange" />
            <input
              name="q"
              type="text"
              placeholder="Where are you going?  City, state, or zip"
              className="w-full bg-transparent text-[15.5px] text-ink outline-none placeholder:text-[#9aa6b3]"
            />
          </label>
          <div className="my-1.5 hidden w-px bg-line sm:block" />
          <label className="flex items-center gap-2.5 rounded-[9px] px-3.5 py-2 sm:max-w-[180px]">
            <Home className="h-5 w-5 flex-shrink-0 text-orange" />
            <input
              name="type"
              type="text"
              placeholder="Property type"
              className="w-full bg-transparent text-[15.5px] text-ink outline-none placeholder:text-[#9aa6b3]"
            />
          </label>
          <Button type="submit" variant="orange" className="gap-2">
            <Search className="h-[18px] w-[18px]" /> Search
          </Button>
        </form>
      </Container>
    </section>
  );
}

function CtaCard({
  label,
  sub,
  href,
  cta,
  variant,
}: {
  label: string;
  sub: string;
  href: string;
  cta: string;
  variant: "orange" | "navy";
}) {
  return (
    <div className="rounded-card border border-white/15 bg-[rgba(11,24,40,0.55)] p-5 text-center backdrop-blur-sm">
      <p className="font-display text-[20px] font-bold uppercase">{label}</p>
      <p className="mt-1 text-[13.5px] text-[#cdd9e6]">{sub}</p>
      <Button href={href} variant={variant} className="mt-3.5 w-full">
        {cta}
      </Button>
    </div>
  );
}
