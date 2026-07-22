import type { Laundry, InternetOption } from "./types";

// Laundry/internet are stored as their own columns (builder radio/checkboxes),
// not inside amenities[] — so the amenities list alone under-reports what the
// place offers. This helper turns those columns into display labels so the
// listing page can fold them into "What this place offers".

const INTERNET_LABELS: Record<Exclude<InternetOption, "none">, string> = {
  wifi: "WiFi",
  wired: "Wired internet",
};

const LAUNDRY_LABELS: Record<Exclude<Laundry, "none">, string> = {
  in_unit: "Washer and dryer in unit",
  free_onsite: "Free laundry on site",
  coin_op: "Coin-op laundry on site",
  laundromat: "Laundromat nearby",
};

/**
 * Display labels for the builder's laundry + internet choices. Unknown or
 * "none" values yield nothing (never a raw DB token in the UI). Internet can
 * be several comma-joined options; laundry is a single choice.
 */
export function listingExtraOffers(args: {
  laundry?: string | null;
  internet?: string | null;
}): string[] {
  const offers: string[] = [];

  for (const opt of (args.internet ?? "").split(",")) {
    const label = INTERNET_LABELS[opt.trim() as keyof typeof INTERNET_LABELS];
    if (label) offers.push(label);
  }

  const laundry = LAUNDRY_LABELS[args.laundry as keyof typeof LAUNDRY_LABELS];
  if (laundry) offers.push(laundry);

  return offers;
}
