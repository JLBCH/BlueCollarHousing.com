import { Container } from "@/components/ui/container";
import { HeroSearch } from "@/components/home/hero-search";

// Two-sided hero imagery (per the approved design): worker on the left,
// landlord on the right, framing the center copy.
const WORKER_IMG = "/heroes/worker-truck.jpg";
const LANDLORD_IMG = "/heroes/landlord-laptop.jpg";

export function Hero() {
  return (
    <section className="relative bg-navy-deep text-white">
      {/* Note: no `overflow-hidden` here — it would clip the search
          autocomplete dropdown into the section below. The background image
          divs are absolutely sized to the section, so nothing bleeds out. */}
      {/* Desktop: worker (left) and landlord (right) photos frame the center
          content; gradients blend each into the navy center for legibility. */}
      {/* The two photos meet in the middle and each fades smoothly into navy at
          its inner edge, so the center reads as one soft dark zone behind the
          headline, no hard-edged rectangle or solid-navy gap. */}
      <div
        className="absolute inset-y-0 left-0 z-0 hidden w-1/2 bg-cover bg-center lg:block"
        style={{ backgroundImage: `url('${WORKER_IMG}')` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(8,20,35,0) 36%, rgba(8,20,35,0.5) 66%, #081423 100%)",
          }}
        />
      </div>
      <div
        className="absolute inset-y-0 right-0 z-0 hidden w-1/2 bg-cover bg-center lg:block"
        style={{ backgroundImage: `url('${LANDLORD_IMG}')` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, rgba(8,20,35,0) 36%, rgba(8,20,35,0.5) 66%, #081423 100%)",
          }}
        />
      </div>
      {/* Mobile: the worker photo as a top band fading into navy. */}
      <div
        className="absolute inset-x-0 top-0 z-0 h-[230px] bg-cover bg-center sm:h-[300px] lg:hidden"
        style={{ backgroundImage: `url('${WORKER_IMG}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-navy-deep" />
      </div>

      <Container className="relative z-[2] pb-14 pt-[214px] sm:pt-[288px] lg:py-28">
        {/* center headline (CTA cards now live in the strip below the hero) */}
        <div className="text-center">
          <h1
            className="font-display mx-auto max-w-[15ch] text-[38px] font-bold leading-[1.05] drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:text-[46px] lg:text-[56px]"
            style={{ textTransform: "none" }}
          >
            Hotel Alternatives for those Working on the Road
          </h1>
        </div>

        {/* search bar with autocomplete */}
        <HeroSearch />
      </Container>
    </section>
  );
}
