import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Home, Building2, Tent, Hotel, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Create a Listing" };

const card =
  "flex items-center gap-4 rounded-card border border-line bg-white p-5 text-left shadow-[0_4px_16px_rgba(16,32,48,0.05)] transition hover:border-orange/50 hover:shadow-[0_8px_24px_rgba(16,32,48,0.1)]";

export default async function NewListingChooser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/listings/new");

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-8">
      <Container className="max-w-[680px]">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-display mt-3 text-[30px] font-bold text-navy sm:text-[36px]">What are you listing?</h1>
        <p className="mt-1 text-[15px] text-muted">Pick the option that fits. You can save a draft and finish later.</p>

        <div className="mt-7 grid gap-3">
          <Link href="/dashboard/listings/new/residential" className={card}>
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-orange/12 text-orange">
              <Home className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-navy">Single property — $99/year</span>
              <span className="block text-[13.5px] text-muted">House, apartment, cabin, mobile home, RV spot, room rental, or any single unit.</span>
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted" />
          </Link>

          <div className="mt-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted" />
            <span className="text-[13px] font-bold uppercase tracking-wide text-muted">Commercial — $249/year</span>
          </div>

          <Link href="/dashboard/listings/new/commercial?type=rv_park" className={card}>
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-navy/8 text-navy">
              <Tent className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-navy">RV Park</span>
              <span className="block text-[13.5px] text-muted">Hookups, sites, amenities, and cabins.</span>
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted" />
          </Link>

          <Link href="/dashboard/listings/new/commercial?type=hotel" className={card}>
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-navy/8 text-navy">
              <Hotel className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-navy">Hotel</span>
              <span className="block text-[13.5px] text-muted">Room types, housekeeping, parking, amenities.</span>
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted" />
          </Link>

          <Link href="/dashboard/listings/new/commercial?type=apartment_complex" className={card}>
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-navy/8 text-navy">
              <Building2 className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold text-navy">Multifamily / Apartment Complex</span>
              <span className="block text-[13.5px] text-muted">Furnished units, what&apos;s included, leasing terms.</span>
            </span>
            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
