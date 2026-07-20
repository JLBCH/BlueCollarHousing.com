import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { billingState } from "@/lib/listings/billing-state";
import { stripe } from "@/lib/stripe";
import { kindLabel } from "@/lib/listings/format";
import { STATUS_STYLES } from "@/lib/listings/status-styles";
import { cancelEffectiveAt, isCancelScheduled } from "@/lib/stripe-cancel";
import { formatDate } from "@/lib/format-date";

export const metadata: Metadata = { title: "Admin · All listings" };

/** Payment/workflow badge for the table. */
function badgeFor(l: {
  status: string;
  is_comp: boolean;
  subscription_status: string;
  stripe_subscription_id: string | null;
}): { label: string; cls: string } {
  if (l.status !== "approved") {
    return { label: l.status, cls: STATUS_STYLES[l.status] ?? "bg-bg-band text-[#3a4a5a]" };
  }
  const bs = billingState({
    status: l.status,
    subscriptionStatus: l.subscription_status,
    isComp: l.is_comp,
    hasSubscription: !!l.stripe_subscription_id,
  });
  const map: Record<string, { label: string; cls: string }> = {
    live: { label: l.is_comp ? "Live · free" : "Live · paid", cls: "bg-green-100 text-green-800" },
    past_due: { label: "Payment failing", cls: "bg-amber-100 text-amber-800" },
    awaiting_payment: { label: "Awaiting payment", cls: "bg-amber-100 text-amber-800" },
    lapsed: { label: "Lapsed", cls: "bg-red-100 text-red-700" },
    none: { label: "approved", cls: STATUS_STYLES.approved },
  };
  return map[bs];
}

export default async function AdminAllListingsPage() {
  const { supabase } = await requireAdmin();

  const { data: listings } = await supabase
    .from("listings")
    .select(
      "id, title, status, is_comp, subscription_status, stripe_subscription_id, coupon_code, public_area, owner_id, reviewed_at, listing_kind, property_type, parent_listing_id",
    )
    .order("created_at", { ascending: false });
  const rows = listings ?? [];
  // Multi-unit marking: a listing is PRIMARY if others link to it, ADDITIONAL if
  // it links to a primary.
  const parentIds = new Set(rows.map((l) => l.parent_listing_id).filter(Boolean));

  const ownerIds = [...new Set(rows.map((l) => l.owner_id).filter(Boolean))] as string[];
  const { data: profiles } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
    : { data: [] };
  const owners = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Paid listings renew on their Stripe billing date, which we don't store — pull
  // the current period end live for the "Expires" column. Best-effort per sub:
  // a Stripe hiccup falls back to "Active" and never breaks the page.
  const subIds = [
    ...new Set(rows.map((l) => l.stripe_subscription_id).filter(Boolean)),
  ] as string[];
  const periods = new Map<string, { end: number; cancel: boolean }>();
  await Promise.allSettled(
    subIds.map(async (id) => {
      const sub = await stripe.subscriptions.retrieve(id);
      // Recent Stripe API versions moved current_period_end onto the sub items.
      const end = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)
        ?.current_period_end;
      // Newer Stripe API versions schedule cancels via cancel_at and leave
      // cancel_at_period_end false — the helper handles both shapes, and the
      // explicit cancel_at date (when set) is the one that's true.
      const cancel = isCancelScheduled(sub);
      if (end) periods.set(id, { end: (cancel ? cancelEffectiveAt(sub, end) : end) ?? end, cancel });
    }),
  );

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[1040px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <p className="mt-1 text-[15px] text-muted">{rows.length} listings · click any to edit, delete, or review.</p>
        <AdminNav active="listings" />

        <div className="mt-8 overflow-x-auto rounded-card border border-line bg-white shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
          <table className="w-full min-w-[820px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-bold">Listing</th>
                <th className="px-3 py-3 font-bold">Owner</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">Expires</th>
                <th className="px-3 py-3 font-bold">Coupon</th>
                <th className="px-3 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((l) => {
                const owner = l.owner_id ? owners.get(l.owner_id) : null;
                const badge = badgeFor(l);
                const period = l.stripe_subscription_id ? periods.get(l.stripe_subscription_id) : null;
                // "Expires" only applies to approved-but-unpaid listings (the
                // 28-day pay window). Comped + paid listings don't auto-expire, so
                // show "Never" instead of a blank "—" that reads as broken.
                const bs =
                  l.status === "approved"
                    ? billingState({
                        status: l.status,
                        subscriptionStatus: l.subscription_status,
                        isComp: l.is_comp,
                        hasSubscription: !!l.stripe_subscription_id,
                      })
                    : null;
                const fmt = (d: Date) => formatDate(d.toISOString());
                let expires = "—";
                if (bs === "awaiting_payment" && l.reviewed_at) {
                  const end = new Date(new Date(l.reviewed_at).getTime() + 28 * 86_400_000);
                  const days = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000));
                  expires = `${fmt(end)} · ${days}d`;
                } else if (bs === "lapsed") {
                  expires = "Expired";
                } else if (bs === "live") {
                  // Paid: show the Stripe renewal/end date. Comped (free): no expiry.
                  const p = l.stripe_subscription_id ? periods.get(l.stripe_subscription_id) : null;
                  if (l.is_comp) expires = "Never";
                  else if (p) expires = `${p.cancel ? "Ends " : "Renews "}${fmt(new Date(p.end * 1000))}`;
                  else expires = "Active";
                }
                return (
                  <tr key={l.id} className="hover:bg-bg-soft">
                    <td className="px-5 py-3">
                      {parentIds.has(l.id) && (
                        <span className="mr-2 rounded bg-navy px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Primary</span>
                      )}
                      {l.parent_listing_id && (
                        <span className="mr-2 rounded bg-orange px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Add-on unit</span>
                      )}
                      <Link href={`/admin/listings/${l.id}`} className="font-semibold text-navy hover:underline">
                        {l.title || "Untitled listing"}
                      </Link>
                      <div className="text-[12px] text-muted">{kindLabel({ listingKind: l.listing_kind, propertyType: l.property_type })} · {l.public_area}</div>
                    </td>
                    <td className="px-3 py-3 text-ink">{owner?.full_name || owner?.email || "—"}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold capitalize ${badge.cls}`}>{badge.label}</span>
                      {period?.cancel && (
                        <span className="ml-1.5 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700">Canceled — ends {fmt(new Date(period.end * 1000))}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-ink">{expires}</td>
                    <td className="px-3 py-3 font-mono text-[13px] text-ink">{l.coupon_code || "—"}</td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/admin/listings/${l.id}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange hover:underline">
                        Open <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
