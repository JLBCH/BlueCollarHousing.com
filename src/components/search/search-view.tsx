"use client";

import { useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon, SearchX } from "lucide-react";
import type { Listing, ListingFilters } from "@/lib/listings/types";
import { filterListings, filtersToQuery } from "@/lib/listings/filter";
import { Container } from "@/components/ui/container";
import { ListingCard } from "@/components/listings/listing-card";
import { FilterBar } from "@/components/search/filter-bar";
import { ResultsMap, type MapBounds } from "@/components/search/results-map";
import { cn } from "@/lib/cn";

function inBounds(l: Listing, b: MapBounds): boolean {
  return l.lat >= b.south && l.lat <= b.north && l.lng >= b.west && l.lng <= b.east;
}

export function SearchView({
  allListings,
  initialFilters,
}: {
  allListings: Listing[];
  initialFilters: ListingFilters;
}) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [searchAsMove, setSearchAsMove] = useState(true);
  const [bounds, setBounds] = useState<MapBounds | null>(null);

  // Matches the filter criteria (these are the markers shown on the map).
  const criteriaFiltered = useMemo(
    () =>
      filterListings(allListings, filters).sort(
        (a, b) => a.priceMonth - b.priceMonth,
      ),
    [allListings, filters],
  );

  // The list narrows to what's in the map viewport when the toggle is on.
  const visible = useMemo(() => {
    if (!searchAsMove || !bounds) return criteriaFiltered;
    return criteriaFiltered.filter((l) => inBounds(l, bounds));
  }, [criteriaFiltered, searchAsMove, bounds]);

  // Reflect filters in the URL bar (shareable) without a server round-trip.
  useEffect(() => {
    const qs = filtersToQuery(filters);
    window.history.replaceState(null, "", qs ? `/search?${qs}` : "/search");
  }, [filters]);

  const total = criteriaFiltered.length;
  const shownCount = searchAsMove ? visible.length : total;

  return (
    <div className="flex min-h-[calc(100vh-72px)] flex-col">
      {/* filter bar */}
      <div className="sticky top-[72px] z-30 border-b border-line bg-white/95 backdrop-blur">
        <Container className="py-3.5">
          <FilterBar filters={filters} onChange={setFilters} />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-[14px] text-muted">
              <span className="font-semibold text-navy">{shownCount}</span>{" "}
              {shownCount === 1 ? "place" : "places"}{" "}
              {searchAsMove
                ? "in this area"
                : filters.q
                  ? `near ${filters.q}`
                  : "available"}
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
            {total === 0 ? (
              <EmptyState
                title="No places match your filters"
                body="Try widening your price range, clearing the property type, or searching a different city."
                actionLabel="Reset filters"
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
            "relative lg:sticky lg:top-[148px] lg:h-[calc(100vh-148px)]",
            mobileView === "map" ? "block h-[calc(100vh-148px)]" : "hidden lg:block",
          )}
        >
          <label className="absolute left-3 top-3 z-[500] flex cursor-pointer items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-[13px] font-medium text-navy shadow-[0_2px_10px_rgba(16,32,48,0.18)] backdrop-blur">
            <input
              type="checkbox"
              checked={searchAsMove}
              onChange={(e) => setSearchAsMove(e.target.checked)}
              className="h-4 w-4 accent-orange"
            />
            Search as I move the map
          </label>
          <ResultsMap listings={criteriaFiltered} onBoundsChange={setBounds} />
        </div>
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
