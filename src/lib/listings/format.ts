import type { Listing, PetPolicy, PropertyType, RateBilled } from "./types";
import { PROPERTY_TYPE_LABELS, isCommercial } from "./types";

export function formatPrice(priceMonth: number): string {
  return `$${priceMonth.toLocaleString("en-US")}/mo`;
}

const RATE_SUFFIX: Record<Exclude<RateBilled, "call">, string> = {
  weekly: "week",
  four_weeks: "4 weeks (28 days)",
  monthly: "month",
};

/**
 * The rate shown in the map preview card. Uses the structured rate when set,
 * otherwise falls back to the legacy monthly price (seed/older listings).
 */
export function previewRate(l: Listing): string {
  if (l.rateBilled === "call") return "Call for rates";
  if (l.rateBilled && l.rateAmount) {
    return `$${l.rateAmount.toLocaleString("en-US")} / ${RATE_SUFFIX[l.rateBilled]}`;
  }
  return l.priceMonth > 0 ? `$${l.priceMonth.toLocaleString("en-US")} / month` : "Call for rates";
}

export function typeLabel(t: PropertyType): string {
  return PROPERTY_TYPE_LABELS[t];
}

/** The building type, with a "Room – " prefix for private-room listings so a
 *  worker sees what the room is *in* — e.g. "Room – House", "Room – Condo".
 *  Whole-place listings return the plain type ("House"). Used on the photo
 *  badge in cards and the listing hero. */
export function typeWithKind(
  l: Pick<Listing, "listingKind" | "propertyType" | "propertyTypeOther">,
): string {
  const base =
    l.propertyType === "other" && l.propertyTypeOther?.trim()
      ? l.propertyTypeOther.trim()
      : PROPERTY_TYPE_LABELS[l.propertyType];
  return l.listingKind === "room" ? `Room – ${base}` : base;
}

/** "Entire Place" / "Room – <type>" for residential, or the commercial type
 *  label (RV Park / Hotel / Apartment Complex). Shown on listing pages + map
 *  pins so a worker instantly knows what kind of place it is. */
export function kindLabel(
  l: Pick<Listing, "listingKind" | "propertyType" | "propertyTypeOther">,
): string {
  if (isCommercial(l.propertyType)) return PROPERTY_TYPE_LABELS[l.propertyType];
  return l.listingKind === "room" ? typeWithKind(l) : "Entire Place";
}

export function petLabel(p: PetPolicy): string {
  return p === "allowed"
    ? "Pets OK"
    : p === "case_by_case"
      ? "Pets case by case"
      : "No pets";
}

/** Short specs line for cards, e.g. "3 bd · 2 ba", "Studio", "Private room". */
export function specsLine(l: Listing): string {
  // A private room (builder listingKind or legacy "room" type) has no bedroom
  // count of its own; its bathroom detail lives in room_details.
  if (l.listingKind === "room" || l.propertyType === "room") {
    return l.bathrooms ? `Private room · ${l.bathrooms} ba` : "Private room";
  }
  if (["rv", "rv_spot", "rv_park", "rv_resort"].includes(l.propertyType)) {
    return "RV space · full hookups";
  }
  // Open-plan units have no bedroom count; label by type instead of "0 bd".
  if (l.bedroomType === "studio") return l.bathrooms ? `Studio · ${l.bathrooms} ba` : "Studio";
  if (l.bedroomType === "efficiency") return l.bathrooms ? `Efficiency · ${l.bathrooms} ba` : "Efficiency";
  const parts: string[] = [];
  if (l.bedrooms) parts.push(`${l.bedrooms} bd`);
  if (l.bathrooms) parts.push(`${l.bathrooms} ba`);
  // Never render an empty/"0 bd · 0 ba" line; fall back to the type label.
  return parts.length ? parts.join(" · ") : typeLabel(l.propertyType);
}
