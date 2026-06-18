"use client";

import { useRouter } from "next/navigation";
import { LocationSearch, type Place } from "@/components/search/location-search";

/** Hero search box: picks (or types) a place and navigates to /search. */
export function HeroSearch() {
  const router = useRouter();

  function go(q: string, center?: [number, number]) {
    const params = new URLSearchParams({ q });
    if (center) {
      params.set("lng", String(center[0]));
      params.set("lat", String(center[1]));
    }
    // The button says "Search the Map", so land on the map (matters on mobile,
    // where the search page otherwise opens to the list tab).
    params.set("view", "map");
    router.push(`/search?${params.toString()}`);
  }

  return (
    <div className="mx-auto mt-9 max-w-[560px]">
      <LocationSearch
        showButton
        buttonLabel="Search the Map"
        onSelect={(p: Place) => go(p.name, p.center)}
        onSubmitText={(t) => go(t)}
      />
    </div>
  );
}
