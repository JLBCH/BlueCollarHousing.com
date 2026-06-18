import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ListingBuilder } from "@/components/listings/listing-builder";

export const metadata: Metadata = { title: "Create a Listing" };

// The /dashboard route group is auth-protected by middleware, so this is
// landlord-only. The builder saves to the signed-in owner.
export default function NewListingPage() {
  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-8">
      <Container className="max-w-[820px]">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <h1 className="font-display mt-3 text-[30px] font-bold text-navy sm:text-[36px]">
          List your property
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Fill in the details below. You can save a draft and finish later.
        </p>
        <div className="mt-7">
          <ListingBuilder />
        </div>
      </Container>
    </section>
  );
}
