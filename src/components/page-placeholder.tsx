import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * Branded "coming soon" page for routes that are not built yet, so links
 * across the site always resolve.
 */
export function PagePlaceholder({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <section className="py-24 md:py-32">
      <Container className="max-w-[640px] text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
          Coming soon
        </p>
        <h1 className="font-display mt-3 text-[40px] font-bold text-navy md:text-[48px]">
          {title}
        </h1>
        <p className="mx-auto mt-4 text-[17px] text-muted">
          {note ?? "This part of the site is being built. Check back shortly."}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/" variant="navy">
            Back home
          </Button>
          <Button href="/search" variant="outline">
            Find Housing
          </Button>
        </div>
      </Container>
    </section>
  );
}
