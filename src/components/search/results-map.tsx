"use client";

import { useEffect, useRef } from "react";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@/lib/listings/types";

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
  return `<div style="min-width:160px;font-family:Inter,sans-serif"><b>${l.title}</b><br>${l.publicArea} · ${priceShort(l.priceMonth)}/mo<br><a href="/listings/${l.slug}" style="color:#cf4715;font-weight:600">View listing →</a></div>`;
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
  onBoundsChange,
}: {
  listings: Listing[];
  activeSlug?: string;
  onBoundsChange?: (b: MapBounds) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const mgRef = useRef<(typeof import("mapbox-gl"))["default"] | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const loadedRef = useRef(false);
  const listingsRef = useRef(listings);
  const activeRef = useRef(activeSlug);
  const onBoundsRef = useRef(onBoundsChange);
  listingsRef.current = listings;
  activeRef.current = activeSlug;
  onBoundsRef.current = onBoundsChange;

  // init once
  useEffect(() => {
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      mgRef.current = mapboxgl;
      mapboxgl.accessToken = TOKEN ?? "";

      const map = new mapboxgl.Map({
        container: elRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-96, 37.8],
        zoom: 3.2,
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
        renderMarkers();
      });

      ro = new ResizeObserver(() => {
        mapRef.current?.resize();
        fitToMarkers();
      });
      ro.observe(elRef.current);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
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

  function fitToMarkers() {
    const mapboxgl = mgRef.current;
    const map = mapRef.current;
    if (!mapboxgl || !map) return;
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
      const popup = new mapboxgl.Popup({ offset: 16, closeButton: true }).setHTML(
        popupHtml(l),
      );
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
