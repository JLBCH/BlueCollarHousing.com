import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { CommercialBuilder } from "@/components/listings/commercial-builder";
import { COMMERCIAL_FORMS, type CommercialType } from "@/lib/listings/commercial-forms";

export const metadata: Metadata = { title: "Create a Commercial Listing" };

export default async function NewCommercialPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/listings/new");

  const { type } = await searchParams;
  if (!type || !(type in COMMERCIAL_FORMS)) redirect("/dashboard/listings/new");
  const form = COMMERCIAL_FORMS[type as CommercialType];

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-8">
      <Container className="max-w-[820px]">
        <Link href="/dashboard/listings/new" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-muted hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="font-display mt-3 text-[30px] font-bold text-navy sm:text-[36px]">{form.header}</h1>
        <p className="mt-1 text-[15px] text-muted">{form.blurb}</p>
        <div className="mt-7">
          <CommercialBuilder type={form.type} />
        </div>
      </Container>
    </section>
  );
}
