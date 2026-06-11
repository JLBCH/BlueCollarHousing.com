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
import { formatPrice, typeLabel, petLabel } from "@/lib/listings/format";
import { Container } from "@/components/ui/container";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { ResultsMap } from "@/components/search/results-map";
import { RevealEmail } from "@/components/listings/reveal-email";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const listing = await getListingBySlug((await params).slug);
  if (!listing) return { title: "Listing not found" };
  return {
    title: `${listing.title} · ${listing.publicArea}`,
    description: listing.description.slice(0, 155),
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

  const phone = listing.showPhone ? listing.contactPhone : null;
  const email = listing.showEmail ? listing.contactEmail : null;
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : null;
  // Base64 so the address isn't in the page HTML (revealed on click).
  const encodedEmail = email ? Buffer.from(email).toString("base64") : null;

  return (
    <Container className="py-7">
      <Link
        href="/search"
        className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-orange"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="rounded-full bg-bg-soft px-2.5 py-1 text-[12px] font-semibold text-navy">
            {typeLabel(listing.propertyType)}
          </span>
          <h1 className="font-display mt-2 text-[34px] font-bold text-navy sm:text-[40px]">
            {listing.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted">
            <MapPin className="h-4 w-4 text-orange" /> {listing.publicArea}
          </p>
        </div>
        <div className="text-right">
          <div className="font-display text-[30px] font-bold text-navy">
            {formatPrice(listing.priceMonth)}
          </div>
          <div className="text-[13px] text-muted">{listing.leaseLength}</div>
        </div>
      </div>

      <div className="mt-5">
        <ListingGallery photos={listing.photos} title={listing.title} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* main */}
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line pb-6 sm:grid-cols-3">
            {listing.propertyType !== "rv" && (
              <>
                <Spec icon={BedDouble}>
                  {listing.bedrooms} {listing.bedrooms === 1 ? "bedroom" : "bedrooms"}
                </Spec>
                <Spec icon={Bath}>
                  {listing.bathrooms} {listing.bathrooms === 1 ? "bath" : "baths"}
                </Spec>
              </>
            )}
            <Spec icon={CalendarRange}>{listing.leaseLength}</Spec>
            <Spec icon={PawPrint}>{petLabel(listing.petPolicy)}</Spec>
            {listing.utilitiesIncluded && <Spec icon={Zap}>Bills paid</Spec>}
          </div>

          <section className="border-b border-line py-6">
            <h2 className="font-display text-[22px] font-bold text-navy">
              About this place
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-[#2a3744]">
              {listing.description}
            </p>
          </section>

          {listing.nearbyProjects && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">
                Nearby work
              </h2>
              <div className="mt-3 rounded-card border border-line bg-bg-soft p-4 text-[15px] text-[#2a3744]">
                {listing.nearbyProjects}
              </div>
            </section>
          )}

          {listing.amenities.length > 0 && (
            <section className="border-b border-line py-6">
              <h2 className="font-display text-[22px] font-bold text-navy">
                What this place offers
              </h2>
              <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {listing.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5 text-[14.5px] text-ink">
                    <Check className="h-[18px] w-[18px] text-orange" strokeWidth={2.4} />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="py-6">
            <h2 className="font-display text-[22px] font-bold text-navy">
              Where it is
            </h2>
            <p className="mt-1 text-[14px] text-muted">
              Approximate location · {listing.publicArea}
            </p>
            <div className="mt-3 h-[320px] overflow-hidden rounded-card border border-line">
              {/* strip contact fields so they aren't serialized to the client */}
              <ResultsMap
                listings={[{ ...listing, contactPhone: null, contactEmail: null }]}
              />
            </div>
          </section>
        </div>

        {/* contact card */}
        <aside className="lg:sticky lg:top-[96px] lg:self-start">
          <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.08)]">
            <div className="font-display text-[26px] font-bold text-navy">
              {formatPrice(listing.priceMonth)}
            </div>
            <p className="mt-0.5 text-[13.5px] text-muted">
              Contact the owner directly. No booking fees, no middleman.
            </p>

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
                </>
              ) : null}
              {encodedEmail && <RevealEmail encoded={encodedEmail} />}
              {!telHref && !encodedEmail && (
                <p className="rounded-[10px] bg-bg-soft px-4 py-3 text-center text-[13.5px] text-muted">
                  This owner takes messages through a contact form, coming
                  shortly.
                </p>
              )}
            </div>

            <p className="mt-4 text-[12.5px] leading-relaxed text-muted">
              Calling is the fastest way to reach the owner, right now, no forms.
              Prefer not to share your number? A private contact form is coming.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
