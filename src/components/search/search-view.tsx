"use client";

import { useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon, SearchX, MapPinOff } from "lucide-react";
import type { Listing, ListingFilters, PropertyType } from "@/lib/listings/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/listings/types";
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
// far-away places and calling them "near" (which isn't true). The value is an
// admin setting (site_settings.search_radius_mi) passed in by the server page;
// this is only the fallback when the setting can't be read.
const NEAR_RADIUS_MI = 100;

// Type/price/beds/pets filter UI is hidden for now (Joe, Jun 24 2026). The
// filtering logic stays wired; flip this to true to bring the controls back.
const SHOW_FILTERS = false;

const filterCls =
  "rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] font-medium text-navy outline-none focus:border-navy/40";

export function SearchView({
  allListings,
  initialFilters,
  initialCenter = null,
  initialView = "list",
  nearRadiusMi = NEAR_RADIUS_MI,
}: {
  allListings: Listing[];
  initialFilters: ListingFilters;
  initialCenter?: [number, number] | null;
  initialView?: "list" | "map";
  nearRadiusMi?: number;
}) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [mobileView, setMobileView] = useState<"list" | "map">(initialView);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [searchAsMove, setSearchAsMove] = useState(true);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  // Slug of the listing whose card/pin is currently hovered, so hovering one
  // highlights the other across the split screen (#12).
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

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
  const showMap = isDesktop === true || mobileView === "map";
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
  // All listings passing the type / price / beds / pets criteria (location is
  // handled separately by `center`). Studios/rooms have bedrooms 0, so a
  // min-beds filter correctly excludes them.
  const criteriaMatched = useMemo(
    () =>
      allListings.filter(
        (l) =>
          (!filters.type || l.propertyType === filters.type) &&
          (!filters.maxPrice || l.priceMonth <= filters.maxPrice) &&
          (!filters.minBeds || l.bedrooms >= filters.minBeds) &&
          (!filters.pets || l.petPolicy !== "no"),
      ),
    [allListings, filters.type, filters.maxPrice, filters.minBeds, filters.pets],
  );

  // The list: nearest-first within NEAR_RADIUS_MI of a searched location, or all
  // (cheapest-first) while browsing.
  const criteriaFiltered = useMemo(() => {
    if (center) {
      const [lng, lat] = center;
      return criteriaMatched
        .map((l) => ({ l, d: milesBetween(lat, lng, l.lat, l.lng) }))
        .filter((x) => x.d <= nearRadiusMi)
        .sort((a, b) => a.d - b.d)
        .map((x) => x.l);
    }
    return [...criteriaMatched].sort((a, b) => a.priceMonth - b.priceMonth);
  }, [criteriaMatched, center, nearRadiusMi]);

  // The map: same as the list, EXCEPT when a search finds nothing nearby — then
  // still show every listing (nearest-first) so the map isn't blank and the user
  // can pan/zoom out to the closest available places instead of a dead end.
  const mapListings = useMemo(() => {
    if (!center || criteriaFiltered.length > 0) return criteriaFiltered;
    const [lng, lat] = center;
    return criteriaMatched
      .map((l) => ({ l, d: milesBetween(lat, lng, l.lat, l.lng) }))
      .sort((a, b) => a.d - b.d)
      .map((x) => x.l);
  }, [center, criteriaFiltered, criteriaMatched]);

  // Only offer property types that actually exist in the data.
  const availableTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const l of allListings) seen.add(l.propertyType);
    return [...seen];
  }, [allListings]);
  const hasActiveFilters = Boolean(
    filters.type || filters.maxPrice || filters.minBeds || filters.pets,
  );

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
    <div
      className={cn(
        "flex flex-col",
        // Mobile Map view is a normal scrolling page so the footer is reachable
        // below the map. It takes its natural height (no min-h stretch) so there's
        // no empty gap between the map and the footer. Desktop keeps min-h.
        mobileView === "map" ? "lg:min-h-[calc(100vh-92px)]" : "min-h-[calc(100vh-92px)]",
      )}
    >
      {/* filter bar */}
      <div
        className={cn(
          "z-30 border-b border-line bg-white",
          // In mobile Map view the search bar scrolls away with the map (not sticky)
          // so the map never slides *under* it; desktop + list keep it pinned.
          mobileView === "map" ? "lg:sticky lg:top-[92px]" : "sticky top-[92px]",
        )}
      >
        <Container className="py-3.5">
          <LocationSearch
            defaultValue={filters.q ?? ""}
            onSelect={(p) => {
              setCenter(p.center);
              setFilters((f) => ({ ...f, q: p.name }));
            }}
            onSubmitText={(t) => setFilters((f) => ({ ...f, q: t }))}
          />

          {/* type / price / beds / pets filters — hidden for now per Joe
              (Jun 24); flip SHOW_FILTERS to re-enable. The filtering logic in
              criteriaFiltered stays wired, so URL params still work. */}
          {SHOW_FILTERS && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <select
              aria-label="Property type"
              value={filters.type ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, type: (e.target.value || undefined) as PropertyType | undefined }))
              }
              className={filterCls}
            >
              <option value="">Any type</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t as PropertyType] ?? t}
                </option>
              ))}
            </select>

            <select
              aria-label="Maximum price"
              value={filters.maxPrice ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))
              }
              className={filterCls}
            >
              <option value="">Any price</option>
              {[750, 1000, 1500, 2000, 2500, 3000].map((p) => (
                <option key={p} value={p}>
                  Up to ${p.toLocaleString()}/mo
                </option>
              ))}
            </select>

            <select
              aria-label="Minimum bedrooms"
              value={filters.minBeds ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, minBeds: e.target.value ? Number(e.target.value) : undefined }))
              }
              className={filterCls}
            >
              <option value="">Any beds</option>
              {[1, 2, 3, 4].map((b) => (
                <option key={b} value={b}>
                  {b}+ beds
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, pets: f.pets ? undefined : true }))}
              aria-pressed={Boolean(filters.pets)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition",
                filters.pets
                  ? "border-orange bg-orange-tint/40 text-navy"
                  : "border-line bg-white text-navy hover:border-navy/30",
              )}
            >
              Pets OK
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() =>
                  setFilters((f) => ({ q: f.q, type: undefined, maxPrice: undefined, minBeds: undefined, pets: undefined }))
                }
                className="rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-orange hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          )}

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
      <div
        className={cn(
          "lg:grid lg:grid-cols-[1fr_minmax(400px,44%)]",
          mobileView === "map" ? "lg:flex-1" : "flex-1",
        )}
      >
        {/* results list */}
        <div className={cn("min-w-0", mobileView === "map" ? "hidden lg:block" : "block")}>
          <Container className="py-6">
            {center && total === 0 ? (
              <NoNearbyState place={filters.q} />
            ) : total === 0 && !Object.values(filters).some((v) => (Array.isArray(v) ? v.length : v)) ? (
              <EmptyState
                title="No listings yet"
                body="Listings will appear here as landlords add them. Own a property? List it and reach workers in your area."
                actionLabel="List your property"
                onAction={() => {
                  window.location.href = "/list-your-property";
                }}
              />
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
                  <ListingCard
                    key={l.slug}
                    listing={l}
                    active={hoveredSlug === l.slug}
                    onMouseEnter={() => setHoveredSlug(l.slug)}
                    onMouseLeave={() => setHoveredSlug((s) => (s === l.slug ? null : s))}
                  />
                ))}
              </div>
            )}
          </Container>
        </div>

        {/* map */}
        {/* The desktop sticky offset must clear BOTH sticky bars above it: the
            92px global nav + the ~107px search header (bottom at 200px). The old
            168px left the map's top ~30px — and the "Search as I move the map"
            control and the zoom/fullscreen buttons — tucked behind the header. */}
        <div
          className={cn(
            "relative lg:sticky lg:top-[200px] lg:h-[calc(100vh-200px)]",
            // Mobile map: a tall-but-not-full section so the footer sits just below
            // and is reachable by scrolling (one finger scrolls the page, two pan
            // the map — cooperative gestures, same as the listing-page map).
            mobileView === "map" ? "block h-[72vh]" : "hidden lg:block",
          )}
        >
          {/* Wait for isDesktop to resolve before mounting the map, so the
              cooperative-gestures prop is correct at init (it's read once). The
              hero funnels desktop users in via ?view=map, which would otherwise
              mount the map while isDesktop is still null → gestures wrongly off. */}
          {showMap && isDesktop !== null && (
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
              {/* Whenever zero listings are available the map would otherwise be
                  a blank, contextless view (especially on mobile, where the list
                  column with this CTA is hidden). Covers both a zero-result
                  location search AND an empty database with no search (e.g. the
                  hero's ?view=map link) — the Map tab is never a dead end. */}
              {total === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3">
                  <div className="pointer-events-auto max-w-[440px] rounded-card border border-line bg-white/95 p-4 text-center shadow-[0_8px_24px_rgba(16,32,48,0.18)] backdrop-blur">
                    <p className="font-display text-[17px] font-bold text-navy">
                      {center ? `No listings near ${filters.q || "this area"} yet` : "No listings yet"}
                    </p>
                    <p className="mt-1 text-[13px] text-muted">
                      Be the first to list here. Contact us for a coupon code to list your first year free.
                    </p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <Button href="/list-your-property" variant="orange">
                        List my property
                      </Button>
                      <Button href="/contact" variant="outline">
                        Contact us
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <ResultsMap
                listings={mapListings}
                activeSlug={hoveredSlug ?? undefined}
                onHover={setHoveredSlug}
                center={center}
                onBoundsChange={setBounds}
                // Cooperative everywhere: one finger scrolls the page (so the
                // mobile map tab can scroll down to the footer), two fingers pan
                // the map. Same behavior as the listing-page map.
                cooperative
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
