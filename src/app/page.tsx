import { Hero } from "@/components/home/hero";
import { ExplainerBanner } from "@/components/home/explainer-banner";
import { HomeMap } from "@/components/home/home-map";
import { Quote } from "@/components/home/quote";
import { AudienceSplit } from "@/components/home/audience-split";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ExplainerBanner />
      <HomeMap />
      <Quote />
      <AudienceSplit />
    </>
  );
}
