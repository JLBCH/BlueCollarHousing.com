"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geo";
import { BUCKET, storagePath } from "@/lib/listings/storage";
import { slugify } from "@/lib/listings/slug";
import { scopeOwner } from "@/lib/listings/scope-owner";
import { notifyAdminListingSubmitted, notifyAdminListingEdited } from "@/lib/email/listing-submit-notify";
import type { CommercialType } from "@/lib/listings/commercial-forms";

export type CommercialInput = {
  type: CommercialType;
  name: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  nearbyProjects: string;
  anonymizeAddress: boolean;
  details: Record<string, unknown>;
  petPolicy: "allowed" | "no" | "case_by_case";
  rates: string;
  contactPhone: string;
  showPhone: boolean;
  contactEmail: string;
  showEmail: boolean;
  allowContactForm: boolean;
  photos: string[];
  submit: boolean;
};

type Result = { ok: boolean; error?: string };

/** Create a commercial listing (RV Park / Hotel / Apartment Complex). */
export async function createCommercialListing(input: CommercialInput): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  if (!input.name.trim()) return { ok: false, error: "Please add the property name." };
  if (!input.city.trim() || !input.state.trim() || !input.zip.trim())
    return { ok: false, error: "Please complete the location (city, state, zip)." };
  if (!input.description.trim()) return { ok: false, error: "Please add a property description." };
  if (!input.rates.trim()) return { ok: false, error: "Please describe your rates." };
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

  // Address-precise geocode so the pin lands on the property, not the ZIP centroid.
  const center = await geocodeAddress(
    `${input.streetAddress} ${input.city}, ${input.state} ${input.zip}`.trim(),
  );

  const { error } = await supabase.from("listings").insert({
    owner_id: user.id,
    status: input.submit ? "pending" : "draft",
    title: input.name.trim(),
    property_type: input.type,
    listing_kind: "entire",
    // Commercial listings have free-text rates only (no structured map-pin rate).
    rates: input.rates.trim(),
    rate_billed: "call",
    rate_amount: null,
    bedrooms: 0,
    bathrooms: 0,
    description: input.description.trim(),
    nearby_projects: input.nearbyProjects.trim(),
    amenities: [],
    utilities_included: false,
    pet_policy: input.petPolicy,
    address: input.streetAddress.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    public_area: `${input.city.trim()}, ${input.state.trim()}`,
    anonymize_address: input.anonymizeAddress,
    contact_phone: input.contactPhone.trim() || null,
    show_phone: input.showPhone,
    contact_email: input.contactEmail.trim() || null,
    show_email: input.showEmail,
    allow_contact_form: input.allowContactForm,
    commercial_details: input.details,
    photos: input.photos,
    lat: center ? center[1] : null,
    lng: center ? center[0] : null,
    slug: `${slugify(input.name)}-${crypto.randomUUID().slice(0, 6)}`,
  });
  if (error) return { ok: false, error: error.message };

  if (input.submit) {
    await notifyAdminListingSubmitted({ title: input.name, submitterEmail: user.email, isCommercial: true });
  }
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Update an existing commercial listing (owner-scoped). Mirrors the residential
 *  updateListing: preserves the map pin when geocoding fails, keeps an approved
 *  listing live on a plain save, and cleans up any removed photos. */
export async function updateCommercialListing(
  id: string,
  input: CommercialInput,
  currentStatus?: string,
): Promise<Result> {
  void currentStatus; // Kept for the existing client contract; DB state is authoritative.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  if (!input.name.trim()) return { ok: false, error: "Please add the property name." };
  if (!input.city.trim() || !input.state.trim() || !input.zip.trim())
    return { ok: false, error: "Please complete the location (city, state, zip)." };
  if (!input.description.trim()) return { ok: false, error: "Please add a property description." };
  if (!input.rates.trim()) return { ok: false, error: "Please describe your rates." };
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

  // Admins may edit any listing; owners only their own.
  const ownerId = await scopeOwner(supabase, user.id);

  let prevQ = supabase.from("listings").select("photos, status, reviewed_at").eq("id", id);
  if (ownerId) prevQ = prevQ.eq("owner_id", ownerId);
  const { data: prev, error: prevError } = await prevQ.single();
  if (prevError || !prev) {
    return { ok: false, error: "We could not find that listing under your account." };
  }
  const oldPhotos = (prev.photos as string[] | null) ?? [];

  const center = await geocodeAddress(
    `${input.streetAddress} ${input.city}, ${input.state} ${input.zip}`.trim(),
  );
  // Carry forward the scoped database value instead of trusting client state.
  // The database trigger moves material edits to approved rows back to pending.
  const status = prev.status === "approved" ? "approved" : input.submit ? "pending" : prev.status;

  const patch: Record<string, unknown> = {
    status,
    title: input.name.trim(),
    property_type: input.type,
    rates: input.rates.trim(),
    rate_billed: "call",
    rate_amount: null,
    description: input.description.trim(),
    nearby_projects: input.nearbyProjects.trim(),
    pet_policy: input.petPolicy,
    address: input.streetAddress.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip: input.zip.trim(),
    public_area: `${input.city.trim()}, ${input.state.trim()}`,
    anonymize_address: input.anonymizeAddress,
    contact_phone: input.contactPhone.trim() || null,
    show_phone: input.showPhone,
    contact_email: input.contactEmail.trim() || null,
    show_email: input.showEmail,
    allow_contact_form: input.allowContactForm,
    commercial_details: input.details,
    photos: input.photos,
  };
  if (center) {
    patch.lat = center[1];
    patch.lng = center[0];
  }

  let updQ = supabase.from("listings").update(patch).eq("id", id);
  if (ownerId) {
    updQ = updQ.eq("owner_id", ownerId).eq("status", prev.status);
    updQ = prev.reviewed_at === null
      ? updQ.is("reviewed_at", null)
      : updQ.eq("reviewed_at", prev.reviewed_at);
  }
  const { data, error } = await updQ.select("id, status");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    if (ownerId) {
      return {
        ok: false,
        error: "This listing changed while you were editing. Refresh the page and try again.",
      };
    }
    return { ok: false, error: "We could not find that listing under your account." };
  }

  // Clean up photos the owner removed.
  const removed = oldPhotos
    .filter((u) => !input.photos.includes(u))
    .map(storagePath)
    .filter((p): p is string => !!p);
  if (removed.length) await supabase.storage.from(BUCKET).remove(removed);

  // Option A: editing an already-live listing keeps it live; send the admin a
  // low-key FYI instead of pulling it back into the review queue.
  const submittedForReview = input.submit && data[0]?.status === "pending";
  const editedLiveListing =
    ownerId !== null && prev.status === "approved" && data[0]?.status === "approved";
  if (submittedForReview) {
    await notifyAdminListingSubmitted({ title: input.name, submitterEmail: user.email, isCommercial: true });
  } else if (editedLiveListing) {
    await notifyAdminListingEdited({ title: input.name, editorEmail: user.email });
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
