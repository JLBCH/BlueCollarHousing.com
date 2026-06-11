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
  bedrooms: number;
  bathrooms: number;
  price_month: number;
  lease_length: string;
  description: string;
  nearby_projects: string;
  amenities: string[] | null;
  utilities_included: boolean;
  pet_policy: Listing["petPolicy"];
  city: string;
  state: string;
  public_area: string;
  lat: number;
  lng: number;
  contact_phone: string | null;
  show_phone: boolean;
  contact_email: string | null;
  show_email: boolean;
  allow_contact_form: boolean;
  photos: string[] | null;
};

function mapRow(r: ListingRow): Listing {
  return {
    id: r.id,
    slug: r.slug,
    status: r.status,
    title: r.title,
    propertyType: r.property_type,
    bedrooms: r.bedrooms,
    bathrooms: Number(r.bathrooms),
    priceMonth: r.price_month,
    leaseLength: r.lease_length,
    description: r.description,
    nearbyProjects: r.nearby_projects,
    amenities: r.amenities ?? [],
    utilitiesIncluded: r.utilities_included,
    petPolicy: r.pet_policy,
    city: r.city,
    state: r.state,
    publicArea: r.public_area,
    lat: Number(r.lat),
    lng: Number(r.lng),
    contactPhone: r.contact_phone,
    showPhone: r.show_phone,
    contactEmail: r.contact_email,
    showEmail: r.show_email,
    allowContactForm: r.allow_contact_form,
    photos: r.photos ?? [],
  };
}

function fromSeed(filters: ListingFilters = {}): Listing[] {
  return SEED_LISTINGS.filter(
    (l) => l.status === "approved" && matchesFilters(l, filters),
  );
}

/** All approved listings matching the given filters. */
export async function getListings(
  filters: ListingFilters = {},
): Promise<Listing[]> {
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("listings_public")
      .select("*")
      .eq("status", "approved");

    if (error || !data || data.length === 0) return fromSeed(filters);

    const listings = (data as ListingRow[]).map(mapRow);
    return listings.filter((l) => matchesFilters(l, filters));
  } catch {
    return fromSeed(filters);
  }
}

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

    if (error || !data) {
      return SEED_LISTINGS.find((l) => l.slug === slug) ?? null;
    }
    return mapRow(data as ListingRow);
  } catch {
    return SEED_LISTINGS.find((l) => l.slug === slug) ?? null;
  }
}

/** Slugs for static generation. Seed-based so it works before the DB is live. */
export function getAllSeedSlugs(): string[] {
  return SEED_LISTINGS.map((l) => l.slug);
}
