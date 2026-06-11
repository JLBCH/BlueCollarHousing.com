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
  const initialFilters = parseFilters(await searchParams);
  // Fetch all approved listings once; filtering happens instantly client-side.
  // Strip contact fields, search never shows them, and we don't want phone/
  // email serialized into the client payload where bots could harvest them.
  const allListings = (await getListings({})).map((l) => ({
    ...l,
    contactPhone: null,
    contactEmail: null,
  }));

  return <SearchView allListings={allListings} initialFilters={initialFilters} />;
}
