"use server";

import { createClient } from "@/lib/supabase/server";
import { geocodeUS } from "@/lib/geo";

export type ListingInput = {
  listingKind: "entire" | "room";
  propertyType: string;
  title: string;
  description: string;
  nearbyProjects: string;
  streetAddress: string;
  unit: string;
  city: string;
  state: string;
  zip: string;
  anonymizeAddress: boolean;
  rates: string;
  priceMonth: number | null;
  bedrooms: number;
  bathrooms: number;
  utilitiesIncluded: boolean;
  petPolicy: "allowed" | "no" | "case_by_case";
  internet: "wifi" | "wired" | "none";
  laundry: "in_unit" | "coin_op" | "laundromat" | "none";
  amenities: string[];
  paymentMethods: string;
  photos: string[];
  submit: boolean; // true = submit for approval (pending), false = save draft
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createListing(
  input: ListingInput,
): Promise<{ ok: boolean; error?: string; slug?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  // Minimal server-side validation (the form also validates).
  const required: [string, string][] = [
    ["title", input.title],
    ["description", input.description],
    ["property type", input.propertyType],
    ["city", input.city],
    ["state", input.state],
    ["zip", input.zip],
    ["rates", input.rates],
  ];
  for (const [label, val] of required) {
    if (!val || !String(val).trim()) {
      return { ok: false, error: `Please fill in the ${label}.` };
    }
  }

  // Geocode the address for the map pin (best effort, drafts don't need it).
  const center = await geocodeUS(
    `${input.streetAddress} ${input.city}, ${input.state} ${input.zip}`.trim(),
  );

  const slug = `${slugify(input.title) || "listing"}-${crypto.randomUUID().slice(0, 6)}`;
  const publicArea = `${input.city}, ${input.state}`.trim();

  const { error } = await supabase.from("listings").insert({
    owner_id: user.id,
    status: input.submit ? "pending" : "draft",
    slug,
    title: input.title.trim(),
    listing_kind: input.listingKind,
    property_type: input.propertyType,
    bedrooms: input.bedrooms || 0,
    bathrooms: input.bathrooms || 0,
    price_month: input.priceMonth ?? 0,
    rates: input.rates.trim(),
    description: input.description.trim(),
    nearby_projects: input.nearbyProjects.trim(),
    amenities: input.amenities,
    utilities_included: input.utilitiesIncluded,
    internet: input.internet,
    laundry: input.laundry,
    payment_methods: input.paymentMethods.trim(),
    pet_policy: input.petPolicy,
    address: input.streetAddress.trim(),
    unit: input.unit.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    public_area: publicArea,
    anonymize_address: input.anonymizeAddress,
    lat: center ? center[1] : null,
    lng: center ? center[0] : null,
    photos: input.photos,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, slug };
}
