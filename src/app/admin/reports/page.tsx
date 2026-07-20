import type { Metadata } from "next";
import Link from "next/link";
import { Flag } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReportRowActions } from "@/components/admin/report-row-actions";
import { REPORT_REASON_LABELS } from "@/lib/reports";
import { formatDate } from "@/lib/format-date";

export const metadata: Metadata = { title: "Admin · Reports" };

type ReportRow = {
  id: string;
  created_at: string;
  listing_slug: string;
  listing_title: string;
  reason: string;
  note: string;
  reporter_name: string;
  reporter_email: string;
  resolved: boolean;
};

function when(iso: string): string {
  return formatDate(iso, { month: "short", day: "numeric" });
}

/** Renter-submitted listing reports (dead contact info etc.) — Joe reviews
 *  these to catch stale legacy listings he can't verify himself. */
export default async function ReportsPage() {
  const { supabase } = await requireAdmin();

  const { data } = await supabase
    .from("listing_reports")
    .select(
      "id, created_at, listing_slug, listing_title, reason, note, reporter_name, reporter_email, resolved",
    )
    .order("resolved", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as ReportRow[];
  const open = rows.filter((r) => !r.resolved);
  const closed = rows.filter((r) => r.resolved);

  const table = (list: ReportRow[]) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
            <th className="py-2 pr-3 font-bold">When</th>
            <th className="py-2 pr-3 font-bold">Listing</th>
            <th className="py-2 pr-3 font-bold">Reason</th>
            <th className="py-2 pr-3 font-bold">Details</th>
            <th className="py-2 font-bold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {list.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="py-2.5 pr-3 whitespace-nowrap text-muted">{when(r.created_at)}</td>
              <td className="py-2.5 pr-3">
                <Link
                  href={`/listings/${r.listing_slug}`}
                  className="font-semibold text-navy underline hover:text-orange"
                >
                  {r.listing_title || r.listing_slug}
                </Link>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                {REPORT_REASON_LABELS[r.reason as keyof typeof REPORT_REASON_LABELS] ?? r.reason}
              </td>
              <td className="max-w-[360px] py-2.5 pr-3 text-[13.5px] text-[#3a4a5a]">
                {r.note || <span className="text-muted">—</span>}
                {(r.reporter_name || r.reporter_email) && (
                  <span className="mt-0.5 block text-[12px] text-muted">
                    From {r.reporter_name || "anonymous"}
                    {r.reporter_email ? ` · ${r.reporter_email}` : ""}
                  </span>
                )}
              </td>
              <td className="py-2.5 whitespace-nowrap text-right">
                <ReportRowActions id={r.id} resolved={r.resolved} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <AdminNav active="reports" />

        <div className="mt-6 grid gap-5">
          <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
            <h2 className="font-display text-[18px] font-bold text-navy">
              Open reports {open.length > 0 && <span className="text-orange">({open.length})</span>}
            </h2>
            {open.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-card border border-dashed border-line py-12 text-center">
                <Flag className="h-9 w-9 text-muted" />
                <p className="mt-3 text-[14px] text-muted">
                  No open reports. When a renter flags a listing (bad contact info,
                  property gone), it shows up here.
                </p>
              </div>
            ) : (
              table(open)
            )}
          </div>

          {closed.length > 0 && (
            <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
              <h2 className="font-display text-[18px] font-bold text-navy">Handled</h2>
              {table(closed)}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
