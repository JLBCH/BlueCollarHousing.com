"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

/** Photo gallery: large active image + thumbnail strip. */
export function ListingGallery({
  photos,
  title,
}: {
  photos: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  if (photos.length === 0) {
    return (
      <div className="grid aspect-[16/9] place-items-center rounded-card bg-bg-band text-muted">
        No photos yet
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-bg-band">
        <Image
          src={photos[active]}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
          priority
        />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 overflow-hidden rounded-lg border-2 transition",
                i === active ? "border-orange" : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              <Image src={p} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
