import { describe, expect, it } from "vitest";
// Reproduces Joe's bug (Jul 22): laundry (and internet) chosen in the builder
// never appear on the published listing. The listing page must render them in
// "What this place offers" via this helper.
import { listingExtraOffers } from "./offers";

describe("listingExtraOffers", () => {
  it("shows the builder's laundry choice with its human label", () => {
    expect(listingExtraOffers({ laundry: "in_unit" })).toContain("Washer and dryer in unit");
    expect(listingExtraOffers({ laundry: "free_onsite" })).toContain("Free laundry on site");
    expect(listingExtraOffers({ laundry: "coin_op" })).toContain("Coin-op laundry on site");
    expect(listingExtraOffers({ laundry: "laundromat" })).toContain("Laundromat nearby");
  });

  it("shows internet options (comma-joined multi-select)", () => {
    const offers = listingExtraOffers({ internet: "wifi,wired" });
    expect(offers).toContain("WiFi");
    expect(offers).toContain("Wired internet");
  });

  it('hides "none" and missing values entirely', () => {
    expect(listingExtraOffers({ laundry: "none", internet: "none" })).toEqual([]);
    expect(listingExtraOffers({})).toEqual([]);
  });

  it("combines laundry + internet in one list", () => {
    const offers = listingExtraOffers({ laundry: "in_unit", internet: "wifi" });
    expect(offers).toEqual(["WiFi", "Washer and dryer in unit"]);
  });
});
