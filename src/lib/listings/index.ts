import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { SEED_LISTINGS } from "./seed";
import { matchesFilters } from "./filter";
import type { Listing, ListingFilters } from "./types";

export type { Listing, ListingFilters, PropertyType } from "./types";
export { PROPERTY_TYPE_LABELS } from "./types";

/**
 * Data-access layer for listings.
 *
 * Reads approved listings from Supabase, falling back to the local seed when
 * the table is missing/empty or the request fails. This lets the UI work
 * before and after the database is populated, when the SQL migration + seed
 * are applied, the same code reads live data with no UI changes.
 */

type ListingRow = {
  id: string;
  slug: string;
  status: Listing["status"];
  title: string;
  property_type: Listing["propertyType"];
  listing_kind: Listing["listingKind"] | null;
  bedroom_type: string | null;
  bedrooms: number;
  bathrooms: number;
  price_month: number;
  rate_amount: number | null;
  rate_billed: Listing["rateBilled"];
  lease_length: string;
  description: string;
  nearby_projects: string;
  house_rules: string | null;
  amenities: string[] | null;
  utilities_included: boolean;
  pet_policy: Listing["petPolicy"];
  payment_methods: string | null;
  room_details: Listing["roomDetails"] | null;
  city: string;
  state: string;
  zip: string;
  public_area: string;
  anonymize_address: boolean;
  address: string | null;
  lat: number;
  lng: number;
  contact_phone: string | null;
  show_phone: boolean;
  contact_email: string | null;
  show_email: boolean;
  allow_contact_form: boolean;
  photos: string[] | null;
  rates: string | null;
  commercial_details: Record<string, unknown> | null;
};

function mapRow(r: ListingRow): Listing {
  return {
    id: r.id,
    slug: r.slug,
    status: r.status,
    title: r.title,
    propertyType: r.property_type,
    listingKind: r.listing_kind ?? undefined,
    bedroomType: r.bedroom_type ?? undefined,
    rateAmount: r.rate_amount,
    rateBilled: r.rate_billed,
    bedrooms: r.bedrooms,
    bathrooms: Number(r.bathrooms),
    priceMonth: r.price_month,
    leaseLength: r.lease_length,
    description: r.description,
    nearbyProjects: r.nearby_projects,
    houseRules: r.house_rules ?? "",
    amenities: r.amenities ?? [],
    utilitiesIncluded: r.utilities_included,
    petPolicy: r.pet_policy,
    city: r.city,
    state: r.state,
    zip: r.zip ?? "",
    publicArea: r.public_area,
    anonymizeAddress: r.anonymize_address ?? true,
    address: r.address ?? null,
    lat: Number(r.lat),
    lng: Number(r.lng),
    contactPhone: r.contact_phone,
    showPhone: r.show_phone,
    contactEmail: r.contact_email,
    showEmail: r.show_email,
    allowContactForm: r.allow_contact_form,
    photos: r.photos ?? [],
    rates: r.rates ?? undefined,
    paymentMethods: r.payment_methods ?? undefined,
    roomDetails: r.room_details ?? undefined,
    commercialDetails: r.commercial_details ?? {},
  };
}

function fromSeed(filters: ListingFilters = {}): Listing[] {
  return SEED_LISTINGS.filter(
    (l) => l.status === "approved" && matchesFilters(l, filters),
  );
}

// Anonymized-pin jitter (500-600 ft, Joe's "about a block") lives in SQL, not
// here: the listings_public view (migration 20260720090001) serves lat/lng
// pre-shifted by a secret random per-row offset, exactly like it nulls the
// street address — so exact coordinates never leave the database at all, even
// for someone querying the view directly. Rows from this data layer are
// therefore already safe to publish (maps, JSON-LD).

// The bundled demo listings (seed.json) are a DEVELOPMENT convenience only. In
// production an empty database must show an empty state — never phantom demo
// listings that the admin can't delete (they aren't real rows).
const USE_SEED_FALLBACK = process.env.NODE_ENV !== "production";

/** All approved listings matching the given filters. React-cached per request
 *  so layout (footer areas), metadata, and page bodies share one query — the
 *  cache keys on argument identity, so no-arg calls all hit one entry. */
export const getListings = cache(async function getListings(
  filters: ListingFilters = {},
): Promise<Listing[]> {
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("listings_public")
      .select("*")
      .eq("status", "approved");

    // Log errors so a DB outage is distinguishable from a genuinely empty
    // table in the logs — to visitors both render as "no listings".
    if (error) console.error("[listings] getListings query error:", error.message);
    if (error || !data || data.length === 0) {
      return USE_SEED_FALLBACK ? fromSeed(filters) : [];
    }

    const listings = (data as ListingRow[]).map(mapRow);
    return listings.filter((l) => matchesFilters(l, filters));
  } catch (e) {
    console.error("[listings] getListings threw:", e);
    return USE_SEED_FALLBACK ? fromSeed(filters) : [];
  }
});

/** A single approved listing by slug, or null. */
export async function getListingBySlug(slug: string): Promise<Listing | null> {
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("listings_public")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();

    if (error) console.error("[listings] getListingBySlug query error:", error.message);
    if (error || !data) {
      return (USE_SEED_FALLBACK && SEED_LISTINGS.find((l) => l.slug === slug)) || null;
    }
    return mapRow(data as ListingRow);
  } catch (e) {
    console.error("[listings] getListingBySlug threw:", e);
    return (USE_SEED_FALLBACK && SEED_LISTINGS.find((l) => l.slug === slug)) || null;
  }
}

/** Slugs for static generation. Seed-based in dev; empty in production so no
 *  demo pages get pre-rendered (real listings render on demand). */
export function getAllSeedSlugs(): string[] {
  return USE_SEED_FALLBACK ? SEED_LISTINGS.map((l) => l.slug) : [];
}
