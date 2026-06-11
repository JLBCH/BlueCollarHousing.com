import { Quote as QuoteIcon } from "lucide-react";
import { Container } from "@/components/ui/container";

// Strings kept as constants so the apostrophes don't trip JSX lint.
const LINE_1 =
  "Six months in a hotel. Noisy neighbors, no kitchen, and my truck got broken into last week.";
const LINE_2 = "I wish I'd known y'all were here, I'd have been here from day one.";
const FOOTNOTE =
  "We heard that more times than we can count. It is exactly why we built this site.";

export function Quote() {
  return (
    <section className="bg-navy text-white">
      <Container className="max-w-[760px] py-16 text-center sm:py-20">
        <QuoteIcon className="mx-auto h-8 w-8 text-orange" />
        <blockquote className="mt-5 font-display text-[26px] font-semibold leading-snug sm:text-[32px]">
          <span className="text-white/90">{LINE_1} </span>
          <span className="text-orange">{LINE_2}</span>
        </blockquote>
        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#aebfd0]">
          Traveling Pipefitter · Gulf Coast, Texas
        </p>
        <p className="mx-auto mt-4 max-w-[48ch] text-[14.5px] text-[#9fb4cc]">
          {FOOTNOTE}
        </p>
      </Container>
    </section>
  );
}
