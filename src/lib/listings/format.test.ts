import { describe, it, expect } from "vitest";
import { specsLine, previewRate } from "./format";
import type { Listing } from "./types";

/** Minimal Listing factory for display-helper tests. */
function L(partial: Partial<Listing>): Listing {
  return {
    id: "1",
    slug: "s",
    status: "approved",
    title: "t",
    propertyType: "house",
    bedrooms: 0,
    bathrooms: 0,
    priceMonth: 0,
    leaseLength: "",
    description: "",
    nearbyProjects: "",
    amenities: [],
    utilitiesIncluded: false,
    petPolicy: "no",
    city: "",
    state: "",
    publicArea: "",
    lat: 0,
    lng: 0,
    contactPhone: null,
    showPhone: false,
    contactEmail: null,
    showEmail: false,
    allowContactForm: false,
    photos: [],
    ...partial,
  } as Listing;
}

describe("specsLine", () => {
  it("never shows '0 bd · 0 ba' for a private room", () => {
    const s = specsLine(L({ listingKind: "room", bedrooms: 0, bathrooms: 0 }));
    expect(s).not.toMatch(/0 bd/);
    expect(s).toMatch(/private room/i);
  });

  it("labels a studio instead of '0 bd'", () => {
    const s = specsLine(L({ bedroomType: "studio", bedrooms: 0 }));
    expect(s).toMatch(/studio/i);
    expect(s).not.toMatch(/0 bd/);
  });

  it("handles builder rv_park/rv_spot as RV space", () => {
    expect(specsLine(L({ propertyType: "rv_park", bedrooms: 0, bathrooms: 0 }))).toMatch(/RV/i);
    expect(specsLine(L({ propertyType: "rv_spot", bedrooms: 0, bathrooms: 0 }))).toMatch(/RV/i);
  });

  it("falls back to the type label rather than an empty/zero line", () => {
    const s = specsLine(L({ propertyType: "hotel", bedrooms: 0, bathrooms: 0 }));
    expect(s).not.toMatch(/0 bd/);
    expect(s.length).toBeGreaterThan(0);
  });

  it("still shows bd · ba for a normal house", () => {
    expect(specsLine(L({ bedrooms: 3, bathrooms: 2 }))).toBe("3 bd · 2 ba");
  });
});

describe("previewRate", () => {
  it("uses the structured weekly rate", () => {
    expect(previewRate(L({ rateBilled: "weekly", rateAmount: 400 }))).toBe("$400 / week");
  });
  it("labels 4-week billing", () => {
    expect(previewRate(L({ rateBilled: "four_weeks", rateAmount: 1600 }))).toBe(
      "$1,600 / 4 weeks (28 days)",
    );
  });
  it("returns Call for rates", () => {
    expect(previewRate(L({ rateBilled: "call", rateAmount: null }))).toBe("Call for rates");
  });
  it("falls back to monthly price when no structured rate", () => {
    expect(previewRate(L({ priceMonth: 1200 }))).toBe("$1,200 / month");
  });
});
