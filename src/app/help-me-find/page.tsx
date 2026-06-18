import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LeadForm } from "@/components/lead-form";

export const metadata: Metadata = {
  title: "Help Me Find a Place",
  description:
    "Tell us where the job is and how to reach you, and we will help you find furnished housing nearby.",
};

export default function HelpMeFindPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            For workers
          </p>
          <h1 className="font-display mt-3 text-[40px] font-bold text-navy sm:text-[48px]">
            Help me find a place
          </h1>
          <p className="mx-auto mt-3 max-w-[48ch] text-[17px] text-muted">
            Heading to a job and cannot find the right spot? Tell us where you
            are working and how to reach you. We will help you track down
            furnished housing near the site.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-[560px] rounded-card border border-line bg-white p-6 shadow-[0_8px_24px_rgba(16,32,48,0.08)] sm:p-7">
          <LeadForm />
        </div>
      </Container>
    </section>
  );
}
