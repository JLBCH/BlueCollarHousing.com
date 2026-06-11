import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "List My Property",
  description:
    "Simple annual pricing to list your furnished rental on BlueCollarHousing. No booking fees, no middle man.",
};

// Annual-only subscription. Pricing not yet finalized.
const FEATURES = [
  "Your listing stays live all year",
  "Photos, full details and amenities",
  "Direct calls and texts, no middle man",
  "Nearby projects and facilities field",
  "Edit your listing anytime",
  "List as many properties as you have",
];

export default function PricingPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            List My Property
          </p>
          <h1 className="font-display mt-3 text-[40px] font-bold text-navy sm:text-[48px]">
            Simple annual pricing, no booking fees
          </h1>
          <p className="mx-auto mt-3 max-w-[48ch] text-[17px] text-muted">
            One flat yearly price to keep your place in front of workers looking
            for housing near the job. Final pricing is being confirmed.
          </p>
        </div>

        {/* single annual plan */}
        <div className="mx-auto mt-12 max-w-[440px]">
          <div className="relative rounded-card border border-orange bg-white p-8 shadow-[0_12px_32px_rgba(232,85,31,0.16)]">
            <span className="absolute -top-3 left-8 rounded-full bg-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              Annual listing
            </span>
            <h2 className="font-display text-[22px] font-bold text-navy">
              Annual
            </h2>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="font-display text-[44px] font-bold text-navy">
                $290
              </span>
              <span className="mb-2 text-[15px] text-muted">per year, per listing</span>
            </div>
            <ul className="mt-6 grid gap-2.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[14.5px] text-ink">
                  <Check className="h-[18px] w-[18px] flex-shrink-0 text-orange" strokeWidth={2.4} />
                  {f}
                </li>
              ))}
            </ul>
            <Button href="/login" variant="orange" className="mt-7 w-full" size="lg">
              Get started
            </Button>
            <p className="mt-4 text-center text-[12.5px] leading-relaxed text-muted">
              Subscriptions are annual and non-refundable, with one exception: if
              your listing is not approved in review, you get a full refund.
            </p>
          </div>
        </div>

        {/* create account */}
        <div className="mx-auto mt-10 max-w-[440px] rounded-card border border-line bg-bg-soft p-6 text-center">
          <p className="text-[15.5px] text-ink">
            New here?{" "}
            <span className="font-semibold text-navy">
              Create your landlord account
            </span>{" "}
            to get started.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button href="/login" variant="navy">
              Create account
            </Button>
            <Button href="/login" variant="outline">
              Log in
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
