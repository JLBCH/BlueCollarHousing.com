"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAction } from "@/lib/admin";
import { sendEmail } from "@/lib/email/send";
import { stripe, siteUrl, ACTIVE_STATUSES } from "@/lib/stripe";

type Result = { ok: false; error: string };

async function decide(
  id: string,
  action: "approved" | "rejected",
  note: string,
  opts: { comp?: boolean } = {},
): Promise<Result> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { supabase, user } = ctx;

  const trimmedNote = note.trim();
  // Rejections must explain why, so the landlord knows what to fix.
  if (action === "rejected" && !trimmedNote) {
    return { ok: false, error: "Please add a note explaining the rejection." };
  }

  // Current state, needed to decide how to touch the comp flag.
  const { data: prev } = await supabase
    .from("listings")
    .select("status, is_comp")
    .eq("id", id)
    .single();

  const patch: Record<string, unknown> = {
    status: action,
    review_note: trimmedNote,
    reviewed_at: new Date().toISOString(),
    // Reset the pay-after reminder clock: a fresh decision starts a fresh cycle,
    // so a stale reminder from a prior approval can't suppress the next one.
    payment_reminder_at: null,
  };
  // "Approve & make free" comps the listing so it goes live with no payment.
  // A plain paid approval clears any STALE comp (e.g. from an earlier free
  // approval that was rejected then resubmitted) — but only on a FRESH approval.
  // Re-approving an already-approved (live) listing must not silently de-comp it
  // and take it offline; use the comp toggle to remove a comp from a live listing.
  if (opts.comp) patch.is_comp = true;
  else if (action === "approved" && prev?.status !== "approved") patch.is_comp = false;

  const { data: updated, error } = await supabase
    .from("listings")
    .update(patch)
    .eq("id", id)
    .select("id, title, owner_id, slug, is_comp, subscription_status, stripe_subscription_id")
    .single();
  if (error || !updated) {
    return { ok: false, error: error?.message || "Could not find that listing." };
  }

  // Rejecting a paid listing must stop its billing — cancel the subscription.
  let cancelFailed = false;
  if (action === "rejected" && updated.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(updated.stripe_subscription_id);
      await supabase.from("listings").update({ subscription_status: "canceled" }).eq("id", id);
    } catch (e) {
      console.error("[admin] could not cancel subscription on reject:", e);
      cancelFailed = true;
    }
  }

  // Audit trail.
  await supabase.from("admin_actions").insert({
    actor_id: user.id,
    listing_id: id,
    action,
    note: trimmedNote,
  });

  // Notify the owner (best-effort; never blocks the decision).
  if (updated.owner_id) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", updated.owner_id)
      .single();
    if (owner?.email) {
      await sendEmail(ownerEmail(action, updated, trimmedNote, owner.email));
    }
  }

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/"); // homepage map pins live listings
  redirect(`/admin?done=1${cancelFailed ? "&billing=1" : ""}`);
}

/** Build the owner notification for an approve/reject decision. On approval the
 *  message depends on whether the listing is already live (comped or paid) or
 *  still needs the landlord to complete checkout. */
function ownerEmail(
  action: "approved" | "rejected",
  listing: { title: string; is_comp: boolean; subscription_status: string | null },
  note: string,
  to: string,
): { to: string; subject: string; text: string } {
  if (action === "rejected") {
    return {
      to,
      subject: `Your listing "${listing.title}" needs changes`,
      text: `Your listing "${listing.title}" was not approved yet.\n\nNote from the team:\n${note}\n\nYou can edit it from your dashboard and resubmit.`,
    };
  }
  const live = listing.is_comp || ACTIVE_STATUSES.includes(listing.subscription_status ?? "none");
  if (live) {
    return {
      to,
      subject: `Your listing "${listing.title}" is approved and live`,
      text: `Good news — your listing "${listing.title}" has been approved and is now live on BlueCollarHousing.`,
    };
  }
  return {
    to,
    subject: `Your listing "${listing.title}" is approved — one step left`,
    text: `Great news — your listing "${listing.title}" has been approved!\n\nTo publish it, log in and complete checkout from your dashboard:\n${siteUrl()}/dashboard\n\nIt goes live the moment payment is received.`,
  };
}

/** Approve; the landlord completes checkout to publish. */
export async function approveListing(id: string, note: string) {
  return decide(id, "approved", note);
}

/** Approve and comp in one step — the listing goes live free, no card needed. */
export async function approveListingFree(id: string, note: string) {
  return decide(id, "approved", note, { comp: true });
}

export async function rejectListing(id: string, note: string) {
  return decide(id, "rejected", note);
}

/**
 * Mark a listing comp (free) or remove it. A comped listing satisfies the paid
 * gate without a subscription, so it goes live on approval at no charge — for
 * phone-in landlords, partners, or anyone the admin wants to host for free.
 */
export async function setListingComp(
  id: string,
  comp: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { data, error } = await ctx.supabase
    .from("listings")
    .update({ is_comp: comp })
    .eq("id", id)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "Listing not found." };
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  revalidatePath("/"); // comp toggles visibility → homepage map pins
  return { ok: true };
}
