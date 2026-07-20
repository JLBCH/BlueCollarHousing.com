"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Photo gallery: large active image (with prev/next arrows) + a scrollable
 *  thumbnail strip. The strip scrolls horizontally instead of squeezing every
 *  thumbnail to fit, so listings with many photos stay legible. */
export function ListingGallery({
  photos,
  title,
}: {
  photos: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const stripRef = useRef<HTMLDivElement | null>(null);

  // Keep the selected thumbnail visible when paging with the big-image arrows.
  useEffect(() => {
    const el = stripRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [active]);

  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-card bg-bg-band text-muted">
        No photos yet
      </div>
    );
  }

  const many = photos.length > 1;
  const page = (dir: number) =>
    setActive((i) => (i + dir + photos.length) % photos.length);
  const scrollStrip = (dir: number) =>
    stripRef.current?.scrollBy({ left: dir * 260, behavior: "smooth" });

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-navy-deep">
        {/* Blurred zoom of the same photo fills the frame so the sharp, WHOLE
            image below (object-contain) never sits on empty bars — portraits and
            panoramas show completely instead of being cropped by object-cover. */}
        <Image
          key={`bg-${active}`}
          src={photos[active]}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="scale-110 object-cover blur-2xl"
        />
        <div className="absolute inset-0 bg-black/25" aria-hidden />
        <Image
          key={active}
          src={photos[active]}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-contain"
          priority
        />
        {many && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => page(-1)}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-navy shadow-[0_2px_8px_rgba(16,32,48,0.25)] backdrop-blur transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => page(1)}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-navy shadow-[0_2px_8px_rgba(16,32,48,0.25)] backdrop-blur transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-semibold text-white">
              {active + 1} / {photos.length}
            </div>
          </>
        )}
      </div>

      {many && (
        <div className="relative mt-3">
          <div
            ref={stripRef}
            className="flex gap-2.5 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((p, i) => (
              <button
                key={p}
                type="button"
                aria-label={`Show photo ${i + 1} of ${photos.length}`}
                aria-pressed={i === active}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border-2 transition",
                  i === active
                    ? "border-orange"
                    : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image src={p} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>

          {/* Scroll the strip when there are more thumbnails than fit on screen. */}
          {photos.length > 5 && (
            <>
              <button
                type="button"
                aria-label="Scroll thumbnails left"
                onClick={() => scrollStrip(-1)}
                className="absolute left-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-navy shadow-[0_2px_8px_rgba(16,32,48,0.2)] transition hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Scroll thumbnails right"
                onClick={() => scrollStrip(1)}
                className="absolute right-0 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-navy shadow-[0_2px_8px_rgba(16,32,48,0.2)] transition hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
