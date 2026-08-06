import { describe, expect, it } from "vitest";
import { styleMarker, MAPBOX_CONTROL_Z } from "./marker-style";

// Regression: pins used to get z-index "0" when inactive, which sits BELOW
// Mapbox's control layer (the logo + attribution, z-index 2). A pin overlapping
// the bottom-left mapbox logo therefore lost its tap to the mapbox.com link.
// Both states must now sit above the control layer so the pin always wins.
describe("styleMarker z-index vs Mapbox control layer", () => {
  const z = (active: boolean) => {
    const el = document.createElement("div");
    styleMarker(el, active);
    return Number(el.style.zIndex);
  };

  it("keeps an inactive pin above the mapbox logo/attribution layer", () => {
    expect(z(false)).toBeGreaterThan(MAPBOX_CONTROL_Z);
  });

  it("keeps an active pin above the control layer and above inactive pins", () => {
    expect(z(true)).toBeGreaterThan(MAPBOX_CONTROL_Z);
    expect(z(true)).toBeGreaterThan(z(false));
  });
});
