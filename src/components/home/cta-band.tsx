import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="bg-navy text-white">
      <Container className="flex flex-wrap items-center justify-between gap-7 py-12">
        <div>
          <h2 className="font-display max-w-[18ch] text-[30px] font-bold sm:text-[34px]">
            Own a property? Put it to work.
          </h2>
          <p className="mt-2 max-w-[50ch] text-[16px] text-[#aebfd0]">
            List your place in front of thousands of verified blue-collar
            workers looking for a clean, comfortable place near the job.
          </p>
        </div>
        <Button href="/list-your-property" variant="orange" size="lg">
          List Your Property
        </Button>
      </Container>
    </section>
  );
}
