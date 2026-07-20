import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ListingBuilder, type ListingFormValues } from "@/components/listings/listing-builder";
import { CommercialBuilder, type CommercialInitial } from "@/components/listings/commercial-builder";
import { isCommercial } from "@/lib/listings/types";
import type { CommercialType } from "@/lib/listings/commercial-forms";
import { scopeOwner } from "@/lib/listings/scope-owner";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit Listing" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  // Admins may edit any listing; owners only their own.
  const ownerId = await scopeOwner(supabase, user.id);
  let listingQ = supabase.from("listings").select("*").eq("id", id);
  if (ownerId) listingQ = listingQ.eq("owner_id", ownerId);
  const { data: r } = await listingQ.single();
  if (!r) redirect("/dashboard");

  // RV parks / hotels / apartment complexes use the separate commercial builder,
  // not the single-tier residential form. Route them to the right editor.
  const commercial = isCommercial(r.property_type);
  const cd = (r.commercial_details ?? {}) as Record<string, unknown>;
  const commercialInitial: CommercialInitial = {
    name: r.title ?? "",
    streetAddress: r.address ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    zip: r.zip ?? "",
    description: r.description ?? "",
    nearbyProjects: r.nearby_projects ?? "",
    anonymizeAddress: !!r.anonymize_address,
    details: cd,
    petPolicy: (r.pet_policy as "allowed" | "no" | "case_by_case" | null) ?? "",
    petNote: (cd.pet_note as string) ?? "",
    rates: r.rates ?? "",
    contactPhone: r.contact_phone ?? "",
    showPhone: r.show_phone,
    contactEmail: r.contact_email ?? "",
    showEmail: r.show_email,
    allowContactForm: r.allow_contact_form,
    photos: (r.photos as string[] | null) ?? [],
  };

  const rd = (r.room_details ?? {}) as {
    household?: string;
    householdNote?: string;
    bathroom?: string;
    shared?: string[];
    sharedNote?: string;
  };

  const initial: Partial<ListingFormValues> = {
    listingKind: (r.listing_kind as "entire" | "room") ?? "",
    propertyType: r.property_type ?? "",
    propertyTypeOther: r.property_type_other ?? "",
    roomHousehold: rd.household ?? "",
    roomHouseholdNote: rd.householdNote ?? "",
    roomBathroom: rd.bathroom ?? "",
    roomShared: (rd.shared as string[] | undefined) ?? [],
    roomSharedNote: rd.sharedNote ?? "",
    title: r.title ?? "",
    description: r.description ?? "",
    nearbyProjects: r.nearby_projects ?? "",
    streetAddress: r.address ?? "",
    unit: r.unit ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    zip: r.zip ?? "",
    anonymizeAddress: r.anonymize_address ? "yes" : "no",
    rates: r.rates ?? "",
    rateAmount: r.rate_amount != null ? String(r.rate_amount) : "",
    rateBilled: (r.rate_billed as "weekly" | "four_weeks" | "monthly" | "call") ?? "",
    priceMonth: r.price_month ? String(r.price_month) : "",
    bedrooms: r.bedrooms ? String(r.bedrooms) : "",
    bedroomType: r.bedroom_type ?? "",
    bathrooms: r.bathrooms ? String(r.bathrooms) : "",
    utilitiesIncluded: r.utilities_included ? "yes" : "no",
    petPolicy: r.pet_policy ?? "",
    internet: r.internet ?? "",
    laundry: r.laundry ?? "",
    amenities: (r.amenities as string[] | null) ?? [],
    houseRules: r.house_rules ?? "",
    paymentMethods: r.payment_methods ?? "",
    contactPhone: r.contact_phone ?? "",
    showPhone: r.show_phone === false ? "no" : "yes",
    contactEmail: r.contact_email ?? "",
    showEmail: r.show_email ? "yes" : "no",
    allowContactForm: r.allow_contact_form === false ? "no" : "yes",
    photos: (r.photos as string[] | null) ?? [],
  };

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-8">
      <Container className="max-w-[820px]">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-display mt-3 text-[30px] font-bold text-navy sm:text-[36px]">
          Edit listing
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Update the details below and save your changes.
        </p>
        <div className="mt-7">
          {commercial ? (
            <CommercialBuilder
              type={r.property_type as CommercialType}
              initial={commercialInitial}
              listingId={id}
              currentStatus={r.status}
            />
          ) : (
            <ListingBuilder initial={initial} listingId={id} currentStatus={r.status} />
          )}
        </div>
      </Container>
    </section>
  );
}
