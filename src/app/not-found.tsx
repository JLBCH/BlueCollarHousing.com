import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

/**
 * Branded 404. Old-site URLs still live in search indexes (the pre-rebuild
 * site was PHP); known ones are redirected in next.config.ts, and anything we
 * couldn't enumerate lands here — so this page routes lost visitors onward
 * instead of dead-ending them on the default error screen.
 */
export default function NotFound() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-[560px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Page not found
          </p>
          <h1 className="font-display mt-3 text-[40px] font-bold text-navy sm:text-[48px]">
            That page has moved
          </h1>
          <p className="mx-auto mt-3 max-w-[44ch] text-[17px] text-muted">
            We recently rebuilt BlueCollarHousing, so some older links changed.
            Everything is still here — pick up where you left off:
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/search" variant="orange">
              Find housing
            </Button>
            <Button href="/landlords" variant="navy">
              For landlords
            </Button>
          </div>
          <p className="mt-6 text-[14.5px] text-muted">
            Or go to the{" "}
            <Link href="/" className="font-semibold text-orange hover:underline">
              homepage
            </Link>{" "}
            ·{" "}
            <Link href="/contact" className="font-semibold text-orange hover:underline">
              contact us
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
