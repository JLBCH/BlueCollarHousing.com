import { Container } from "@/components/ui/container";

// Strings kept as constants so the apostrophes don't trip JSX lint.
const LINE_1 =
  "Six months in a hotel. Noisy neighbors, no kitchen, and my truck got broken into last week.";
const LINE_2 = "I wish I'd known y'all were here, I'd have been here from day one.";
const FOOTNOTE =
  "We hear stories like this all the time. It is exactly why we built this site.";

export function Quote() {
  return (
    <section className="bg-navy text-white">
      <Container className="max-w-[760px] py-16 text-center sm:py-20">
        <blockquote className="font-display text-[26px] font-semibold leading-snug sm:text-[32px]">
          <span className="text-white/90">&ldquo;{LINE_1} </span>
          <span className="text-orange">{LINE_2}&rdquo;</span>
        </blockquote>
        <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.14em] text-[#aebfd0]">
          Project Manager, Performance Contractors · Texas Gulf Coast
        </p>
        <p className="mx-auto mt-4 max-w-[48ch] text-[14.5px] text-[#9fb4cc]">
          {FOOTNOTE}
        </p>
      </Container>
    </section>
  );
}
