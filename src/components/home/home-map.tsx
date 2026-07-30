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
export function staticMapUrl(
  points: { lat: number; lng: number }[],
  width: number,
  height: number,
): string {
  // Static-image API takes markers in the URL — cap well under the URL length
  // limit (60 pins ≈ 2KB) rather than at a number listings will outgrow.
  const markers = points
    .slice(0, 60)
    .map((p) => `pin-s+cf4715(${p.lng.toFixed(4)},${p.lat.toFixed(4)})`)
    .join(",");
  // `auto` fits the viewport to the markers *within the requested image shape*.
  // A landscape image displayed in a tall mobile box gets cropped left/right by
  // object-cover, slicing off the outermost pins — so mobile requests a
  // portrait image whose shape matches its container and auto-fits every pin.
  return (
    `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
    `${markers}/auto/${width}x${height}@2x?padding=60&access_token=${TOKEN}`
  );
}

export async function HomeMap() {
  const listings = await getListings({});
  // Two shapes so auto-fit lands every pin inside the frame at each breakpoint:
  // a portrait image for the tall mobile box, a landscape one for desktop.
  const mobileUrl = staticMapUrl(listings, 640, 760);
  const desktopUrl = staticMapUrl(listings, 1200, 560);

  return (
    <section className="py-16 sm:py-20">
      <SectionHead eyebrow="Coast to coast" title="See every place on the map" />

      <Container className="mt-9">
        <Link
          href="/search"
          className="group relative block h-[420px] overflow-hidden rounded-card border border-line shadow-[0_8px_24px_rgba(16,32,48,0.08)] sm:h-[520px]"
        >
          {/* Portrait crop on mobile, landscape on desktop. Each source is
              auto-fit to its own shape, so every pin stays in frame at both
              sizes instead of being cropped off the sides on a phone. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileUrl}
            alt="Map of available furnished housing across the Gulf Coast, Permian Basin and beyond"
            className="h-full w-full object-cover sm:hidden"
            loading="lazy"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={desktopUrl}
            alt="Map of available furnished housing across the Gulf Coast, Permian Basin and beyond"
            className="hidden h-full w-full object-cover sm:block"
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
