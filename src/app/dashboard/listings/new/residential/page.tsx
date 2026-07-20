import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ListingBuilder, type ListingFormValues } from "@/components/listings/listing-builder";
import { ACTIVE_STATUSES } from "@/lib/subscription-status";
import { isCommercial } from "@/lib/listings/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a Listing" };

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

// Landlord-only; self-guarded (not just middleware) so it can't be statically
// prerendered + CDN-cached and leak the builder UI to logged-out visitors.
export default async function NewResidentialPage({
  searchParams,
}: {
  searchParams: Promise<{ sameAddressAs?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/listings/new/residential");

  // "Add another unit at this address" flow: pre-fill the address from an
  // existing listing the owner picked, so they only fill in the unit's own
  // details. The additional unit is billed at $10/yr (handled at checkout).
  const { sameAddressAs } = await searchParams;
  let initial: Partial<ListingFormValues> | undefined;
  let addlUnit: { addressLabel: string; unitNumber: number; firstIsLive: boolean } | undefined;
  let primaryId: string | undefined;
  let primaryIsComp = false;
  if (sameAddressAs) {
    const { data: anchor } = await supabase
      .from("listings")
      .select(
        "address, city, state, zip, anonymize_address, contact_phone, show_phone, contact_email, show_email, allow_contact_form, nearby_projects, payment_methods, parent_listing_id",
      )
      .eq("id", sameAddressAs)
      .eq("owner_id", user.id)
      .single();
    if (anchor?.address) {
      // Link the new unit to the TOP primary (the anchor, or its parent if the
      // anchor is itself an additional unit).
      primaryId = anchor.parent_listing_id ?? sameAddressAs;
      // Prefill what units at one address share: the address + the owner's contact
      // details. Everything unit-specific (title, beds, rate, photos) stays blank.
      initial = {
        streetAddress: anchor.address ?? "",
        city: anchor.city ?? "",
        state: anchor.state ?? "",
        zip: anchor.zip ?? "",
        anonymizeAddress: anchor.anonymize_address ? "yes" : "no",
        contactPhone: anchor.contact_phone ?? "",
        showPhone: anchor.show_phone === false ? "no" : "yes",
        contactEmail: anchor.contact_email ?? "",
        showEmail: anchor.show_email ? "yes" : "no",
        allowContactForm: anchor.allow_contact_form === false ? "no" : "yes",
        // Shared across the property; carried from the primary and locked below.
        nearbyProjects: anchor.nearby_projects ?? "",
        paymentMethods: anchor.payment_methods ?? "",
      };
      // Count the owner's existing units at this same address to number the new
      // one (and surface the 6-unit cap). Also note whether one is already LIVE,
      // because the $10 rate only applies once a paid/comped unit exists here —
      // so the banner doesn't promise $10 before the $99 base is established.
      const { data: siblings } = await supabase
        .from("listings")
        .select("id, address, zip, is_comp, subscription_status, status, property_type")
        .eq("owner_id", user.id);
      // Count the same way the cap does: non-rejected residential units here.
      const here = (siblings ?? []).filter(
        (s) =>
          s.status !== "rejected" &&
          !isCommercial(s.property_type) &&
          norm(s.address) === norm(anchor.address) &&
          norm(s.zip) === norm(anchor.zip),
      );
      // A comped (free) primary can't spawn $10 units — the $99 base must be a
      // real paid subscription. Block the flow below instead of showing a form
      // that checkout would reject.
      primaryIsComp = !!(siblings ?? []).find((s) => s.id === primaryId)?.is_comp;
      const firstIsLive = here.some((s) => ACTIVE_STATUSES.includes(s.subscription_status));
      const label = [anchor.address, anchor.city, anchor.state].filter(Boolean).join(", ");
      addlUnit = { addressLabel: label, unitNumber: here.length + 1, firstIsLive };
    }
  }

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-8">
      <Container className="max-w-[820px]">
        <Link href={addlUnit ? "/dashboard" : "/dashboard/listings/new"} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display mt-3 text-[30px] font-bold text-navy sm:text-[36px]">
          {addlUnit ? "Add another unit" : "List your property"}
        </h1>
        {addlUnit && primaryIsComp ? (
          // Free (comped) primaries can't add $10 units — checkout would reject
          // it anyway, so explain here instead of showing a dead-end form.
          <div className="mt-7 rounded-card border border-amber-300 bg-amber-50 p-6 text-[15px] text-amber-900">
            <p className="font-semibold">
              Additional units aren&apos;t available on a free listing.
            </p>
            <p className="mt-2">
              Your listing at {addlUnit.addressLabel} is on a free plan. The $10/yr additional-unit
              rate is only available alongside a paid primary listing ($99/yr).
            </p>
            <div className="mt-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-semibold text-navy hover:border-navy/40"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : addlUnit && addlUnit.unitNumber > 6 ? (
          // Address is already at the 6-unit maximum — don't show a form that
          // can't be submitted; point them at the commercial listing type.
          <div className="mt-7 rounded-card border border-amber-300 bg-amber-50 p-6 text-[15px] text-amber-900">
            <p className="font-semibold">{addlUnit.addressLabel} already has 6 units.</p>
            <p className="mt-2">
              Six is the maximum on the per-unit plan. For a property with more than 6 units, list it
              as a commercial type (RV park, hotel or apartment complex) for $249/yr.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/dashboard/listings/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange px-4 py-2 text-[14px] font-semibold text-white hover:bg-orange-dark"
              >
                Choose a commercial type
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-semibold text-navy hover:border-navy/40"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-[15px] text-muted">
              Fill in the details below. You can save a draft and finish later.
            </p>
            <div className="mt-7">
              <ListingBuilder initial={initial} addlUnit={addlUnit} parentListingId={primaryId} />
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
