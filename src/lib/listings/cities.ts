import { cache } from "react";
import { getListings } from "./index";
import { slugify } from "./slug";
import type { Listing } from "./types";

/**
 * City-level grouping for the /housing/[city] SEO landing pages. Everything
 * derives from getListings() so the city list always reflects live approved
 * listings — no separate table to maintain, and an empty database simply
 * yields no cities.
 */

export type CityInfo = {
  city: string;
  state: string;
  slug: string;
  count: number;
};

/** URL slug for a city page: "Corpus Christi", "TX" → "corpus-christi-tx".
 *  Same normalizer as listing/blog slugs so the rules can never drift. */
export function citySlug(city: string, state: string): string {
  return slugify(`${city} ${state}`);
}

/** Pure grouping — pass listings you already fetched to avoid a second query. */
export function groupCities(listings: Listing[]): CityInfo[] {
  const bySlug = new Map<string, CityInfo>();
  for (const l of listings) {
    if (!l.city || !l.state) continue;
    const slug = citySlug(l.city, l.state);
    const existing = bySlug.get(slug);
    if (existing) {
      existing.count += 1;
    } else {
      bySlug.set(slug, { city: l.city, state: l.state, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => b.count - a.count || a.slug.localeCompare(b.slug),
  );
}

/** Distinct cities with listing counts, most listings first. React-cached so
 *  generateMetadata, the page body, and the footer share one fetch per request. */
export const getCities = cache(
  async (): Promise<CityInfo[]> => groupCities(await getListings()),
);
