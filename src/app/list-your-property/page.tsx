import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple annual pricing to list your furnished rental on BlueCollarHousing. Single listing $99/year, additional units $10/year, commercial $249/year. No booking fees, no middle man.",
};

// Annual-only subscriptions. Single and additional-unit are combined into one
// plan; the commercial tier covers properties with more than six units.
const PLANS = [
  {
    name: "Single Listing",
    price: "$99",
    unit: "per year",
    blurb:
      "One property: house, apartment, cabin, garage apartment, camper, RV spot, room rental or any single unit.",
    addon:
      "Got a duplex, triplex or several units at the same address? Add each additional unit for just $10 per year, up to 6 units total.",
    featured: true,
  },
  {
    name: "Commercial Listing",
    price: "$249",
    unit: "per year",
    blurb:
      "Apartment complexes, hotels, RV parks, RV resorts or any property with more than six units.",
    addon: null,
    featured: false,
  },
];

const INCLUDED = [
  "Your listing stays live all year",
  "Photos, full details and amenities",
  "Direct calls and texts, no middle man",
  "Nearby projects and facilities field",
  "Edit your listing anytime",
];

export default function PricingPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-[680px] text-center">
          <h1 className="font-display text-[40px] font-bold text-navy sm:text-[48px]">
            List your property
          </h1>
          <p className="mx-auto mt-4 max-w-[62ch] text-[17px] leading-relaxed text-muted">
            The only housing directory built specifically for the industrial
            workforce. List your furnished rental(s) and connect directly with
            traveling tradesmen working away from home. No middleman, no booking
            fees, no calendars to update, just direct contact with serious
            renters. Annual subscription, no monthly billing.
          </p>
        </div>

        {/* two plans (single listing combines the per-unit add-on) */}
        <div className="mx-auto mt-12 grid max-w-[860px] gap-6 lg:grid-cols-2">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={
                p.featured
                  ? "relative flex flex-col rounded-card border-2 border-orange bg-white p-7 shadow-[0_12px_32px_rgba(232,85,31,0.16)]"
                  : "relative flex flex-col rounded-card border border-line bg-white p-7"
              }
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-[22px] font-bold text-navy">
                {p.name}
              </h2>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="font-display text-[44px] font-bold text-navy">
                  {p.price}
                </span>
                <span className="mb-2 text-[15px] text-muted">{p.unit}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">{p.blurb}</p>
              {p.addon && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-orange/30 bg-orange/[0.06] p-4">
                  <span className="font-display whitespace-nowrap text-[20px] font-bold text-orange">
                    +$10
                  </span>
                  <p className="text-[15px] font-medium leading-relaxed text-ink">
                    {p.addon}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* what every listing includes */}
        <div className="mx-auto mt-12 max-w-[760px] rounded-card border border-line bg-bg-soft p-7">
          <h3 className="font-display text-[18px] font-bold text-navy">
            Every listing includes
          </h3>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {INCLUDED.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-[14.5px] text-ink">
                <Check className="h-[18px] w-[18px] flex-shrink-0 text-orange" strokeWidth={2.4} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* terms + get started */}
        <div className="mx-auto mt-8 max-w-[760px] text-center">
          <Button href="/login" variant="orange" size="lg">
            Get started
          </Button>
          <p className="mx-auto mt-5 max-w-[60ch] text-[13px] leading-relaxed text-muted">
            Have a coupon code? Enter it at checkout for a discount or free
            listing. All listings are reviewed and approved before going live.
            Annual subscriptions renew automatically and you can cancel any time
            before renewal. If your listing is not approved you will receive a
            full refund.
          </p>
        </div>
      </Container>
    </section>
  );
}
