import { Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHead } from "@/components/ui/section-head";

const QUOTES = [
  {
    quote:
      "Blue Collar Housing made my job a lot easier. Close to the site, clean place, way better than the hotel I was stuck in for months.",
    name: "Pipefitter",
    where: "Texas Gulf Coast",
  },
  {
    quote:
      "As a property owner, I love the consistent renters and the peace of mind. The crews that come through actually take care of the place.",
    name: "Property Owner",
    where: "Louisiana",
  },
  {
    quote:
      "Every time I travel for work, this is the first place I check. Real listings, real people, no hassle.",
    name: "Electrician",
    where: "North Dakota",
  },
];

export function Testimonials() {
  return (
    <section className="bg-bg-soft py-16 sm:py-20">
      <SectionHead eyebrow="Trusted by workers & owners" title="Built on word of mouth" />

      <Container className="mt-11 grid gap-5 md:grid-cols-3">
        {QUOTES.map((t) => (
          <figure
            key={t.name}
            className="rounded-card border border-line bg-white p-7 shadow-[0_8px_24px_rgba(16,32,48,0.06)]"
          >
            <div className="mb-3 flex gap-0.5 text-[#f3a712]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" strokeWidth={0} />
              ))}
            </div>
            <blockquote className="text-[15.5px] text-[#2a3744]">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-[13.5px] text-muted">
              <b className="block font-bold text-navy">{t.name}</b>
              {t.where}
            </figcaption>
          </figure>
        ))}
      </Container>
    </section>
  );
}
