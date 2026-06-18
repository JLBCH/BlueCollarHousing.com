"use client";

import { useEffect, useRef } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@/lib/listings/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/listings/types";

export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function priceShort(p: number): string {
  return p >= 1000 ? `$${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k` : `$${p}`;
}

function markerEl(label: string, active: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `background:${active ? "#cf4715" : "#13314f"};color:#fff;font:600 12px/1 Inter,sans-serif;padding:6px 9px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:2px solid #fff;white-space:nowrap;cursor:pointer`;
  el.textContent = label;
  return el;
}

function popupHtml(l: Listing): string {
  const img = l.photos[0]
    ? `<img src="${l.photos[0]}" alt="" style="width:100%;height:108px;object-fit:cover;border-radius:8px;display:block;margin-bottom:8px"/>`
    : "";
  return `<div style="width:210px;font-family:Inter,sans-serif">${img}<b style="font-size:13.5px;color:#13314f">${l.title}</b><br><span style="color:#5b6b7d;font-size:12px">${PROPERTY_TYPE_LABELS[l.propertyType]} · ${l.publicArea}</span><br><span style="font-size:13px;font-weight:600;color:#13314f">${priceShort(l.priceMonth)}/mo</span><br><a href="/listings/${l.slug}" style="color:#cf4715;font-weight:600;font-size:12.5px">View listing →</a></div>`;
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
  center,
  onBoundsChange,
}: {
  listings: Listing[];
  activeSlug?: string;
  /** When set ([lng, lat]), the map flies here instead of fitting all pins. */
  center?: [number, number] | null;
  onBoundsChange?: (b: MapBounds) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mgRef = useRef<(typeof import("mapbox-gl"))["default"] | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const loadedRef = useRef(false);
  const listingsRef = useRef(listings);
  const activeRef = useRef(activeSlug);
  const centerRef = useRef(center);
  const onBoundsRef = useRef(onBoundsChange);
  listingsRef.current = listings;
  activeRef.current = activeSlug;
  centerRef.current = center;
  onBoundsRef.current = onBoundsChange;

  // init once
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      mgRef.current = mapboxgl;
      mapboxgl.accessToken = TOKEN ?? "";

      const map = new mapboxgl.Map({
        container: elRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        projection: { name: "mercator" },
        center: [-96, 37.8],
        zoom: 3.2,
        // One-finger drag scrolls the page past the map; two fingers pan it
        // (and ctrl/cmd + scroll zooms). Keeps the map from trapping scroll.
        cooperativeGestures: true,
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
      });

      // Surface tile/WebGL errors instead of failing silently.
      map.on("error", (e) => {
        console.warn("[map] error:", e?.error?.message ?? e);
      });

      ro = new ResizeObserver(() => {
        mapRef.current?.resize();
        fitToMarkers();
      });
      ro.observe(elRef.current);

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
      io.observe(elRef.current);
    })();

    return () => {
      cancelled = true;
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

  // re-render markers when listings / active change
  useEffect(() => {
    if (loadedRef.current) renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, activeSlug]);

  // Fit to the searched location plus the nearest pins when it changes, so the
  // user always sees where the closest places are, even if the town itself has
  // none. (listings is already sorted nearest-first by the search view.)
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mgRef.current;
    if (!map || !mapboxgl || !center) return;
    const go = () => {
      const b = new mapboxgl.LngLatBounds();
      b.extend(center);
      listingsRef.current.slice(0, 6).forEach((l) => b.extend([l.lng, l.lat]));
      map.fitBounds(b, { padding: 70, maxZoom: 11, duration: 700 });
    };
    if (loadedRef.current) go();
    else map.once("load", go);
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

    listingsRef.current.forEach((l) => {
      const el = markerEl(priceShort(l.priceMonth), l.slug === activeRef.current);
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
    });

    fitToMarkers();
  }

  return <div ref={elRef} className="h-full w-full" />;
}
