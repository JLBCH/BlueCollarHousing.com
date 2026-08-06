// Pure marker styling, split out from results-map.tsx so it can be unit-tested
// without importing mapbox-gl (and its CSS, which the test runner can't parse).

// Mapbox draws its logo + attribution controls in a layer at this z-index. Pins
// must sit above it so a pin overlapping the bottom-left logo captures the tap
// and opens its popup instead of the mapbox.com link.
export const MAPBOX_CONTROL_Z = 2;

// Plain teardrop pin, no price on the marker itself (the rate shows in the
// preview popup). Active pin is orange and lifted; the rest navy.
export function styleMarker(el: HTMLDivElement, active: boolean): void {
  el.style.background = active ? "#cf4715" : "#13314f";
  // Both states sit ABOVE Mapbox's bottom control layer (the logo + attribution)
  // so an overlapping pin captures the tap. Active stays above inactive; the zoom
  // control (globals.css) is lifted above both so a pin can't block it.
  el.style.zIndex = active ? String(MAPBOX_CONTROL_Z + 2) : String(MAPBOX_CONTROL_Z + 1);
  el.style.width = active ? "22px" : "18px";
  el.style.height = active ? "22px" : "18px";
}

export function markerEl(active: boolean): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff;cursor:pointer;transition:width .12s,height .12s";
  styleMarker(el, active);
  return el;
}
