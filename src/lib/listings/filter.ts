import type { Listing, ListingFilters, PropertyType } from "./types";
import { PROPERTY_TYPE_LABELS } from "./types";

const VALID_TYPES = new Set(Object.keys(PROPERTY_TYPE_LABELS));

export function matchesFilters(l: Listing, f: ListingFilters): boolean {
  if (f.type && l.propertyType !== f.type) return false;
  if (f.maxPrice && l.priceMonth > f.maxPrice) return false;
  if (f.minBeds && l.bedrooms < f.minBeds) return false;
  if (f.pets && l.petPolicy === "no") return false;
  if (f.q) {
    const hay = `${l.city} ${l.state} ${l.publicArea} ${l.title}`.toLowerCase();
    if (!hay.includes(f.q.trim().toLowerCase())) return false;
  }
  return true;
}

export function filterListings(
  listings: Listing[],
  f: ListingFilters,
): Listing[] {
  return listings.filter((l) => matchesFilters(l, f));
}

type RawParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Parse URL search params into typed, validated filters. */
export function parseFilters(params: RawParams): ListingFilters {
  const f: ListingFilters = {};
  const q = one(params.q)?.trim();
  if (q) f.q = q;

  const type = one(params.type)?.toLowerCase();
  if (type && VALID_TYPES.has(type)) f.type = type as PropertyType;

  const maxPrice = Number(one(params.maxPrice));
  if (Number.isFinite(maxPrice) && maxPrice > 0) f.maxPrice = maxPrice;

  const minBeds = Number(one(params.minBeds));
  if (Number.isFinite(minBeds) && minBeds > 0) f.minBeds = minBeds;

  const pets = one(params.pets);
  if (pets === "true" || pets === "1") f.pets = true;

  return f;
}

/** Filters → URL query string (omits empty values). */
export function filtersToQuery(f: ListingFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.type) p.set("type", f.type);
  if (f.maxPrice) p.set("maxPrice", String(f.maxPrice));
  if (f.minBeds) p.set("minBeds", String(f.minBeds));
  if (f.pets) p.set("pets", "true");
  return p.toString();
}
