import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, CheckCircle2, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin · Approval queue" };

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - d) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ done?: string; billing?: string }>;
}) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();

  const { data: pending } = await supabase
    .from("listings")
    .select("id, title, public_area, created_at, owner_id, listing_kind")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  const rows = pending ?? [];

  // Counts for a small at-a-glance strip. "Live" = truly visible (comped or in a
  // good/grace subscription state), not just status=approved.
  const { count: liveCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .or("is_comp.eq.true,subscription_status.in.(active,trialing,past_due)");
  // Approved but never paid — sitting in the pay-after limbo, heading for expiry.
  const { count: awaitingCount } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .eq("is_comp", false)
    .is("stripe_subscription_id", null)
    .not("subscription_status", "in", "(active,trialing,past_due)");

  // Owner names/emails for the queue rows.
  const ownerIds = [...new Set(rows.map((l) => l.owner_id).filter(Boolean))] as string[];
  const { data: profiles } = ownerIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds)
    : { data: [] };
  const owners = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">
              Approval queue
            </h1>
            <p className="mt-1 text-[15px] text-muted">
              {rows.length} pending · {liveCount ?? 0} live · {awaitingCount ?? 0} awaiting payment
            </p>
          </div>
        </div>

        <AdminNav active="queue" />

        {sp.done && (
          <div className="mt-6 flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[14.5px] font-medium text-green-800">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> Decision saved and the owner notified.
          </div>
        )}
        {sp.billing && (
          <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[14.5px] font-medium text-amber-800">
            <Inbox className="h-5 w-5 flex-shrink-0" /> Heads up: the listing was rejected but its Stripe subscription could not be canceled automatically. Cancel it manually in Stripe so the landlord isn’t billed again.
          </div>
        )}

        <div className="mt-8 rounded-card border border-line bg-white p-7 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
          <h2 className="font-display text-[20px] font-bold text-navy">Pending review</h2>

          {rows.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-card border border-dashed border-line py-14 text-center">
              <Inbox className="h-9 w-9 text-muted" />
              <p className="mt-3 text-[15px] text-muted">Nothing waiting. The queue is clear.</p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {rows.map((l) => {
                const owner = l.owner_id ? owners.get(l.owner_id) : null;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/admin/listings/${l.id}`}
                      className="flex items-center justify-between gap-3 py-4 transition hover:opacity-80"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-navy">
                          {l.title || "Untitled listing"}
                        </p>
                        <p className="text-[13px] text-muted">
                          {l.public_area}
                          {owner ? ` · ${owner.full_name || owner.email}` : ""} · {timeAgo(l.created_at)}
                        </p>
                      </div>
                      <span className="flex flex-shrink-0 items-center gap-1 text-[13px] font-semibold text-orange">
                        Review <ChevronRight className="h-4 w-4" />
                      </span>
                    </Link>
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
