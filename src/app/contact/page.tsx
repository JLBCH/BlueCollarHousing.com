import type { Metadata } from "next";
import { Phone, Mail } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/contact-form";
import { RevealPhone } from "@/components/reveal-phone";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with BlueCollarHousing. Send a message or call us directly.",
};

export default function ContactPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-[640px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Contact
          </p>
          <h1 className="font-display mt-3 text-[40px] font-bold text-navy sm:text-[48px]">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-[48ch] text-[17px] text-muted">
            Questions about a listing or your account? Send a message, or just
            call. We are real people and happy to help.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-[920px] gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-card border border-line bg-white p-6 sm:p-7">
            <ContactForm />
          </div>

          <aside className="grid content-start gap-4">
            <div className="flex items-center gap-4 rounded-card border border-line bg-white p-5">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-navy text-orange-tint">
                <Phone className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold uppercase tracking-wide text-muted">
                  Call or text
                </span>
                <RevealPhone encoded="MTI4MTk1Nzk1NDM=" display="(281) 957-9543" />
              </span>
            </div>

            <div className="flex items-center gap-4 rounded-card border border-line bg-white p-5">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-navy text-orange-tint">
                <Mail className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold uppercase tracking-wide text-muted">
                  Email
                </span>
                <span className="block text-[15px] font-semibold text-navy">
                  Use the form, we will reply by email
                </span>
              </span>
            </div>

          </aside>
        </div>
      </Container>
    </section>
  );
}
