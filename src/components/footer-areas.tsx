import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Container } from "@/components/ui/container";
import { getCities, type CityInfo } from "@/lib/listings/cities";

// The footer renders on EVERY page; without this, each dynamic render
// site-wide would pull the whole listings table just to print 6 city links.
// Cached across requests for an hour — city names change rarely.
const getFooterCities = unstable_cache(
  async () => (await getCities()).slice(0, 6),
  ["footer-cities"],
  { revalidate: 3600 },
);

/**
 * Compact "Popular areas" strip for the footer, linking the top city landing
 * pages. Async so <SiteFooter> itself can stay a plain sync component — React
 * server components can render an async child directly. Renders nothing when
 * there are no cities (e.g. an empty production database).
 */
export async function FooterAreas() {
  let cities: CityInfo[] = [];
  try {
    cities = await getFooterCities();
  } catch {
    // Footer must never break the page over a data hiccup.
  }
  if (cities.length === 0) return null;

  return (
    <div className="border-t border-white/10">
      <Container className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4 text-[13px]">
        <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-white">
          Popular areas
        </span>
        {cities.map((c) => (
          <Link
            key={c.slug}
            href={`/housing/${c.slug}`}
            className="hover:text-white"
          >
            {c.city}, {c.state}
          </Link>
        ))}
        <Link href="/housing" className="hover:text-white">
          All areas →
        </Link>
      </Container>
    </div>
  );
}
