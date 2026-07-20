// Geocoding + distance helpers for proximity search. A worker can type a city
// or zip that has no listing of its own (e.g. La Porte 77571) and still see
// nearby listings (Baytown is minutes away). We geocode the term to a point,
// then center the map there and rank listings by distance.

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** Geocode a US city/state/zip to [lng, lat], or null if it can't be found.
 *  Used for proximity SEARCH, so it intentionally resolves to a city/zip
 *  centroid (a worker types "La Porte" or "77571", not a street address). */
export async function geocodeUS(query: string): Promise<[number, number] | null> {
  const q = query.trim();
  if (!TOKEN || q.length < 2) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?country=us&limit=1&autocomplete=false` +
    `&types=postcode,place,locality,region,district,neighborhood` +
    `&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { center?: number[] }[] };
    const c = data.features?.[0]?.center;
    return Array.isArray(c) && c.length === 2 ? [c[0], c[1]] : null;
  } catch {
    return null;
  }
}

/** Geocode a full STREET ADDRESS to [lng, lat] at rooftop precision, for
 *  placing a listing's map pin. Unlike geocodeUS this allows `address` results
 *  (and falls back to postcode/place if the street can't be matched), so the
 *  pin lands on the building rather than the ZIP-code centroid ~½ mile away. */
export async function geocodeAddress(query: string): Promise<[number, number] | null> {
  const q = query.trim();
  if (!TOKEN || q.length < 2) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?country=us&limit=1&autocomplete=false` +
    `&types=address,postcode,place,locality,neighborhood` +
    `&access_token=${TOKEN}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { center?: number[] }[] };
    const c = data.features?.[0]?.center;
    return Array.isArray(c) && c.length === 2 ? [c[0], c[1]] : null;
  } catch {
    return null;
  }
}

/** Great-circle distance in miles between two lat/lng points. */
export function milesBetween(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 3958.8; // earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
