import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Check,
  MapPin,
  BedDouble,
  Bath,
  CalendarRange,
  PawPrint,
  Zap,
} from "lucide-react";
import { getListingBySlug } from "@/lib/listings";
import { previewRate, typeLabel, petLabel, kindLabel } from "@/lib/listings/format";
import { listingExtraOffers } from "@/lib/listings/offers";
import { isCommercial } from "@/lib/listings/types";
import type { CommercialType } from "@/lib/listings/commercial-forms";
import { Container } from "@/components/ui/container";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { CommercialDetails } from "@/components/listings/commercial-details";
import { FreeText } from "@/components/listings/free-text";
import { LazyMap } from "@/components/search/lazy-map";
import { RevealEmail } from "@/components/listings/reveal-email";
import { ListingContactForm } from "@/components/listings/listing-contact-form";
import { ReportListing } from "@/components/listings/report-listing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const listing = await getListingBySlug((await params).slug);
  if (!listing) return { title: "Listing not found" };
  const title = `${listing.title} · ${listing.publicArea}`;
  const description = listing.description.slice(0, 155);
  const photo = listing.photos[0];
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/listings/${listing.slug}`,
      ...(photo ? { images: [photo] } : {}),
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title,
      description,
      ...(photo ? { images: [photo] } : {}),
    },
  };
}

/**
 * schema.org JSON-LD for a listing. "Accommodation" over "RealEstateListing":
 * RealEstateListing is a WebPage subtype (it describes the listing *page*),
 * while Accommodation models the lodging itself — a furnished unit for rent —
 * with first-class address/geo/containedInPlace, which is what search engines
 * want for lodging results.
 */
function listingJsonLd(listing: NonNullable<Awaited<ReturnType<typeof getListingBySlug>>>) {
  return {
    "@context": "https://schema.org",
    "@type": "Accommodation",
    name: listing.title,
    description: listing.description.slice(0, 300),
    ...(listing.photos.length > 0 ? { image: listing.photos } : {}),
    address: {
      "@type": "PostalAddress",
      // Street address only when the landlord shows it publicly — the data
      // layer nulls it for anonymized listings.
      ...(listing.address ? { streetAddress: listing.address } : {}),
      addressLocality: listing.city,
      addressRegion: listing.state,
      ...(listing.zip ? { postalCode: listing.zip } : {}),
      addressCountry: "US",
    },
    // lat/lng arrive pre-jittered for anonymized listings — safe to publish.
    geo: {
      "@type": "GeoCoordinates",
      latitude: listing.lat,
      longitude: listing.lng,
    },
    containedInPlace: {
      "@type": "City",
      name: `${listing.city}, ${listing.state}`,
    },
    // "Call for rates" listings (priceMonth 0) get no offers block at all.
    ...(listing.priceMonth > 0
      ? {
          offers: {
            "@type": "Offer",
            price: listing.priceMonth,
            priceCurrency: "USD",
          },
        }
      : {}),
  };
}

function Spec({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-[14.5px] text-ink">
      <Icon className="h-[18px] w-[18px] text-orange" />
      {children}
    </div>
  );
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const listing = await getListingBySlug((await params).slug);
  if (!listing) notFound();

  const commercial = isCommercial(listing.propertyType);
  // "City, ST" + zip when present, e.g. "Bacliff, TX 77518".
  const cityStateZip = [listing.publicArea, listing.zip].filter(Boolean).join(" ");
  // The street address is only present when the landlord opted to show it.
  const showsFullAddress = !listing.anonymizeAddress && Boolean(listing.address);
  const fullAddress = showsFullAddress ? `${listing.address}, ${cityStateZip}` : null;
  const phone = listing.showPhone ? listing.contactPhone : null;
  const email = listing.showEmail ? listing.contactEmail : null;
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  // Base64 so the address isn't in the page HTML (revealed on click).
  const encodedEmail = email ? Buffer.from(email).toString("base64") : null;

  return (
    <Container className="py-7">
      {/* JSON.stringify does NOT escape "<": a listing description containing
          "</script>" would otherwise terminate this script element and execute
          landlord-controlled markup (stored XSS). < is legal JSON, so the
          payload parses identically for crawlers. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(listing)).replace(/</g, "\\u003c"),
        }}
      />
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-orange"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-navy px-2.5 py-1 text-[12px] font-semibold text-white">
              {kindLabel(listing)}
            </span>
            {/* Second badge = building type. Rooms already carry it inside the
                kind badge ("Room – House"), so only whole-place listings need it. */}
            {!commercial && listing.listingKind !== "room" && (
              <span className="rounded-full bg-bg-soft px-2.5 py-1 text-[12px] font-semibold text-navy">
                {typeLabel(listing.propertyType)}
              </span>
            )}
          </span>
          <h1 className="font-display mt-2 text-[34px] font-bold text-navy sm:text-[40px]">
            {listing.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-navy">
            <MapPin className="h-4 w-4 text-orange" /> {fullAddress ?? cityStateZip}
          </p>
        </div>
        {/* Commercial listings (RV park / hotel / apartment complex) always
            price by "call", so a big "Call for rates" heading here reads as
            filler — their real pricing lives in the Rates section. */}
        {!commercial && (
          <div className="text-right">
            <div className="font-display text-[30px] font-bold text-navy">
              {previewRate(listing)}
            </div>
            <div className="text-[13px] text-muted">{listing.leaseLength}</div>
          </div>
        )}
      </div>

      <div className="mt-5">
        <ListingGallery photos={listing.photos} title={listing.title} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* main */}
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line pb-6 sm:grid-cols-3">
            {/* Private rooms have no bedroom count of their own and their
                bathroom lives in Room details, so "0 bedrooms · 0 baths" is
                meaningless — skip the bed/bath specs for rooms. */}
            {!commercial && listing.propertyType !== "rv" && listing.listingKind !== "room" && (
              <>
                <Spec icon={BedDouble}>
                  {listing.bedrooms} {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}
                </Spec>
                <Spec icon={Bath}>
                  {listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}
                </Spec>
              </>
            )}
            {listing.leaseLength && <Spec icon={CalendarRange}>{listing.leaseLength}</Spec>}
            <Spec icon={PawPrint}>{petLabel(listing.petPolicy)}</Spec>
            {listing.utilitiesIncluded && <Spec icon={Zap}>Bills paid</Spec>}
          </div>

          {commercial && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">Details</h2>
              <div className="mt-4">
                <CommercialDetails
                  type={listing.propertyType as CommercialType}
                  details={listing.commercialDetails ?? {}}
                />
              </div>
            </section>
          )}

          {listing.rates && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">Rates</h2>
              <div className="mt-3 space-y-2 text-[15.5px] leading-relaxed text-[#2a3744]">
                <FreeText value={listing.rates} />
              </div>
            </section>
          )}

          {listing.description && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">
                About this place
              </h2>
              <div className="mt-3 space-y-2 text-[15.5px] leading-relaxed text-[#2a3744]">
                <FreeText value={listing.description} />
              </div>
            </section>
          )}

          {listing.nearbyProjects && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">
                Nearby Projects &amp; Facilities
              </h2>
              <div className="mt-3 space-y-2 rounded-card border border-line bg-bg-soft p-4 text-[15px] text-[#2a3744]">
                <FreeText value={listing.nearbyProjects} />
              </div>
            </section>
          )}

          {(() => {
            // Laundry/internet live in their own columns, not amenities[] —
            // fold them in here so the builder's choices actually show up.
            const offers = [
              ...listingExtraOffers({ laundry: listing.laundry, internet: listing.internet }),
              ...listing.amenities,
            ];
            if (offers.length === 0) return null;
            return (
              <section className="border-b border-line py-6">
                <h2 className="font-display text-[22px] font-bold text-navy">
                  What this place offers
                </h2>
                <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {offers.map((a) => (
                    <li key={a} className="flex items-center gap-2.5 text-[14.5px] text-ink">
                      <Check className="h-[18px] w-[18px] text-orange" strokeWidth={2.4} />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}

          {listing.listingKind === "room" && listing.roomDetails && (() => {
            const rd = listing.roomDetails;
            // "Other" shows just the landlord's free text; the preset choices show
            // only their label (the note field belongs to "Other" and must not
            // carry over if they later switched to Family home / All renters).
            const household =
              rd.household === "family" ? "Family home" :
              rd.household === "all_renters" ? "All renters" :
              rd.household === "other" ? (rd.householdNote?.trim() || "Other") : "";
            const shared = rd.shared ?? [];
            const sharedNote = rd.sharedNote?.trim();
            if (!household && !rd.bathroom && shared.length === 0 && !sharedNote) return null;
            return (
              <section className="border-b border-line py-6">
                <h2 className="font-display text-[22px] font-bold text-navy">Room details</h2>
                <dl className="mt-3 grid gap-4 sm:grid-cols-2">
                  {household && (
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Household</dt>
                      <dd className="mt-1 whitespace-pre-line text-[15px] text-ink">{household}</dd>
                    </div>
                  )}
                  {rd.bathroom && (
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Bathroom</dt>
                      <dd className="mt-1 text-[15px] text-ink">{rd.bathroom}</dd>
                    </div>
                  )}
                  {(shared.length > 0 || sharedNote) && (
                    <div className="sm:col-span-2">
                      <dt className="text-[12px] font-bold uppercase tracking-wide text-muted">Shared spaces</dt>
                      <dd className="mt-1 text-[15px] text-ink">
                        {shared.length > 0 && <span>{shared.join(" · ")}</span>}
                        {sharedNote && (
                          <span className="mt-1 block whitespace-pre-line">{sharedNote}</span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            );
          })()}

          {listing.houseRules && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">
                House rules
              </h2>
              <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink">
                <FreeText value={listing.houseRules} />
              </div>
            </section>
          )}

          {listing.paymentMethods && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">
                Payment methods
              </h2>
              <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink">
                <FreeText value={listing.paymentMethods} />
              </div>
            </section>
          )}

          <section className="py-6">
            <h2 className="font-display text-[22px] font-bold text-navy">
              Where it is
            </h2>
            <p className="mt-1 text-[14px] text-muted">
              {showsFullAddress ? (
                <>Exact location · {fullAddress}</>
              ) : (
                <>Approximate location (within about a block) · {cityStateZip}</>
              )}
            </p>
            <div className="mt-3 h-[320px] overflow-hidden rounded-card border border-line">
              {/* strip contact fields so they aren't serialized to the client */}
              <LazyMap
                listings={[{ ...listing, contactPhone: null, contactEmail: null }]}
              />
            </div>
          </section>

          {/* Quiet by design — flags legacy listings whose contact info is dead. */}
          <div className="pb-6 pt-2">
            <ReportListing slug={listing.slug} title={listing.title} />
          </div>
        </div>

        {/* contact card */}
        <aside className="lg:sticky lg:top-[96px] lg:self-start">
          <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.08)]">
            {/* Rate block — kept visually separate from the contact actions below
                so it doesn't read as part of the contact form. */}
            <div className="border-b border-line pb-4">
              {!commercial && (
                <div className="font-display text-[26px] font-bold text-navy">
                  {previewRate(listing)}
                </div>
              )}
              <p className="text-[13.5px] text-muted">
                Contact the owner directly. No booking fees, no middleman.
              </p>
            </div>

            {/* When there's no phone to call, label the form clearly so "Call for
                rates" above doesn't imply a phone that isn't there. */}
            {!telHref && listing.allowContactForm && (
              <div className="mt-4">
                <p className="text-[15px] font-bold text-navy">Landlord contact form</p>
                {listing.showPhone === false && (
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    This landlord has chosen to keep their phone number private.
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 grid gap-2.5">
              {telHref ? (
                <>
                  {/* Phone-first: Call now is the hero action */}
                  <a
                    href={telHref}
                    className="flex flex-col items-center justify-center gap-0.5 rounded-[12px] bg-orange px-5 py-4 text-white shadow-sm transition hover:bg-orange-dark"
                  >
                    <span className="flex items-center gap-2 text-[17px] font-bold">
                      <Phone className="h-5 w-5" /> Call now
                    </span>
                    <span className="text-[13px] font-medium text-white/90">
                      {phone}
                    </span>
                  </a>
                  <a
                    href={`sms:${telHref.slice(4)}`}
                    className="flex items-center justify-center gap-2 rounded-[10px] bg-navy px-5 py-3 text-[15px] font-semibold text-white hover:bg-navy-deep"
                  >
                    <MessageSquare className="h-[18px] w-[18px]" /> Text the owner
                  </a>
                  {/* Texts silently vanish when the listed number is a landline —
                      warn up front so workers call instead of waiting on a reply. */}
                  <p className="-mt-1 text-center text-[12px] text-muted">
                    Texts only reach mobile numbers — if this is a landline, call instead.
                  </p>
                </>
              ) : null}
              {encodedEmail && <RevealEmail encoded={encodedEmail} />}
              {/* Contact form: the only path when no phone/email is shown, and
                  an optional extra when they are. */}
              {listing.allowContactForm && (
                <ListingContactForm
                  slug={listing.slug}
                  title={listing.title}
                  startOpen={!telHref && !encodedEmail}
                />
              )}
              {!telHref && !encodedEmail && !listing.allowContactForm && (
                <p className="rounded-[10px] bg-bg-soft px-4 py-3 text-center text-[13.5px] text-muted">
                  This owner has not added contact details yet.
                </p>
              )}
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
              {telHref
                ? listing.allowContactForm || encodedEmail
                  ? "Calling is the fastest way to reach the owner, right now, no forms. Prefer not to share your number? Send a message instead."
                  : // No form and no email on this listing — don't promise a message
                    // path that doesn't exist; calling/texting is the only channel.
                    "Calling is the fastest way to reach the owner — right now, no forms to fill out."
                : "Send the owner a message and they will get back to you. Your details are never shared publicly."}
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
