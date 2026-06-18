import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Worker FAQ",
  description:
    "Answers for workers looking for furnished housing near the job: is it free, contacting landlords, how long you can stay, furnishings, paying rent and more.",
};

// Worker FAQ content.
const FAQS: { q: string; a: string[] }[] = [
  {
    q: "Is this free to use?",
    a: [
      "Yes. Browsing BlueCollarHousing is completely free. No account, no sign up, no fees, ever.",
    ],
  },
  {
    q: "Do I need to create an account to contact a landlord?",
    a: [
      "No. Find a place you like and contact the landlord directly, call, text or email, depending on what the listing shows. Some landlords also offer a contact form if they prefer not to list their number.",
    ],
  },
  {
    q: "How long can I stay?",
    a: [
      "That is between you and the landlord. Most of these rentals are set up for workers who need a place for weeks or months at a time, not a weekend. Many landlords prefer weekly or monthly arrangements, and most do not require a long term lease.",
    ],
  },
  {
    q: "Are these places furnished?",
    a: [
      "Most listings are furnished or semi furnished, ready to move into without buying furniture or setting up utilities. RV spots and camper pads are also available for workers who bring their own rig. Check each listing for specifics on what is included.",
    ],
  },
  {
    q: "How do I pay rent?",
    a: [
      "That is worked out directly with the landlord, most accept Cash, Zelle, Venmo, CashApp or card, and many prefer weekly payments. Check the listing or ask the landlord what they accept.",
    ],
  },
  {
    q: "Is BlueCollarHousing legit?",
    a: [
      "Yes. BlueCollarHousing is American owned and operated. No foreign call centers, when you call, you are talking to us directly. Every listing is reviewed before it goes live. We are landlords ourselves, we built this site because we know what it is like to be stuck in a hotel for months with no good options.",
    ],
  },
];

export default function WorkerFaqPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-[800px]">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Worker FAQ
          </p>
          <h1 className="font-display mt-3 text-[36px] font-bold text-navy sm:text-[44px]">
            Questions from workers
          </h1>
        </div>

        <div className="mt-10 grid gap-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-card border border-line bg-white px-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16px] font-semibold text-navy">
                {q}
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-3 pb-5">
                {a.map((para, i) => (
                  <p key={i} className="text-[14.5px] leading-relaxed text-[#3a4a5a]">
                    {para}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/search" variant="orange" size="lg">
            Find Housing
          </Button>
        </div>
      </Container>
    </section>
  );
}
