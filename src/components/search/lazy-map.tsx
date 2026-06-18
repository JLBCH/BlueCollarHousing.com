"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { ResultsMap } from "@/components/search/results-map";

/**
 * Mounts the heavy WebGL map only once it scrolls near the viewport, so a map
 * that sits below the fold (e.g. the "Where it is" section on a listing page)
 * doesn't tax low-end devices like the iPhone 7 on initial page load.
 */
export function LazyMap(props: ComponentProps<typeof ResultsMap>) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      // Start loading a little before it's actually on screen.
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      {show ? <ResultsMap {...props} /> : <div className="h-full w-full bg-bg-soft" />}
    </div>
  );
}
