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
  | "other"
  // legacy seed values
  | "cabin"
  | "rv"
  | "mobile-home"
  | "room";

export type ListingKind = "entire" | "room";
export type PetPolicy = "allowed" | "no" | "case_by_case";
/** A single internet option; the stored value can be several, comma-joined. */
export type InternetOption = "wifi" | "wired" | "none";
export type Laundry = "in_unit" | "coin_op" | "laundromat" | "free_onsite" | "none";
/** Billing period for the structured map-pin rate. "call" = call for rates. */
export type RateBilled = "weekly" | "four_weeks" | "monthly" | "call";

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
  /** Owner's custom label when propertyType === "other". */
  propertyTypeOther?: string;
  listingKind?: ListingKind;
  bedrooms: number;
  /** Open-plan units: "studio" | "efficiency" (bedrooms stays 0). */
  bedroomType?: string;
  bathrooms: number;
  priceMonth: number;
  /** Free-text rates (builder); priceMonth stays for search/map. */
  rates?: string;
  /** Structured rate shown in the map preview card. */
  rateAmount?: number | null;
  rateBilled?: RateBilled;
  leaseLength: string;
  description: string;
  /** Free-text nearby plants/projects the owner knows of (replaces facility DB). */
  nearbyProjects: string;
  houseRules?: string;
  amenities: string[];
  utilitiesIncluded: boolean;
  /** Comma-joined internet options, e.g. "wifi,wired". */
  internet?: string;
  laundry?: Laundry;
  paymentMethods?: string;
  /** Private-room extras: household type, shared spaces, notes. */
  roomDetails?: {
    household?: string;
    householdNote?: string;
    bathroom?: string;
    shared?: string[];
    sharedNote?: string;
  };
  petPolicy: PetPolicy;
  city: string;
  state: string; // 2-letter
  zip?: string;
  publicArea: string; // e.g. "Baytown, TX"
  /** Street address, only present (non-null) when the landlord shows it publicly. */
  address?: string | null;
  /** When true the public pin is jittered ~a block and the street address is hidden. */
  anonymizeAddress?: boolean;
  lat: number;
  lng: number;
  contactPhone: string | null;
  showPhone: boolean;
  contactEmail: string | null;
  showEmail: boolean;
  allowContactForm: boolean;
  photos: string[];
  /** Type-specific fields for commercial listings (RV park / hotel / apartment). */
  commercialDetails?: Record<string, unknown>;
}

/** True for the $249 commercial tier property types. */
export function isCommercial(t: PropertyType | string): boolean {
  return t === "rv_park" || t === "hotel" || t === "apartment_complex";
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
  mobile_home: "Mobile / Manufactured Home",
  travel_trailer: "Travel Trailer / Camper",
  rv_spot: "Single RV Spot",
  rv_park: "RV Park",
  rv_resort: "RV Resort",
  hotel: "Hotel",
  apartment_complex: "Multifamily / Apartment Complex",
  other: "Other",
  // legacy seed values
  cabin: "Cabin",
  rv: "RV Space",
  "mobile-home": "Mobile / Manufactured Home",
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
  "hotel",
  "apartment_complex",
  "other",
];

/**
 * Amenity checkboxes grouped like Furnished Finder (General / Electronics /
 * Kitchen / Outdoor & Building). Stored as a flat string[] on the listing.
 */
export const AMENITY_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "General",
    items: [
      "Air conditioning",
      "Heating",
      "Free parking on premises",
      "Covered parking",
      "Wheelchair accessible",
      "Elevator",
      "Storage space",
      "Dedicated workspace",
      "Iron",
      "Hangers",
      "Hair dryer",
      "Linens provided",
      "Towels provided",
      "Starter toiletries (soap, toilet paper)",
      "Portable fans",
      "Smoke detector",
      "Carbon monoxide detector",
      "Fire extinguisher",
      "First aid kit",
      "24 hour check-in",
      "Pet friendly",
      "Smoking allowed",
    ],
  },
  {
    group: "Electronics",
    items: ["TV", "Cable / Satellite TV", "Smart TV", "WiFi", "DVD player"],
  },
  {
    group: "Kitchen",
    items: [
      "Kitchen",
      "Kitchenette",
      "Gas stove",
      "Electric stove",
      "Oven",
      "Microwave",
      "Full size refrigerator",
      "Dishwasher",
      "Coffee maker",
      "Cooking basics (pots, pans, oil)",
      "Dishes and silverware",
    ],
  },
  {
    group: "Outdoor and building",
    items: [
      "Swimming pool",
      "Hot tub",
      "Gym / fitness center",
      "BBQ grill",
      "Patio or balcony",
      "Fenced yard",
      "Game console",
      "Fishing pier",
      "Fish cleaning station",
    ],
  },
];

/** Flat list of every amenity (used for validation / legacy callers). */
export const AMENITY_OPTIONS: string[] = AMENITY_GROUPS.flatMap((g) => g.items);

export interface ListingFilters {
  q?: string; // city/state text
  type?: PropertyType;
  maxPrice?: number;
  minBeds?: number;
  pets?: boolean;
}
