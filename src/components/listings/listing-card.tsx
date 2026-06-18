import Link from "next/link";
import Image from "next/image";
import { MapPin, BedDouble, PawPrint } from "lucide-react";
import type { Listing } from "@/lib/listings/types";
import { formatPrice, specsLine, typeLabel } from "@/lib/listings/format";

/** Listing card for the search results list. */
export function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.photos[0];
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-white transition-shadow hover:shadow-[0_8px_24px_rgba(16,32,48,0.1)]"
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-bg-band">
        {photo ? (
          <Image
            src={photo}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : null}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-navy shadow-sm">
          {typeLabel(listing.propertyType)}
        </span>
        <span className="absolute bottom-3 left-3 rounded-lg bg-navy/92 px-2.5 py-1 text-[14px] font-bold text-white">
          {formatPrice(listing.priceMonth)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15.5px] font-semibold leading-snug text-ink group-hover:text-orange">
          {listing.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-[13.5px] text-muted">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-orange" />
          {listing.publicArea}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#3a4a5a]">
          <span className="flex items-center gap-1">
            <BedDouble className="h-4 w-4 text-muted" /> {specsLine(listing)}
          </span>
          {listing.petPolicy === "allowed" && (
            <span className="flex items-center gap-1">
              <PawPrint className="h-4 w-4 text-muted" /> Pets OK
            </span>
          )}
          {listing.utilitiesIncluded && (
            <span className="rounded bg-bg-soft px-1.5 py-0.5 text-[12px] font-medium text-navy">
              Bills paid
            </span>
          )}
        </div>
        <p className="mt-2.5 line-clamp-1 text-[12.5px] text-muted">
          {listing.nearbyProjects}
        </p>
      </div>
    </Link>
  );
}
