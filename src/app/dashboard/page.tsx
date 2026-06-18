import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, LogOut, Home, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-bg-band text-[#3a4a5a]",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, status, public_area, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const firstName = (profile?.full_name || "").trim().split(" ")[0];
  const rows = listings ?? [];

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">
              {firstName ? `Welcome, ${firstName}` : "Welcome"}
            </h1>
            <p className="mt-1 text-[15px] text-muted">{user.email}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-semibold text-navy hover:border-navy/40"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>

        {sp.created && (
          <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14.5px] font-medium text-green-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            Listing saved. It is in your list below.
          </div>
        )}

        <div className="mt-8 rounded-card border border-line bg-white p-7 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[20px] font-bold text-navy">Your listings</h2>
            {rows.length > 0 && (
              <Button href="/dashboard/listings/new" variant="orange">
                <Plus className="h-[18px] w-[18px]" /> New listing
              </Button>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-card border border-dashed border-line py-14 text-center">
              <Home className="h-9 w-9 text-muted" />
              <p className="mt-3 max-w-[40ch] text-[15px] text-muted">
                You have not created any listings yet. Add your property to get it in
                front of traveling workers who need it.
              </p>
              <Button href="/dashboard/listings/new" variant="orange" className="mt-5">
                <Plus className="h-[18px] w-[18px]" /> Create a listing
              </Button>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {rows.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-navy">{l.title || "Untitled listing"}</p>
                    <p className="text-[13px] text-muted">{l.public_area}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize ${STATUS_STYLES[l.status] ?? "bg-bg-band text-[#3a4a5a]"}`}>
                    {l.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
