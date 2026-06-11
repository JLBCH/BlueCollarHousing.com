import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHead } from "@/components/ui/section-head";
import { Button } from "@/components/ui/button";

function CardList({ items }: { items: string[] }) {
  return (
    <ul className="my-4 grid gap-2.5">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2.5 text-[14.5px] text-white/90">
          <Check className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={2.4} />
          {t}
        </li>
      ))}
    </ul>
  );
}

export function AudienceSplit() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHead eyebrow="How it works" title="Two sides, one simple idea">
        Workers find a place near the job. Owners reach reliable, working
        tenants. We stay out of the way.
      </SectionHead>

      <Container className="mt-11 grid gap-6 lg:grid-cols-2">
        {/* Workers */}
        <article className="relative flex min-h-[340px] items-end overflow-hidden rounded-card text-white shadow-[0_8px_24px_rgba(16,32,48,0.08)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/heroes/hero-01.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,24,40,0.92)] via-[rgba(11,24,40,0.45)] to-[rgba(11,24,40,0.25)]" />
          <div className="relative p-7 sm:p-8">
            <h3 className="font-display text-[30px] font-bold">For workers</h3>
            <p className="mt-2 max-w-[40ch] text-[15px] text-[#dfe8f1]">
              Browse free, no account needed. Find furnished housing near your
              next project and contact the owner directly.
            </p>
            <CardList
              items={[
                "Furnished & move-in ready",
                "Flexible stays, weekly to long-term",
                "Call or text the owner, your choice",
              ]}
            />
            <Button href="/search" variant="orange">
              Find Housing
            </Button>
          </div>
        </article>

        {/* Owners */}
        <article className="relative flex min-h-[340px] items-end overflow-hidden rounded-card text-white shadow-[0_8px_24px_rgba(16,32,48,0.08)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/heroes/hero-03.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(207,71,21,0.92)] via-[rgba(207,71,21,0.42)] to-[rgba(15,36,64,0.28)]" />
          <div className="relative p-7 sm:p-8">
            <h3 className="font-display text-[30px] font-bold">
              For property owners
            </h3>
            <p className="mt-2 max-w-[40ch] text-[15px] text-[#fde7dc]">
              List your property in front of thousands of traveling workers. You
              set the price, terms and contact method.
            </p>
            <CardList
              items={[
                "Reach qualified, working tenants",
                "No booking fees, no middleman",
                "Hide your address, keep your privacy",
              ]}
            />
            <Button href="/list-your-property" variant="navy">
              List Your Property
            </Button>
          </div>
        </article>
      </Container>
    </section>
  );
}
