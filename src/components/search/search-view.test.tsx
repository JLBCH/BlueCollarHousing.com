import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchView } from "@/components/search/search-view";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/geo", () => ({
  geocodeUS: vi.fn(() => new Promise<null>(() => {})),
  milesBetween: vi.fn(() => 0),
}));

vi.mock("@/components/search/results-map", () => ({
  ResultsMap: () => <div data-testid="results-map" />,
}));

vi.mock("@/components/search/location-search", () => ({
  LocationSearch: () => <div data-testid="location-search" />,
}));

describe("SearchView mobile empty results", () => {
  it("keeps the map view (no forced switch) and overlays the empty-state CTA when a location search has zero results", async () => {
    render(
      <SearchView
        allListings={[]}
        initialCenter={[-95.098, 29.665]}
        initialFilters={{ q: "La Porte, TX" }}
        initialView="map"
      />,
    );

    // Regression guard: tapping/opening Map on a 0-result search must NOT snap
    // back to the list (that was the original "Map button does nothing" bug).
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /map/i })).toHaveClass("bg-navy");
      expect(screen.getByRole("button", { name: /list/i })).toHaveClass("bg-white");
    });

    // The "be the first to list" CTA is still reachable (overlaid on the map
    // and/or in the list column), so the map is never a dead end.
    expect(
      screen.getAllByText(/coupon code to list your first year free/i).length,
    ).toBeGreaterThan(0);
  });

  it("overlays the empty state on the map even WITHOUT a location search (empty DB via ?view=map)", () => {
    // Regression: the overlay used to require a searched center, so an empty
    // database + the hero's ?view=map link left mobile users on a blank map
    // with the list column's empty state hidden by CSS.
    render(
      <SearchView allListings={[]} initialFilters={{}} initialView="map" />,
    );
    expect(screen.getAllByText(/No listings yet/i).length).toBeGreaterThan(0);
  });
});
