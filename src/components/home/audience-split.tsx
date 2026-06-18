import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
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

// Content sits on the RIGHT over a right-side fade so the photo subject on the
// left (the worker with his duffel bag, the laptop screen) stays visible.
function Card({
  image,
  position,
  children,
}: {
  image: string;
  position: string;
  children: React.ReactNode;
}) {
  return (
    <article className="relative flex min-h-[360px] items-end overflow-hidden rounded-card text-white shadow-[0_8px_24px_rgba(16,32,48,0.08)]">
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url('${image}')`, backgroundPosition: position }}
      />
      {/* mobile: darken the bottom; desktop: darken the right */}
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(11,24,40,0.95)] via-[rgba(11,24,40,0.4)] to-transparent lg:hidden" />
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(to left, rgba(11,24,40,0.86) 0%, rgba(11,24,40,0.5) 44%, rgba(11,24,40,0.06) 74%, transparent 88%)",
        }}
      />
      <div className="relative ml-auto w-full p-6 sm:p-7 lg:max-w-[56%]">{children}</div>
    </article>
  );
}

export function AudienceSplit() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="grid gap-6 lg:grid-cols-2">
        {/* Workers */}
        <Card image="/heroes/hero-01.jpg" position="22% 50%">
          <h3 className="font-display text-[30px] font-bold">For workers</h3>
          <p className="mt-2 max-w-[40ch] text-[15px] text-[#dfe8f1]">
            <span className="font-bold uppercase italic text-white">
              Free to browse, no account needed.
            </span>{" "}
            Find furnished housing near your next project and contact the owner
            directly.
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
        </Card>

        {/* Owners */}
        <Card image="/heroes/owner-kitchen.jpg" position="35% 50%">
          <h3 className="font-display text-[30px] font-bold">For property owners</h3>
          <p className="mt-2 max-w-[40ch] text-[15px] text-[#dfe8f1]">
            List your property in front of the traveling workers who need it. You
            set the price, terms and contact method.
          </p>
          <CardList
            items={[
              "Reach qualified, working tenants",
              "No booking fees, no middleman",
              "Hide your address, keep your privacy",
            ]}
          />
          <Button href="/list-your-property" variant="orange">
            List Your Property
          </Button>
        </Card>
      </Container>
    </section>
  );
}
