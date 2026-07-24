"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geo";
import { BUCKET, storagePath, subscriptionsToCancel } from "@/lib/listings/storage";
import { scopeOwner } from "@/lib/listings/scope-owner";
import { notifyAdminListingSubmitted } from "@/lib/email/listing-submit-notify";
import { stripe } from "@/lib/stripe";
import type { ListingInput } from "@/app/dashboard/listings/new/actions";

type Result = { ok: boolean; error?: string };

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateListing(
  id: string,
  input: ListingInput,
  currentStatus?: string,
): Promise<Result> {
  const { supabase, user } = await getUserClient();
  if (!user) return { ok: false, error: "You must be signed in." };

  for (const [label, val] of [
    ["title", input.title],
    ["description", input.description],
    ["property type", input.propertyType],
    ["street address", input.streetAddress],
    ["city", input.city],
    ["state", input.state],
    ["zip", input.zip],
    ["rates", input.rates],
  ] as [string, string][]) {
    if (!val || !String(val).trim()) return { ok: false, error: `Please fill in the ${label}.` };
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

  // Admins may edit any listing; owners only their own.
  const ownerId = await scopeOwner(supabase, user.id);

  // Capture the current photos first so we can clean up any the owner removed
  // (DB-loaded thumbnails have no in-memory storage path, so the uploader can't
  // delete them; reconcile here on save instead of orphaning them in Storage).
  let prevQ = supabase.from("listings").select("photos").eq("id", id);
  if (ownerId) prevQ = prevQ.eq("owner_id", ownerId);
  const { data: prev } = await prevQ.single();
  const oldPhotos = (prev?.photos as string[] | null) ?? [];

  // Address-precise geocode so the pin lands on the building, not the ZIP centroid.
  const center = await geocodeAddress(
    `${input.streetAddress} ${input.city}, ${input.state} ${input.zip}`.trim(),
  );
  // submit => pending; otherwise keep the listing's current status (don't
  // silently unpublish an approved listing on a plain save).
  const status = input.submit ? "pending" : currentStatus || "draft";

  const patch: Record<string, unknown> = {
    status,
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
    public_area: `${input.city}, ${input.state}`.trim(),
    room_details: input.listingKind === "room" ? input.roomDetails : {},
    anonymize_address: input.anonymizeAddress,
    photos: input.photos,
  };
  // Only overwrite the map pin when geocoding succeeded. A failed/empty geocode
  // (e.g. an anonymized listing with no street address) must NOT wipe existing
  // coordinates, or the listing silently drops off the map on every save.
  if (center) {
    patch.lat = center[1];
    patch.lng = center[0];
  }

  let updQ = supabase.from("listings").update(patch).eq("id", id);
  if (ownerId) updQ = updQ.eq("owner_id", ownerId);
  const { data, error } = await updQ.select("id");

  if (error) return { ok: false, error: error.message };
  // A matched-zero update returns no error; surface it instead of a false "saved".
  if (!data || data.length === 0) {
    return { ok: false, error: "We could not find that listing under your account." };
  }

  // Remove from Storage any photos that are no longer on the listing.
  const removed = oldPhotos.filter((u) => !input.photos.includes(u));
  const removedPaths = removed
    .map(storagePath)
    .filter((p): p is string => !!p);
  if (removedPaths.length) await supabase.storage.from(BUCKET).remove(removedPaths);

  // Tell the admin when this save is a submit-for-approval (resubmit included).
  if (input.submit) {
    await notifyAdminListingSubmitted({ title: input.title, submitterEmail: user.email });
  }

  revalidatePath("/dashboard");
  revalidatePath("/"); // a live listing's edit (e.g. address) can move its map pin
  return { ok: true };
}

export async function deleteListing(id: string): Promise<Result> {
  const { supabase, user } = await getUserClient();
  if (!user) return { ok: false, error: "You must be signed in." };

  // Admins may delete any listing; owners only their own.
  const ownerId = await scopeOwner(supabase, user.id);

  let rowQ = supabase
    .from("listings")
    .select("photos, stripe_subscription_id")
    .eq("id", id);
  if (ownerId) rowQ = rowQ.eq("owner_id", ownerId);
  const { data: row } = await rowQ.single();

  // Child units are cascade-deleted by the FK, so gather them here — their
  // photos and subscriptions have to be cleaned up too or we silently keep
  // billing for units whose rows are about to vanish.
  const { data: children } = await supabase
    .from("listings")
    .select("photos, stripe_subscription_id")
    .eq("parent_listing_id", id);

  const doomed = [row, ...(children ?? [])].filter(Boolean) as {
    photos: string[] | null;
    stripe_subscription_id: string | null;
  }[];

  // Terms 6.2: deleting a listing cancels its automatic renewal. Cancel BEFORE
  // the row goes (afterwards we'd have no record of which subscription to end),
  // best-effort so a Stripe outage can't block the delete.
  for (const subId of subscriptionsToCancel(doomed)) {
    try {
      await stripe.subscriptions.cancel(subId);
    } catch (e) {
      console.error("[listings] could not cancel subscription on delete:", e);
    }
  }

  // Remove photos from storage.
  const paths = doomed
    .flatMap((l) => l.photos ?? [])
    .map(storagePath)
    .filter((p): p is string => !!p);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);

  let delQ = supabase.from("listings").delete().eq("id", id);
  if (ownerId) delQ = delQ.eq("owner_id", ownerId);
  const { error } = await delQ;
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/"); // deleting a live listing removes its homepage map pin
  return { ok: true };
}

