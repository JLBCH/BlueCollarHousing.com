import Link from "next/link";
import { getListings } from "@/lib/listings";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/ui/section-head";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Static Mapbox image (no WebGL) with a pin per listing. The home page used to
 * mount a full interactive map here, which locked up and made scrolling fight
 * back on old phones (e.g. iPhone 7). A single static image is fast and
 * reliable on every device; the interactive map lives on /search.
 */
function staticMapUrl(points: { lat: number; lng: number }[]): string {
  // Static-image API takes markers in the URL — cap well under the URL length
  // limit (60 pins ≈ 2KB) rather than at a number listings will outgrow.
  const markers = points
    .slice(0, 60)
    .map((p) => `pin-s+cf4715(${p.lng.toFixed(4)},${p.lat.toFixed(4)})`)
    .join(",");
  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${markers}/auto/1200x560@2x?padding=60&access_token=${TOKEN}`
  );
}

export async function HomeMap() {
  const listings = await getListings({});
  const url = staticMapUrl(listings);

  return (
    <section className="py-16 sm:py-20">
      <SectionHead eyebrow="Coast to coast" title="See every place on the map" />

      <Container className="mt-9">
        <Link
          href="/search"
          className="group relative block h-[420px] overflow-hidden rounded-card border border-line shadow-[0_8px_24px_rgba(16,32,48,0.08)] sm:h-[520px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Map of available furnished housing across the Gulf Coast, Permian Basin and beyond"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-navy px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition group-hover:bg-navy-deep">
            Open the interactive map
          </span>
        </Link>

        <div className="mt-6 text-center">
          <Button href="/search" variant="navy" size="lg">
            Search all listings
          </Button>
        </div>
      </Container>
    </section>
  );
}
