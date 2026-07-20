// One-off: re-geocode every listing's stored lat/lng to rooftop precision.
// Existing rows were placed at the ZIP-code centroid (the old geocoder excluded
// `address` results), so pins sit ~2000-3000 ft off. This walks all listings,
// geocodes the full street address with `address` precision, and updates the
// coordinates when they move materially.
//
// Usage:
//   node scripts/regeocode-listings.mjs          # DRY RUN (no writes)
//   node scripts/regeocode-listings.mjs --apply   # write the new coordinates
//
// Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_MAPBOX_TOKEN
// from .env.local.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// --- load .env.local ---
const env = {};
try {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch {
  console.error("Could not read .env.local"); process.exit(1);
}

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN;
const APPLY = process.argv.includes("--apply");

if (!URL_ || !KEY || !TOKEN) { console.error("Missing env vars."); process.exit(1); }

const db = createClient(URL_, KEY, { auth: { persistSession: false } });

function milesBetween(lat1, lng1, lat2, lng2) {
  const R = 3958.8, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

async function geocodeAddress(query) {
  const q = query.trim();
  if (q.length < 2) return null;
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
    `?country=us&limit=1&autocomplete=false&types=address,postcode,place,locality,neighborhood&access_token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const f = data.features?.[0];
  const c = f?.center;
  return Array.isArray(c) && c.length === 2 ? { lng: c[0], lat: c[1], type: (f.place_type || [])[0], name: f.place_name } : null;
}

const { data: rows, error } = await db
  .from("listings")
  .select("id, slug, address, city, state, zip, lat, lng")
  .order("created_at", { ascending: true });
if (error) { console.error(error); process.exit(1); }

console.log(`${APPLY ? "APPLY" : "DRY RUN"} — ${rows.length} listings\n`);
let moved = 0, skipped = 0, addressHits = 0;

for (const r of rows) {
  if (!r.address || !r.address.trim()) { skipped++; continue; }
  const query = `${r.address} ${r.city}, ${r.state} ${r.zip}`.trim();
  const g = await geocodeAddress(query);
  await new Promise((res) => setTimeout(res, 120)); // be gentle on the API
  if (!g) { console.log(`  ?  ${r.slug} — no geocode`); skipped++; continue; }
  const distMi = (r.lat != null && r.lng != null) ? milesBetween(r.lat, r.lng, g.lat, g.lng) : null;
  const distFt = distMi == null ? null : Math.round(distMi * 5280);
  if (g.type === "address") addressHits++;
  const willMove = distFt == null || distFt > 50;
  if (willMove) {
    moved++;
    console.log(`  ${g.type === "address" ? "✓" : "~"} ${r.slug} [${g.type}] moved ${distFt ?? "?"} ft  ${g.name?.slice(0, 45) ?? ""}`);
    if (APPLY) {
      const { error: upErr } = await db.from("listings").update({ lat: g.lat, lng: g.lng }).eq("id", r.id);
      if (upErr) console.log(`     !! update failed: ${upErr.message}`);
    }
  }
}

console.log(`\nDone. ${moved} would move${APPLY ? " (written)" : ""}, ${skipped} skipped, ${addressHits} resolved to rooftop address.`);
if (!APPLY) console.log("Re-run with --apply to write the coordinates.");
