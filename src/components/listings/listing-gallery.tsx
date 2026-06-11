"use client";

import { useState } from "react";
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
      <div className="overflow-hidden rounded-card bg-bg-band">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[active]}
          alt={title}
          className="aspect-[16/10] w-full object-cover"
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
                "h-16 w-24 overflow-hidden rounded-lg border-2 transition",
                i === active ? "border-orange" : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
