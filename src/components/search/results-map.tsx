"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Maximize2, X } from "lucide-react";
import type { Listing } from "@/lib/listings/types";
import { PROPERTY_TYPE_LABELS, isCommercial } from "@/lib/listings/types";
import { previewRate, kindLabel } from "@/lib/listings/format";

export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Plain teardrop pin, no price on the marker itself (the rate shows in the
// preview popup). Active pin is orange, the rest navy.
// Paint a pin for its active/hover state: orange and lifted when active, navy
// otherwise. Kept separate from creation so hover can restyle in place.
function styleMarker(el: HTMLDivElement, active: boolean): void {
  el.style.background = active ? "#cf4715" : "#13314f";
  el.style.zIndex = active ? "5" : "0";
  el.style.width = active ? "22px" : "18px";
  el.style.height = active ? "22px" : "18px";
}

function markerEl(active: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff;cursor:pointer;transition:width .12s,height .12s";
  styleMarker(el, active);
  return el;
}

/** Escape owner-controlled strings before injecting into the popup's setHTML. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function popupHtml(l: Listing): string {
  // Only allow http(s) image URLs; never interpolate an arbitrary value into src.
  const safeImg = /^https?:\/\//.test(l.photos[0] ?? "") ? l.photos[0] : "";
  const img = safeImg
    ? `<img src="${esc(safeImg)}" alt="" style="width:100%;height:108px;object-fit:cover;border-radius:8px;display:block;margin-bottom:8px"/>`
    : "";
  // "Entire Place" / "Private Room" (or commercial type) as a small badge, so the
  // pin popup reads the same way as the split-screen listing cards.
  const kind = esc(kindLabel(l));
  const typeLabel = PROPERTY_TYPE_LABELS[l.propertyType] ?? l.propertyType;
  const sub = isCommercial(l.propertyType) ? esc(l.publicArea) : `${esc(typeLabel)} · ${esc(l.publicArea)}`;
  return `<div style="width:210px;font-family:Inter,sans-serif">${img}<span style="display:inline-block;background:#13314f;color:#fff;font-size:11px;font-weight:700;border-radius:9999px;padding:2px 8px;margin-bottom:5px">${kind}</span><br><b style="font-size:13.5px;color:#13314f">${esc(l.title)}</b><br><span style="color:#5b6b7d;font-size:12px">${sub}</span><br><span style="font-size:13px;font-weight:600;color:#cf4715">${esc(previewRate(l))}</span><br><a href="/listings/${encodeURIComponent(l.slug)}" style="color:#cf4715;font-weight:600;font-size:12.5px">View listing →</a></div>`;
}

/**
 * Interactive Mapbox map shared by the home, search and listing pages. Price
 * markers re-render when the filtered set changes; clicking a marker opens a
 * popup linking to the listing. Emits visible bounds on every move so the
 * search list can narrow to the viewport ("search as I move the map"). A
 * ResizeObserver calls resize() so it renders correctly even when it starts in
 * a hidden container (mobile list/map toggle).
 */
export function ResultsMap({
  listings,
  activeSlug,
  onHover,
  center,
  onBoundsChange,
  cooperative = true,
}: {
  listings: Listing[];
  activeSlug?: string;
  /** Fired with a listing's slug when its pin is hovered, null on leave. */
  onHover?: (slug: string | null) => void;
  /** When set ([lng, lat]), the map flies here instead of fitting all pins. */
  center?: [number, number] | null;
  onBoundsChange?: (b: MapBounds) => void;
  /** Cooperative gestures (one finger scrolls page, two fingers pan). Turn OFF
   *  where the map is the whole view (mobile map tab) so one finger pans it. */
  cooperative?: boolean;
}) {
  const [fullscreen, setFullscreen] = useState(false);
  const inlineSlotRef = useRef<HTMLDivElement | null>(null);
  const fsSlotRef = useRef<HTMLDivElement | null>(null);
  // The map lives in a node we create imperatively so it can be relocated
  // between the inline slot and the full-screen (portaled) slot without React
  // unmounting it — which would destroy the Mapbox instance and lose state.
  const hostRef = useRef<HTMLDivElement | null>(null);
  if (!hostRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    el.style.width = "100%";
    el.style.height = "100%";
    hostRef.current = el;
  }
  const mapRef = useRef<MapboxMap | null>(null);
  const mgRef = useRef<(typeof import("mapbox-gl"))["default"] | null>(null);
  const markersRef = useRef<Marker[]>([]);
  // slug -> pin element, so hover highlighting can restyle a single pin without
  // tearing down and refitting every marker (which would move the map).
  const markerElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadedRef = useRef(false);
  const listingsRef = useRef(listings);
  const activeRef = useRef(activeSlug);
  const centerRef = useRef(center);
  const onBoundsRef = useRef(onBoundsChange);
  const onHoverRef = useRef(onHover);
  listingsRef.current = listings;
  activeRef.current = activeSlug;
  centerRef.current = center;
  onBoundsRef.current = onBoundsChange;
  onHoverRef.current = onHover;

  // init once
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let resizeRaf = 0;
    // Resize the WebGL canvas to match its container WITHOUT touching the camera.
    // A container resize must never re-center or re-zoom the map (that fights an
    // in-flight user zoom and desyncs Mapbox's transform from the canvas, leaving
    // a grey half-rendered strip). Refitting to markers is owned separately by
    // renderMarkers / first-visible / center-change. Debounced through rAF so a
    // burst of resize events collapses into one post-layout resize + repaint.
    const resizeCanvas = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        const m = mapRef.current;
        if (!m) return;
        m.resize();
        m.triggerRepaint();
      });
    };
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !hostRef.current || mapRef.current) return;
      mgRef.current = mapboxgl;
      mapboxgl.accessToken = TOKEN ?? "";

      const map = new mapboxgl.Map({
        container: hostRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        projection: { name: "mercator" },
        center: [-96, 37.8],
        zoom: 3.2,
        // When cooperative: one-finger drag scrolls the page past the map, two
        // fingers pan it (keeps an embedded map from trapping scroll). When the
        // map is the whole view, this is off so one finger pans directly.
        cooperativeGestures: cooperative,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      map.on("moveend", () => {
        const cb = onBoundsRef.current;
        const m = mapRef.current;
        if (!cb || !m) return;
        const b = m.getBounds();
        if (!b) return;
        cb({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() });
      });

      map.on("load", () => {
        loadedRef.current = true;
        // iOS Safari can size the WebGL canvas wrong when the map inits while
        // off-screen (the home map is below the fold), leaving it blank or
        // pin-less until something forces a redraw. Resize on load, and again
        // when it first scrolls into view, to make it reliable.
        map.resize();
        renderMarkers();
        // Apply a search center that was set before the map mounted (mobile,
        // where the map only mounts when the Map tab is opened). Without this
        // the map stays at the default US view after a location search.
        flyToCenter();
        // The canvas is occasionally sized before the container's final width is
        // known (a layout race), leaving a grey strip where the map doesn't
        // reach. Re-resize a few times after paint to force it to fill.
        [60, 250, 600, 1200].forEach((ms) => setTimeout(resizeCanvas, ms));
      });

      // Surface tile/WebGL errors instead of failing silently.
      map.on("error", (e) => {
        console.warn("[map] error:", e?.error?.message ?? e);
      });

      // Container resized (mobile list/map toggle, window resize, sticky column
      // reflow): resize the canvas only — never refit, or it snaps a mid-zoom
      // map back to a fixed camera and grey-renders.
      ro = new ResizeObserver(resizeCanvas);
      ro.observe(hostRef.current);

      // Force a resize + refit the first time the map becomes visible.
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((en) => en.isIntersecting)) {
            mapRef.current?.resize();
            fitToMarkers();
          }
        },
        { threshold: 0.05 },
      );
      io.observe(hostRef.current);
    })();

    return () => {
      cancelled = true;
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      ro?.disconnect();
      io?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when the listing set changes (this refits the map).
  useEffect(() => {
    if (loadedRef.current) renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings]);

  // Highlight changes (hover) only restyle the affected pins in place — never
  // rebuild markers, which would close popups and refit/move the map.
  useEffect(() => {
    if (!loadedRef.current) return;
    markerElsRef.current.forEach((el, slug) => styleMarker(el, slug === activeSlug));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug]);

  // Fit to the searched location plus the nearest pins, so the user always sees
  // where the closest places are, even if the town itself has none. (listings is
  // already sorted nearest-first by the search view.) Reads centerRef so the map
  // load handler can call it for a center that was set before the map mounted —
  // which is the mobile case (the map only mounts when the Map tab is opened).
  function flyToCenter() {
    const map = mapRef.current;
    const mapboxgl = mgRef.current;
    const c = centerRef.current;
    if (!map || !mapboxgl || !c) return;
    const b = new mapboxgl.LngLatBounds();
    b.extend(c);
    listingsRef.current.slice(0, 6).forEach((l) => b.extend([l.lng, l.lat]));
    map.fitBounds(b, { padding: 70, maxZoom: 11, duration: 700 });
  }

  // When the center changes after the map is up (desktop: the map is always
  // mounted), fly there. If the map isn't loaded yet, its load handler applies
  // the center instead — so we don't need a (possibly null) map.once here.
  useEffect(() => {
    if (center && loadedRef.current) flyToCenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  function fitToMarkers() {
    const mapboxgl = mgRef.current;
    const map = mapRef.current;
    if (!mapboxgl || !map) return;
    // When a search center is set, stay there instead of fitting all pins.
    if (centerRef.current) return;
    const ls = listingsRef.current;
    if (ls.length === 0) return;
    if (ls.length === 1) {
      map.setCenter([ls[0].lng, ls[0].lat]);
      map.setZoom(9);
      return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    ls.forEach((l) => bounds.extend([l.lng, l.lat]));
    map.fitBounds(bounds, { padding: 56, maxZoom: 11, duration: 0 });
  }

  function renderMarkers() {
    const mapboxgl = mgRef.current;
    const map = mapRef.current;
    if (!mapboxgl || !map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    markerElsRef.current.clear();

    listingsRef.current.forEach((l) => {
      const el = markerEl(l.slug === activeRef.current);
      // Hovering a pin highlights its card in the list (and vice-versa).
      el.addEventListener("mouseenter", () => onHoverRef.current?.(l.slug));
      el.addEventListener("mouseleave", () => onHoverRef.current?.(null));
      const popup = new mapboxgl.Popup({
        offset: 16,
        closeButton: true,
        maxWidth: "240px",
      }).setHTML(popupHtml(l));
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([l.lng, l.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
      markerElsRef.current.set(l.slug, el);
    });

    fitToMarkers();
  }

  // Move the persistent map node into whichever slot is active (inline, or the
  // portaled full-screen overlay), then resize. useLayoutEffect so the move
  // happens before paint (no flash).
  useLayoutEffect(() => {
    const host = hostRef.current;
    const slot = fullscreen ? fsSlotRef.current : inlineSlotRef.current;
    if (host && slot && host.parentElement !== slot) {
      slot.appendChild(host);
      mapRef.current?.resize();
    }
  });

  // On full screen: lock the body so the page behind can't scroll (that stray
  // scrollbar movement confused users), let plain-wheel zoom the map, and allow
  // Escape to exit. Everything restores on the way out.
  useEffect(() => {
    const map = mapRef.current;
    map?.resize();
    if (!fullscreen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    try {
      (map as unknown as { cooperativeGestures?: { disable?: () => void } })?.cooperativeGestures?.disable?.();
    } catch {}

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (cooperative) {
        try {
          (map as unknown as { cooperativeGestures?: { enable?: () => void } })?.cooperativeGestures?.enable?.();
        } catch {}
      }
    };
  }, [fullscreen, cooperative]);

  return (
    <>
      {/* Inline slot: holds the map when not full screen. */}
      <div ref={inlineSlotRef} className="relative h-full w-full">
        {!fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Full screen map"
            title="Full screen"
            className="absolute right-2.5 top-[84px] z-30 grid h-9 w-9 place-items-center rounded-md border border-line bg-white shadow-[0_2px_8px_rgba(16,32,48,0.18)] hover:bg-bg-soft"
          >
            <Maximize2 className="h-[18px] w-[18px] text-navy" />
          </button>
        )}
      </div>

      {/* Full-screen slot: portaled to <body> so it escapes the search page's
          sticky map column (a stacking context that would otherwise trap this
          overlay below the site header and hide the exit button). */}
      {fullscreen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-white">
            <div ref={fsSlotRef} className="h-full w-full" />
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Exit full screen"
              className="absolute left-1/2 top-3 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-[14px] font-semibold text-navy shadow-[0_2px_10px_rgba(16,32,48,0.25)] hover:bg-bg-soft"
            >
              <X className="h-[18px] w-[18px]" /> Exit full screen
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
