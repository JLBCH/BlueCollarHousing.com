import { getListings } from "@/lib/listings";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { SectionHead } from "@/components/ui/section-head";
import { ResultsMap } from "@/components/search/results-map";

/**
 * Home "browse on the map" section. Reuses the same ResultsMap as search.
 * Contact fields are stripped before the data crosses into the client
 * component, the same pattern as the search page.
 */
export async function HomeMap() {
  const listings = (await getListings({})).map((l) => ({
    ...l,
    contactPhone: null,
    contactEmail: null,
  }));

  return (
    <section className="py-16 sm:py-20">
      <SectionHead eyebrow="Coast to coast" title="See every place on the map">
        Real listings, real locations, from the Gulf Coast to the Bakken. Tap a
        pin to open the place.
      </SectionHead>

      <Container className="mt-9">
        <div className="h-[460px] overflow-hidden rounded-card border border-line shadow-[0_8px_24px_rgba(16,32,48,0.08)] sm:h-[540px]">
          <ResultsMap listings={listings} />
        </div>
        <div className="mt-6 text-center">
          <Button href="/search" variant="navy" size="lg">
            Search all listings
          </Button>
        </div>
      </Container>
    </section>
  );
}
