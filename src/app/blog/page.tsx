import type { Metadata } from "next";
import { Newspaper } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "News, guides and housing tips for blue-collar workers and landlords. Coming soon.",
};

export default function BlogPage() {
  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-[680px] text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
          Blog
        </p>
        <h1 className="font-display mt-3 text-[40px] font-bold text-navy sm:text-[48px]">
          Guides and housing tips
        </h1>

        <div className="mt-10 flex flex-col items-center rounded-card border border-dashed border-line bg-bg-soft px-6 py-16">
          <Newspaper className="h-11 w-11 text-muted" />
          <h2 className="font-display mt-4 text-[24px] font-bold text-navy">
            No posts yet
          </h2>
          <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted">
            We are putting together guides on finding housing near the job,
            refinery and turnaround tips, and advice for landlords. Check back
            soon.
          </p>
          <Button href="/search" variant="navy" className="mt-6">
            Find housing in the meantime
          </Button>
        </div>
      </Container>
    </section>
  );
}