export async function duplicateListing(id: string): Promise<Result> {
  const { supabase, user } = await getUserClient();
  if (!user) return { ok: false, error: "You must be signed in." };

  // Copy only the data columns explicitly (never `select("*")` + spread, which
  // would carry id/created_at and break the insert the moment a generated or
  // managed column is added in a future migration).
  const COPY_COLS = [
    "title", "listing_kind", "property_type", "property_type_other",
    "bedrooms", "bedroom_type", "bathrooms", "price_month", "rate_amount",
    "rate_billed", "rates", "lease_length", "description", "nearby_projects",
    "amenities", "utilities_included", "internet", "laundry", "house_rules", "payment_methods",
    "pet_policy", "address", "unit", "city", "state", "zip", "public_area",
    "room_details", "anonymize_address", "lat", "lng", "photos",
    "contact_phone", "contact_email", "show_phone", "show_email", "allow_contact_form",
  ];
  const { data: row, error: readErr } = await supabase
    .from("listings")
    .select(COPY_COLS.join(","))
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  if (readErr || !row) return { ok: false, error: readErr?.message || "Listing not found." };

  const source = row as unknown as Record<string, unknown>;
  const baseSlug = String(source.public_area || "listing")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  // Duplicate the Storage objects so the copy has its OWN photo files. Sharing
  // the same objects means deleting or editing one listing would break the
  // other's images. External (seed) URLs have no storage path → leave as-is.
  const srcPhotos = (source.photos as string[] | null) ?? [];
  const newKey = crypto.randomUUID();
  const copiedPhotos: string[] = [];
  for (let i = 0; i < srcPhotos.length; i++) {
    const from = storagePath(srcPhotos[i]);
    if (!from) {
      copiedPhotos.push(srcPhotos[i]);
      continue;
    }
    const ext = from.split(".").pop() || "jpg";
    const to = `${user.id}/${newKey}/${i}.${ext}`;
    const { error: copyErr } = await supabase.storage.from(BUCKET).copy(from, to);
    if (copyErr) {
      copiedPhotos.push(srcPhotos[i]); // best-effort: fall back to the shared URL
      continue;
    }
    copiedPhotos.push(supabase.storage.from(BUCKET).getPublicUrl(to).data.publicUrl);
  }
  source.photos = copiedPhotos;

  // No "(copy)" suffix: the title is public, and a duplicate that gets approved
  // with it still attached reads as a mistake on the live site. The dashboard
  // already tells the two apart — the copy lands as a Draft, the original stays
  // Live — and the slug is unique regardless.
  const { error } = await supabase.from("listings").insert({
    ...source,
    owner_id: user.id,
    slug: `${baseSlug || "listing"}-${crypto.randomUUID().slice(0, 6)}`,
    status: "draft",
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setListingStatus(
  id: string,
  status: "draft" | "pending",
): Promise<Result> {
  const { supabase, user } = await getUserClient();
  if (!user) return { ok: false, error: "You must be signed in." };
  const { data, error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id, title");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "We could not find that listing under your account." };
  }
  if (status === "pending") {
    await notifyAdminListingSubmitted({ title: data[0].title, submitterEmail: user.email });
  }
  revalidatePath("/dashboard");
  return { ok: true };
}
