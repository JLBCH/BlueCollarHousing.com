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
  it("switches from map to list when a location search has zero results", async () => {
    render(
      <SearchView
        allListings={[]}
        initialCenter={[-95.098, 29.665]}
        initialFilters={{ q: "La Porte, TX" }}
        initialView="map"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /list/i })).toHaveClass("bg-navy");
      expect(screen.getByRole("button", { name: /map/i })).toHaveClass("bg-white");
    });

    expect(
      screen.getByRole("heading", { name: /no listings near la porte, tx yet/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/contact us for a coupon code to list your first year free/i),
    ).toBeInTheDocument();
  });
});
