import type { Listing, PetPolicy, PropertyType } from "./types";
import { PROPERTY_TYPE_LABELS } from "./types";

export function formatPrice(priceMonth: number): string {
  return `$${priceMonth.toLocaleString("en-US")}/mo`;
}

export function typeLabel(t: PropertyType): string {
  return PROPERTY_TYPE_LABELS[t];
}

export function petLabel(p: PetPolicy): string {
  return p === "allowed"
    ? "Pets OK"
    : p === "case_by_case"
      ? "Pets case by case"
      : "No pets";
}

/** Short specs line for cards, e.g. "3 bd · 2 ba" or "RV space". */
export function specsLine(l: Listing): string {
  if (l.propertyType === "rv") return "RV space · full hookups";
  if (l.propertyType === "room") return `Private room · ${l.bathrooms} ba`;
  const bd = `${l.bedrooms} bd`;
  const ba = `${l.bathrooms} ba`;
  return `${bd} · ${ba}`;
}
