import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { getCities } from "@/lib/listings/cities";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

// Revalidated, never build-time static: new cities appear without a redeploy,
// and an empty production database just renders the empty state.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse furnished housing by area",
  description:
    "Furnished crew and workforce housing by city. Weekly and monthly rentals near refineries, plants, and job sites — no hotels.",
};

export default async function HousingIndexPage() {
  const cities = await getCities();

  return (
    <section className="py-14 sm:py-16">
      <Container>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
          Browse by area
        </p>
        <h1 className="font-display mt-3 text-[38px] font-bold text-navy sm:text-[46px]">
          Furnished housing by city
        </h1>
        <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-muted">
          Pick the area closest to your job site. Every city page shows
          furnished weekly and monthly rentals from local owners — houses,
          apartments, rooms, RV spots, and more.
        </p>

        {cities.length > 0 ? (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cities.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/housing/${c.slug}`}
                  className="group flex items-center justify-between rounded-card border border-line bg-white px-4 py-3.5 transition-shadow hover:shadow-[0_8px_24px_rgba(16,32,48,0.1)]"
                >
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-navy group-hover:text-orange">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-orange" />
                    {c.city}, {c.state}
                  </span>
                  <span className="text-[13px] font-medium text-muted">
                    {c.count} {c.count === 1 ? "listing" : "listings"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-card border border-line bg-bg-soft p-8 text-center">
            <p className="text-[16px] font-semibold text-navy">
              No areas yet — new listings are coming.
            </p>
            <p className="mt-1 text-[14.5px] text-muted">
              Check the search page or come back soon.
            </p>
          </div>
        )}

        <div className="mt-10">
          <Button href="/search" variant="outline">
            Search all listings
          </Button>
        </div>
      </Container>
    </section>
  );
}
