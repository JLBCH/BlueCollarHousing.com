import { Hero } from "@/components/home/hero";
import { ExplainerBanner } from "@/components/home/explainer-banner";
import { HomeMap } from "@/components/home/home-map";
import { Quote } from "@/components/home/quote";
import { AudienceSplit } from "@/components/home/audience-split";

// The homepage is static for speed, but the map section pins live listings —
// refresh it hourly as a backstop. (Approvals, payments and deletions also
// revalidate it on the spot.)
export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <ExplainerBanner />
      <Quote />
      <HomeMap />
      <AudienceSplit />
    </>
  );
}
