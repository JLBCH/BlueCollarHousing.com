"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geo";
import { slugify } from "@/lib/listings/slug";
import { isCommercial } from "@/lib/listings/types";
import { notifyAdminListingSubmitted } from "@/lib/email/listing-submit-notify";

const normAddr = (s?: string | null) => (s ?? "").trim().toLowerCase();

export type ListingInput = {
  listingKind: "entire" | "room";
  propertyType: string;
  propertyTypeOther: string;
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
  rateAmount: number | null;
  rateBilled: "weekly" | "four_weeks" | "monthly" | "call";
  bedrooms: number;
  bedroomType: string;
  bathrooms: number;
  utilitiesIncluded: boolean;
  petPolicy: "allowed" | "no" | "case_by_case";
  internet: string; // comma-joined options, e.g. "wifi,wired"
  laundry: "in_unit" | "coin_op" | "laundromat" | "free_onsite" | "none";
  amenities: string[];
  houseRules: string;
  paymentMethods: string;
  contactPhone: string;
  showPhone: boolean;
  contactEmail: string;
  showEmail: boolean;
  allowContactForm: boolean;
  photos: string[];
  /** Extra detail for Private Room listings; {} for whole-place listings. */
  roomDetails: RoomDetails;
  /** Set when this is an ADDITIONAL unit — the primary listing it belongs to. */
  parentListingId?: string | null;
  submit: boolean; // true = submit for approval (pending), false = save draft
};

export type RoomDetails = {
  household: string; // "family" | "all_renters" | "other" | ""
  householdNote: string;
  bathroom: string; // "private" | "shared" | ""
  shared: string[]; // selected shared/included keys
  sharedNote: string;
};

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
    ["street address", input.streetAddress],
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
  if (!(input.contactPhone.trim() || input.contactEmail.trim())) {
    return { ok: false, error: "Enter a phone number or email. You can keep it private and still use the contact form." };
  }
  const reachable =
    (input.showPhone && input.contactPhone.trim()) ||
    (input.showEmail && input.contactEmail.trim()) ||
    input.allowContactForm;
  if (!reachable) {
    return { ok: false, error: "Choose at least one way for workers to reach you — show your phone or email, or turn on the contact form." };
  }
  // Contact-form messages are delivered by EMAIL, so the form needs one on file.
  if (input.allowContactForm && !input.contactEmail.trim()) {
    return { ok: false, error: "The contact form sends messages to your email — add an email address to use it (it can stay private)." };
  }

  // Cap: at most 6 residential units per address (per the pricing page). Beyond
  // that the property should use a commercial listing type. Counts the owner's
  // own non-rejected residential listings at the same street + zip.
  {
    const { data: atAddr } = await supabase
      .from("listings")
      .select("id, address, zip, property_type, status")
      .eq("owner_id", user.id)
      .neq("status", "rejected");
    const units = (atAddr ?? []).filter(
      (s) =>
        !isCommercial(s.property_type) &&
        normAddr(s.address) === normAddr(input.streetAddress) &&
        normAddr(s.zip) === normAddr(input.zip),
    ).length;
    if (units >= 6) {
      return {
        ok: false,
        error:
          "This address already has 6 units — the most on the per-unit plan. For a property with more than 6 units, list it as a commercial type (RV park, hotel or apartment complex).",
      };
    }
  }

  // Additional unit: link it to the PRIMARY listing. Validate the parent is the
  // owner's own listing, and resolve to the top primary (in case the anchor was
  // itself an additional unit).
  let parentId: string | null = null;
  if (input.parentListingId) {
    const { data: parent } = await supabase
      .from("listings")
      .select("id, parent_listing_id")
      .eq("id", input.parentListingId)
      .eq("owner_id", user.id)
      .single();
    if (parent) parentId = parent.parent_listing_id ?? parent.id;
  }

  // Geocode the address for the map pin (best effort, drafts don't need it).
  // Use the address-precise geocoder so the pin lands on the building, not the
  // ZIP centroid.
  const center = await geocodeAddress(
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
    property_type_other: input.propertyTypeOther.trim(),
    bedrooms: input.bedrooms || 0,
    bedroom_type: input.bedroomType,
    bathrooms: input.bathrooms || 0,
    price_month: input.priceMonth ?? 0,
    rate_amount: input.rateBilled === "call" ? null : input.rateAmount,
    rate_billed: input.rateBilled,
    rates: input.rates.trim(),
    description: input.description.trim(),
    nearby_projects: input.nearbyProjects.trim(),
    amenities: input.amenities,
    utilities_included: input.utilitiesIncluded,
    internet: input.internet,
    laundry: input.laundry,
    house_rules: input.houseRules.trim(),
    payment_methods: input.paymentMethods.trim(),
    contact_phone: input.contactPhone.trim() || null,
    show_phone: input.showPhone,
    contact_email: input.contactEmail.trim() || null,
    show_email: input.showEmail,
    allow_contact_form: input.allowContactForm,
    pet_policy: input.petPolicy,
    address: input.streetAddress.trim(),
    unit: input.unit.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    public_area: publicArea,
    room_details: input.listingKind === "room" ? input.roomDetails : {},
    anonymize_address: input.anonymizeAddress,
    lat: center ? center[1] : null,
    lng: center ? center[0] : null,
    photos: input.photos,
    parent_listing_id: parentId,
  });

  if (error) return { ok: false, error: error.message };
  if (input.submit) {
    await notifyAdminListingSubmitted({ title: input.title, submitterEmail: user.email });
  }
  revalidatePath("/dashboard");
  return { ok: true, slug };
}
