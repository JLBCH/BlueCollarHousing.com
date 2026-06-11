export type PropertyType =
  | "house"
  | "cabin"
  | "rv"
  | "duplex"
  | "mobile-home"
  | "apartment"
  | "room";

export type PetPolicy = "allowed" | "no" | "case_by_case";

export type ListingStatus = "draft" | "pending" | "approved" | "rejected";

/**
 * Domain model for a listing. camelCase; the Supabase row (snake_case) is
 * mapped to this in the data-access layer, and the seed JSON matches it
 * exactly so the UI codes against one shape regardless of source.
 */
export interface Listing {
  id: string;
  slug: string;
  status: ListingStatus;
  title: string;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  priceMonth: number;
  leaseLength: string;
  description: string;
  /** Free-text nearby plants/projects the owner knows of (replaces facility DB). */
  nearbyProjects: string;
  amenities: string[];
  utilitiesIncluded: boolean;
  petPolicy: PetPolicy;
  city: string;
  state: string; // 2-letter
  publicArea: string; // e.g. "Baytown, TX"
  lat: number;
  lng: number;
  contactPhone: string | null;
  showPhone: boolean;
  contactEmail: string | null;
  showEmail: boolean;
  allowContactForm: boolean;
  photos: string[];
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  house: "House",
  cabin: "Cabin",
  rv: "RV Space",
  duplex: "Duplex",
  "mobile-home": "Mobile Home",
  apartment: "Apartment",
  room: "Private Room",
};

export interface ListingFilters {
  q?: string; // city/state text
  type?: PropertyType;
  maxPrice?: number;
  minBeds?: number;
  pets?: boolean;
}
