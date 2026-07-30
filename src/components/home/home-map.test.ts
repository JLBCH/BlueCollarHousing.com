import { describe, expect, it } from "vitest";
import { staticMapUrl } from "./home-map";

const PINS = [
  { lat: 32.0, lng: -102.0 }, // Permian Basin (far west)
  { lat: 29.9, lng: -90.0 }, // New Orleans (far east)
  { lat: 30.0, lng: -95.0 }, // Houston (middle)
];

describe("staticMapUrl", () => {
  it("encodes the requested image dimensions so /auto/ fits pins to that frame", () => {
    expect(staticMapUrl(PINS, 1200, 560)).toContain("/auto/1200x560@2x");
    expect(staticMapUrl(PINS, 640, 720)).toContain("/auto/640x720@2x");
  });

  it("supports a portrait frame for mobile so wide-spread pins aren't cropped", () => {
    // The mobile container is taller than it is wide; a portrait image lets
    // Mapbox's auto-fit zoom out to include the outermost pins instead of them
    // being sliced off by object-cover on a landscape image.
    const url = staticMapUrl(PINS, 640, 760);
    const match = url.match(/\/auto\/(\d+)x(\d+)@2x/);
    expect(match).not.toBeNull();
    const [, w, h] = match!.map(Number);
    expect(h).toBeGreaterThan(w);
  });

  it("still fits all pins (auto viewport) with padding", () => {
    const url = staticMapUrl(PINS, 640, 760);
    expect(url).toContain("/auto/");
    expect(url).toContain("padding=");
  });
});
