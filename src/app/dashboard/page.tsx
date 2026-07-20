import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Home, CheckCircle2, AlertCircle, Inbox } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ListingActions } from "@/components/listings/listing-actions";
import { billingState } from "@/lib/listings/billing-state";
import { STATUS_STYLES } from "@/lib/listings/status-styles";
import { isCommercial } from "@/lib/listings/types";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; submitted?: string; saved?: string; subscribed?: string; canceled?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, slug, title, status, public_area, created_at, review_note, subscription_status, is_comp, stripe_subscription_id, reviewed_at, property_type, parent_listing_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const firstName = (profile?.full_name || "").trim().split(" ")[0];
  const rows = listings ?? [];

  // Multi-unit grouping: a listing is PRIMARY if others link to it, ADDITIONAL if
  // it links to a primary. groupSize counts the primary + its units (cap 6).
  const parentIds = new Set(rows.map((l) => l.parent_listing_id).filter(Boolean));
  const groupSize = new Map<string, number>();
  for (const l of rows) {
    const key = (l.parent_listing_id ?? l.id) as string;
    groupSize.set(key, (groupSize.get(key) ?? 0) + 1);
  }

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
          {/* Sign out lives in the global header; only the admin entry point
              is page-specific here. */}
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-semibold text-navy hover:border-navy/40"
            >
              <Inbox className="h-4 w-4" /> Admin queue
            </Link>
          )}
        </div>

        {sp.canceled ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[14.5px] font-medium text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            Checkout canceled — no payment was taken. Your listing is not published yet; use “Pay to publish” when you’re ready.
          </div>
        ) : (sp.created || sp.submitted || sp.saved || sp.subscribed) ? (
          <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14.5px] font-medium text-green-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            {sp.subscribed
              ? "Payment received — your approved listing is now live. Thank you!"
              : sp.submitted
                ? "Your listing has been submitted for approval. Please check your email and dashboard frequently — we'll get you live ASAP."
                : sp.created
                  ? "Draft saved. It's in your list below — submit it for approval when you're ready."
                  : "Changes saved."}
          </div>
        ) : null}

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
              {rows.map((l) => {
                const hasSub = !!l.stripe_subscription_id;
                const isSecondary = !!l.parent_listing_id;
                const isPrimary = parentIds.has(l.id);
                const atUnitCap = (groupSize.get((l.parent_listing_id ?? l.id) as string) ?? 1) >= 6;
                const additionalUnits = isPrimary ? (groupSize.get(l.id as string) ?? 1) - 1 : 0;
                const bs = billingState({
                  status: l.status,
                  subscriptionStatus: l.subscription_status,
                  isComp: l.is_comp,
                  hasSubscription: hasSub,
                });
                // Days until an unpaid approval expires (cron reverts to draft at 30).
                const daysLeft =
                  bs === "awaiting_payment" && l.reviewed_at
                    ? Math.ceil(28 - (Date.now() - new Date(l.reviewed_at).getTime()) / 86_400_000)
                    : null;
                const badge =
                  bs === "live"
                    ? { label: "Live", cls: "bg-green-100 text-green-800" }
                    : bs === "past_due"
                      ? { label: "Payment failed", cls: "bg-amber-100 text-amber-800" }
                      : bs === "awaiting_payment"
                        ? { label: "Awaiting payment", cls: "bg-amber-100 text-amber-800" }
                        : bs === "lapsed"
                          ? { label: "Subscription lapsed", cls: "bg-red-100 text-red-700" }
                          : { label: l.status, cls: STATUS_STYLES[l.status] ?? "bg-bg-band text-[#3a4a5a]" };
                return (
                <li key={l.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <div className="min-w-0">
                      {isPrimary && (
                        <span className="mb-1 inline-block rounded bg-navy px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
                          Primary listing
                        </span>
                      )}
                      {isSecondary && (
                        <span className="mb-1 inline-block rounded bg-orange px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">
                          Additional unit
                        </span>
                      )}
                      <p className="truncate text-[15px] font-semibold text-navy">{l.title || "Untitled listing"}</p>
                      <p className="text-[13px] text-muted">{l.public_area}</p>
                      {l.status === "rejected" && l.review_note && (
                        <p className="mt-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[12.5px] text-red-700">
                          <span className="font-semibold">Needs changes:</span> {l.review_note}
                        </p>
                      )}
                      {bs === "awaiting_payment" && (
                        <p className="mt-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-[12.5px] text-amber-800">
                          <span className="font-semibold">Approved!</span> Complete checkout to publish — it goes live as soon as you pay.
                          {daysLeft != null && daysLeft <= 7 && (
                            <> {" "}<span className="font-semibold">Approval expires in {Math.max(daysLeft, 0)} day{daysLeft === 1 ? "" : "s"}.</span></>
                          )}
                        </p>
                      )}
                      {bs === "past_due" && (
                        <p className="mt-1 rounded-md bg-amber-50 px-2.5 py-1.5 text-[12.5px] text-amber-800">
                          <span className="font-semibold">Payment failed.</span> Your listing is still live while we retry — update your card to keep it up.
                        </p>
                      )}
                      {bs === "lapsed" && (
                        <p className="mt-1 rounded-md bg-red-50 px-2.5 py-1.5 text-[12.5px] text-red-700">
                          <span className="font-semibold">Your subscription ended</span> so this listing is offline. Reactivate or start a new plan to bring it back.
                        </p>
                      )}
                    </div>
                  </div>
                  <ListingActions
                    id={l.id}
                    status={l.status}
                    subscriptionStatus={l.subscription_status}
                    isComp={l.is_comp}
                    hasSubscription={hasSub}
                    expiresInDays={daysLeft ?? undefined}
                    isResidential={!isCommercial(l.property_type)}
                    isSecondary={isSecondary}
                    atUnitCap={atUnitCap}
                    additionalUnits={additionalUnits}
                  />
                </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
