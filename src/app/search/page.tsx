import type { Metadata } from "next";
import { getListings } from "@/lib/listings";
import { parseFilters } from "@/lib/listings/filter";
import { SearchView } from "@/components/search/search-view";

export const metadata: Metadata = {
  title: "Find Housing",
  description:
    "Search furnished housing near the job site. Filter by city, property type, price, bedrooms and pets, and see every listing on the map.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const initialFilters = parseFilters(sp);
  // The hero passes the chosen place's coordinates so the map can center
  // immediately without re-geocoding.
  const lat = Number(sp.lat);
  const lng = Number(sp.lng);
  const initialCenter: [number, number] | null =
    Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : null;
  // The hero "Search the Map" button asks to open on the map (mobile tab).
  const initialView = sp.view === "map" ? "map" : "list";
  // Fetch all approved listings once; filtering happens instantly client-side.
  // Strip contact fields, search never shows them, and we don't want phone/
  // email serialized into the client payload where bots could harvest them.
  const allListings = (await getListings({})).map((l) => ({
    ...l,
    contactPhone: null,
    contactEmail: null,
  }));

  return (
    <SearchView
      allListings={allListings}
      initialFilters={initialFilters}
      initialCenter={initialCenter}
      initialView={initialView}
    />
  );
}
