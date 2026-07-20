import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { typeLabel } from "@/lib/listings/format";
import { ReviewForm } from "@/components/admin/review-form";
import { CompToggle } from "@/components/admin/comp-toggle";
import { AdminListingControls } from "@/components/admin/admin-listing-controls";
import { billingState } from "@/lib/listings/billing-state";
import { STATUS_STYLES } from "@/lib/listings/status-styles";

export const metadata: Metadata = { title: "Admin · Review listing" };

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 text-[14.5px] text-ink">{value}</dd>
    </div>
  );
}

export default async function AdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: l } = await supabase.from("listings").select("*").eq("id", id).single();
  if (!l) notFound();

  const { data: owner } = l.owner_id
    ? await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", l.owner_id)
        .single()
    : { data: null };

  const photos: string[] = Array.isArray(l.photos) ? l.photos : [];
  const cityLine = [l.city, l.state].filter((s) => s && String(s).trim()).join(", ");
  const cityZip = [cityLine, l.zip].filter((s) => s && String(s).trim()).join(" ");
  const fullAddress = [l.address, l.unit, cityZip]
    .filter((s) => s && String(s).trim())
    .join(" · ");

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-8">
      <Container className="max-w-[920px]">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back to queue
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[28px] font-bold text-navy sm:text-[34px]">
            {l.title || "Untitled listing"}
          </h1>
          <span
            className={`rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize ${
              STATUS_STYLES[l.status] ?? "bg-bg-band text-[#3a4a5a]"
            }`}
          >
            {l.status}
          </span>
          {/* Payment state — so the admin doesn't read "approved" as "live". */}
          {l.status === "approved" && (() => {
            const bs = billingState({
              status: l.status,
              subscriptionStatus: l.subscription_status,
              isComp: l.is_comp,
              hasSubscription: !!l.stripe_subscription_id,
            });
            const map: Record<string, { t: string; c: string }> = {
              live: { t: l.is_comp ? "Live · free" : "Live · paid", c: "bg-green-100 text-green-800" },
              past_due: { t: "Live · payment failing", c: "bg-amber-100 text-amber-800" },
              awaiting_payment: { t: "Awaiting payment", c: "bg-amber-100 text-amber-800" },
              lapsed: { t: "Subscription lapsed", c: "bg-red-100 text-red-700" },
              none: { t: "", c: "" },
            };
            const b = map[bs];
            return b.t ? <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${b.c}`}>{b.t}</span> : null;
          })()}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[14px] text-muted">
          <MapPin className="h-4 w-4 text-orange" /> {l.public_area}
          {l.anonymize_address ? " · address hidden publicly" : ""}
        </p>
        {/* Expiry for approved-but-unpaid listings (reverts to draft at 4 weeks). */}
        {l.status === "approved" && !l.is_comp && !l.stripe_subscription_id && l.reviewed_at && (() => {
          const daysLeft = Math.ceil(28 - (Date.now() - new Date(l.reviewed_at).getTime()) / 86_400_000);
          return (
            <p className="mt-1 text-[13px] font-medium text-amber-700">
              Awaiting payment — approval expires in {Math.max(daysLeft, 0)} day{daysLeft === 1 ? "" : "s"} if unpaid.
            </p>
          );
        })()}

        <div className="mt-6 grid gap-5">
          {/* Review controls up top so the admin can act without scrolling. */}
          {l.status === "approved" && l.is_comp && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] font-medium text-amber-800">
              This listing is already live and free. Use the comp toggle below to remove the free status — the approve buttons are for the review queue.
            </p>
          )}
          <ReviewForm id={l.id} />
          <CompToggle id={l.id} isComp={l.is_comp} subscriptionStatus={l.subscription_status} />
          <AdminListingControls id={l.id} />

          {/* Details */}
          <div className="rounded-card border border-line bg-white p-6 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Owner"
                value={owner ? `${owner.full_name || "—"} · ${owner.email}${owner.phone ? ` · ${owner.phone}` : ""}` : "—"}
              />
              <Field
                label="Type"
                value={`${l.listing_kind === "room" ? "Private room · " : ""}${typeLabel(l.property_type)}${l.property_type_other ? ` (${l.property_type_other})` : ""}`}
              />
              <Field label="Full address (private)" value={fullAddress} />
              <Field label="Rates" value={l.rates} />
              <Field
                label="Beds / baths"
                value={l.listing_kind === "room" ? "Private room" : `${l.bedrooms} bd · ${l.bathrooms} ba`}
              />
              <Field label="Payment methods" value={l.payment_methods} />
              <Field label="Contact phone" value={l.contact_phone} />
              <Field label="Contact email" value={l.contact_email} />
              <Field label="Coupon used" value={l.coupon_code} />
            </dl>

            {l.description && (
              <div className="mt-5">
                <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Description</dt>
                <p className="mt-1 whitespace-pre-wrap text-[14.5px] text-ink">{l.description}</p>
              </div>
            )}
            {l.nearby_projects && (
              <div className="mt-4">
                <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Nearby work</dt>
                <p className="mt-1 text-[14.5px] text-ink">{l.nearby_projects}</p>
              </div>
            )}
            {Array.isArray(l.amenities) && l.amenities.length > 0 && (
              <div className="mt-4">
                <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Amenities</dt>
                <p className="mt-1 text-[14.5px] text-ink">{l.amenities.join(" · ")}</p>
              </div>
            )}

            {l.commercial_details && Object.keys(l.commercial_details).length > 0 && (
              <div className="mt-5 border-t border-line pt-4">
                <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Commercial details</dt>
                <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                  {Object.entries(l.commercial_details as Record<string, unknown>)
                    .filter(
                      ([k, v]) =>
                        !k.endsWith("_enabled") &&
                        v != null &&
                        (Array.isArray(v) ? v.length > 0 : String(v).trim().length > 0),
                    )
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[12px] font-semibold capitalize text-muted">{k.replace(/_/g, " ")}</dt>
                        <dd className="mt-0.5 text-[14px] text-ink">
                          {Array.isArray(v) ? v.join(" · ") : String(v)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="rounded-card border border-line bg-white p-6 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
            <h2 className="font-display text-[18px] font-bold text-navy">
              Photos ({photos.length})
            </h2>
            {photos.length === 0 ? (
              <p className="mt-2 text-[14px] text-muted">No photos uploaded.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((src, i) => (
                  <div key={i} className="relative aspect-[3/2] overflow-hidden rounded-lg bg-bg-band">
                    <Image src={src} alt={`Photo ${i + 1}`} fill sizes="33vw" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
