"use client";

import { useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon, SearchX, MapPinOff } from "lucide-react";
import type { Listing, ListingFilters } from "@/lib/listings/types";
import { filtersToQuery } from "@/lib/listings/filter";
import { geocodeUS, milesBetween } from "@/lib/geo";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { LocationSearch } from "@/components/search/location-search";
import { ResultsMap, type MapBounds } from "@/components/search/results-map";
import { cn } from "@/lib/cn";

function inBounds(l: Listing, b: MapBounds): boolean {
  return l.lat >= b.south && l.lat <= b.north && l.lng >= b.west && l.lng <= b.east;
}

// When searching a location, show only listings within this radius. If there
// are none that close we say so plainly rather than padding the list with
// far-away places and calling them "near" (which isn't true).
const NEAR_RADIUS_MI = 100;

export function SearchView({
  allListings,
  initialFilters,
  initialCenter = null,
  initialView = "list",
}: {
  allListings: Listing[];
  initialFilters: ListingFilters;
  initialCenter?: [number, number] | null;
  initialView?: "list" | "map";
}) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [mobileView, setMobileView] = useState<"list" | "map">(initialView);
  const [isDesktop, setIsDesktop] = useState(false);
  const [searchAsMove, setSearchAsMove] = useState(true);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  // Only mount the WebGL map when it's actually on screen. On phones the list
  // is the default view, so spinning up Mapbox (a ~250KB parse plus a WebGL
  // context and tile downloads) on load is what made older devices like the
  // iPhone 7 lock up. Desktop always shows the map; mobile waits for the Map tab.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const showMap = isDesktop || mobileView === "map";
  // Geocoded center of the typed city/zip. When set, search is by proximity,
  // so a place with no listing of its own still surfaces nearby ones.
  const [center, setCenter] = useState<[number, number] | null>(initialCenter);

  // Geocode the search term (debounced) so "77571" or "La Porte" maps to a
  // location even when no listing matches the text.
  useEffect(() => {
    const q = (filters.q ?? "").trim();
    if (q.length < 2) {
      setCenter(null);
      return;
    }
    let active = true;
    const t = setTimeout(() => {
      geocodeUS(q).then((c) => {
        if (active) setCenter(c);
      });
    }, 450);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [filters.q]);

  // Markers + list. With a searched location, rank by distance and keep those
  // within NEAR_RADIUS_MI (or the nearest few if none are that close), so a
  // city with no listing of its own still shows the closest places.
  const criteriaFiltered = useMemo(() => {
    if (center) {
      const [lng, lat] = center;
      return allListings
        .map((l) => ({ l, d: milesBetween(lat, lng, l.lat, l.lng) }))
        .filter((x) => x.d <= NEAR_RADIUS_MI)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.l);
    }
    return [...allListings].sort((a, b) => a.priceMonth - b.priceMonth);
  }, [allListings, center]);

  // While browsing (no searched location) the list narrows to the map viewport
  // when the toggle is on. During a location search we always show the nearest.
  const visible = useMemo(() => {
    if (center) return criteriaFiltered;
    if (!searchAsMove || !bounds) return criteriaFiltered;
    return criteriaFiltered.filter((l) => inBounds(l, bounds));
  }, [criteriaFiltered, searchAsMove, bounds, center]);

  // Reflect filters in the URL bar (shareable) without a server round-trip.
  useEffect(() => {
    const qs = filtersToQuery(filters);
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }, [filters]);

  const total = criteriaFiltered.length;
  const shownCount = visible.length;

  return (
    <div className="flex min-h-[calc(100vh-92px)] flex-col">
      {/* filter bar */}
      <div className="sticky top-[92px] z-30 border-b border-line bg-white">
        <Container className="py-3.5">
          <LocationSearch
            defaultValue={filters.q ?? ""}
            onSelect={(p) => {
              setCenter(p.center);
              setFilters((f) => ({ ...f, q: p.name }));
            }}
            onSubmitText={(t) => setFilters((f) => ({ ...f, q: t }))}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[14px] text-muted">
              {center ? (
                total > 0 ? (
                  <>
                    <span className="font-semibold text-navy">{shownCount}</span>{" "}
                    {shownCount === 1 ? "place" : "places"} near{" "}
                    {filters.q || "this location"}
                  </>
                ) : (
                  <>No listings near {filters.q || "this location"}</>
                )
              ) : (
                <>
                  <span className="font-semibold text-navy">{shownCount}</span>{" "}
                  {shownCount === 1 ? "place" : "places"}{" "}
                  {searchAsMove ? "in this area" : "available"}
                </>
              )}
            </p>
            <div className="flex overflow-hidden rounded-lg border border-line lg:hidden">
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium",
                  mobileView === "list" ? "bg-navy text-white" : "bg-white text-navy",
                )}
              >
                <List className="h-4 w-4" /> List
              </button>
              <button
                type="button"
                onClick={() => setMobileView("map")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium",
                  mobileView === "map" ? "bg-navy text-white" : "bg-white text-navy",
                )}
              >
                <MapIcon className="h-4 w-4" /> Map
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* body: list + map */}
      <div className="flex-1 lg:grid lg:grid-cols-[1fr_minmax(400px,44%)]">
        {/* results list */}
        <div className={cn("min-w-0", mobileView === "map" ? "hidden lg:block" : "block")}>
          <Container className="py-6">
            {center && total === 0 ? (
              <NoNearbyState place={filters.q} />
            ) : total === 0 ? (
              <EmptyState
                title="No places match your search"
                body="Try a different city or state, or clear the search to see every listing."
                actionLabel="Clear search"
                onAction={() => setFilters({})}
              />
            ) : visible.length === 0 ? (
              <EmptyState
                title="No places in this part of the map"
                body="Zoom out or move the map to see more, or show every match."
                actionLabel={`Show all ${total} places`}
                onAction={() => setSearchAsMove(false)}
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {visible.map((l) => (
                  <ListingCard key={l.slug} listing={l} />
                ))}
              </div>
            )}
          </Container>
        </div>

        {/* map */}
        <div
          className={cn(
            "relative lg:sticky lg:top-[168px] lg:h-[calc(100vh-168px)]",
            mobileView === "map" ? "block h-[calc(100vh-168px)]" : "hidden lg:block",
          )}
        >
          {showMap && (
            <>
              {!center && (
                <label className="absolute left-3 top-3 z-20 flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-[13px] font-medium text-navy shadow-[0_2px_10px_rgba(16,32,48,0.18)]">
                  <input
                    type="checkbox"
                    checked={searchAsMove}
                    onChange={(e) => setSearchAsMove(e.target.checked)}
                    className="h-4 w-4 accent-orange"
                  />
                  Search as I move the map
                </label>
              )}
              <ResultsMap
                listings={criteriaFiltered}
                center={center}
                onBoundsChange={setBounds}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Shown when a location search returns nothing within 100 miles. Instead of a
 * dead end, we invite the visitor to be the first to list in that market.
 */
function NoNearbyState({ place }: { place?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line px-6 py-20 text-center">
      <MapPinOff className="h-12 w-12 text-muted" />
      <h2 className="font-display mt-5 text-[30px] font-bold leading-tight text-navy sm:text-[34px]">
        No listings{place ? ` near ${place}` : " in this area"} yet
      </h2>
      <p className="mt-4 max-w-[34ch] text-[18px] leading-relaxed text-[#3a4a5a] sm:max-w-[44ch]">
        We currently do not have any listings in this area. Be the first to list here.
        Contact us for a coupon code to list your first year free.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button href="/list-your-property" variant="orange" size="lg">
          List my property
        </Button>
        <Button href="/contact" variant="outline" size="lg">
          Contact us
        </Button>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line py-20 text-center">
      <SearchX className="h-10 w-10 text-muted" />
      <h2 className="font-display mt-4 text-[24px] font-bold text-navy">{title}</h2>
      <p className="mt-2 max-w-[40ch] text-[15px] text-muted">{body}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-5 rounded-lg bg-navy px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-navy-deep"
      >
        {actionLabel}
      </button>
    </div>
  );
}
