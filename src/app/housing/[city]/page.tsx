import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListings } from "@/lib/listings";
import { citySlug, getCities, groupCities } from "@/lib/listings/cities";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";

// Revalidated, never build-time static (no generateStaticParams): city pages
// come and go with live listings, so new cities appear without a redeploy.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const slug = (await params).city;
  const city = (await getCities()).find((c) => c.slug === slug);
  if (!city) return { title: "Area not found" };
  const title = `Furnished housing in ${city.city}, ${city.state} · crew & workforce housing`;
  const description = `Furnished weekly and monthly rentals in ${city.city}, ${city.state} for traveling workers and crews. Houses, apartments, rooms, RV spots and RV parks near the job — no hotels.`;
  return {
    title,
    description,
    openGraph: { title, description, url: `/housing/${slug}` },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const slug = (await params).city;
  // One fetch feeds everything: the city match, its listings, and the
  // cross-links. (generateMetadata's getCities shares it via React cache.)
  const allListings = await getListings();
  const cities = groupCities(allListings);
  const city = cities.find((c) => c.slug === slug);
  if (!city) notFound();

  const listings = allListings.filter((l) => citySlug(l.city, l.state) === slug);
  const otherCities = cities.filter((c) => c.slug !== slug);

  return (
    <section className="py-14 sm:py-16">
      <Container>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
          Crew &amp; workforce housing
        </p>
        <h1 className="font-display mt-3 text-[38px] font-bold text-navy sm:text-[46px]">
          Furnished housing in {city.city}, {city.state}
        </h1>
        <p className="mt-3 max-w-[68ch] text-[16px] leading-relaxed text-muted">
          Working a turnaround, shutdown, or long-term project near{" "}
          {city.city}? These furnished rentals are listed by local owners who
          rent to traveling workers and crews — close to the refineries,
          plants, and job sites that bring you to town. Weekly and monthly
          rates, no hotels, and you deal with the owner directly.
        </p>

        {listings.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-card border border-line bg-bg-soft p-8 text-center">
            <p className="text-[16px] font-semibold text-navy">
              No listings in {city.city} right now.
            </p>
            <p className="mt-1 text-[14.5px] text-muted">
              Try the search page for nearby areas, or check back soon.
            </p>
          </div>
        )}

        <div className="mt-10">
          <Button href="/search" variant="outline">
            Search all listings
          </Button>
        </div>

        {otherCities.length > 0 && (
          <div className="mt-12 border-t border-line pt-8">
            <h2 className="font-display text-[24px] font-bold text-navy">
              More areas
            </h2>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2.5">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/housing/${c.slug}`}
                    className="text-[14.5px] font-medium text-navy hover:text-orange"
                  >
                    {c.city}, {c.state}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/housing"
                  className="text-[14.5px] font-medium text-muted hover:text-orange"
                >
                  All areas →
                </Link>
              </li>
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
