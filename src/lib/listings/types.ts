// Canonical property types offered by the listing builder (Joe's mockup), plus
// legacy seed values kept valid for display until the seed data is refreshed.
export type PropertyType =
  // builder (canonical)
  | "house"
  | "apartment"
  | "condo"
  | "cottage_cabin"
  | "duplex"
  | "flat"
  | "in_law"
  | "townhouse"
  | "mobile_home"
  | "travel_trailer"
  | "rv_spot"
  | "rv_park"
  | "rv_resort"
  | "hotel"
  | "apartment_complex"
  // legacy seed values
  | "cabin"
  | "rv"
  | "mobile-home"
  | "room";

export type ListingKind = "entire" | "room";
export type PetPolicy = "allowed" | "no" | "case_by_case";
export type Internet = "wifi" | "wired" | "none";
export type Laundry = "in_unit" | "coin_op" | "laundromat" | "none";

export type ListingStatus = "draft" | "pending" | "approved" | "rejected";

/**
 * Domain model for a listing. camelCase; the Supabase row (snake_case) is
 * mapped to this in the data-access layer, and the seed JSON matches it
 * exactly so the UI codes against one shape regardless of source. Fields added
 * by the M2 listing builder are optional so seed/legacy rows stay valid.
 */
export interface Listing {
  id: string;
  slug: string;
  status: ListingStatus;
  title: string;
  propertyType: PropertyType;
  listingKind?: ListingKind;
  bedrooms: number;
  bathrooms: number;
  priceMonth: number;
  /** Free-text rates (builder); priceMonth stays for search/map. */
  rates?: string;
  leaseLength: string;
  description: string;
  /** Free-text nearby plants/projects the owner knows of (replaces facility DB). */
  nearbyProjects: string;
  amenities: string[];
  utilitiesIncluded: boolean;
  internet?: Internet;
  laundry?: Laundry;
  paymentMethods?: string;
  petPolicy: PetPolicy;
  city: string;
  state: string; // 2-letter
  zip?: string;
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
  apartment: "Apartment",
  condo: "Condo",
  cottage_cabin: "Cottage / Cabin",
  duplex: "Duplex",
  flat: "Flat",
  in_law: "In-Law Quarters",
  townhouse: "Townhouse",
  mobile_home: "Mobile Home",
  travel_trailer: "Travel Trailer / Camper",
  rv_spot: "Single RV Spot",
  rv_park: "RV Park",
  rv_resort: "RV Resort",
  hotel: "Hotel",
  apartment_complex: "Apartment Complex",
  // legacy seed values
  cabin: "Cabin",
  rv: "RV Space",
  "mobile-home": "Mobile Home",
  room: "Private Room",
};

/** The property types offered in the builder dropdown, in Joe's mockup order. */
export const BUILDER_PROPERTY_TYPES: PropertyType[] = [
  "house",
  "apartment",
  "condo",
  "cottage_cabin",
  "duplex",
  "flat",
  "in_law",
  "townhouse",
  "mobile_home",
  "travel_trailer",
  "rv_spot",
  "rv_park",
  "rv_resort",
  "hotel",
  "apartment_complex",
];

/** Additional-amenity checkboxes (Joe's mockup + sensible defaults; confirm list). */
export const AMENITY_OPTIONS: string[] = [
  "Cable / Satellite TV",
  "Swimming pool",
  "Covered parking",
  "On-site parking",
  "Air conditioning",
  "Fenced yard",
  "Grill / BBQ area",
  "Gym / Fitness",
  "ADA accessible",
];

export interface ListingFilters {
  q?: string; // city/state text
  type?: PropertyType;
  maxPrice?: number;
  minBeds?: number;
  pets?: boolean;
}
