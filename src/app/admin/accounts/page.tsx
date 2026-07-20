import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { DeleteAccountButton } from "@/components/admin/delete-account-button";

export const metadata: Metadata = { title: "Admin · Landlords" };

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-white p-4">
      <p className="text-[12px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-[26px] font-bold text-navy">{value}</p>
      {hint && <p className="text-[11.5px] text-muted">{hint}</p>}
    </div>
  );
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { supabase } = await requireAdmin();
  const query = (q ?? "").trim();

  // KPI counts.
  const live = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");
  const pending = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  // Landlords (+ optional name/email search). Strip PostgREST-significant
  // characters from the term before interpolating into .or() — a comma or paren
  // would otherwise break out of the ilike and inject extra filter conditions.
  const safeQuery = query.replace(/[,()%*\\:]/g, "").slice(0, 80).trim();
  let landlordQuery = supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, created_at")
    .order("created_at", { ascending: false });
  if (safeQuery) {
    landlordQuery = landlordQuery.or(`full_name.ilike.%${safeQuery}%,email.ilike.%${safeQuery}%`);
  }
  const { data: landlords } = await landlordQuery;
  const rows = landlords ?? [];

  // Listing counts per owner (small dataset — aggregate in app).
  const { data: allListings } = await supabase
    .from("listings")
    .select("owner_id, status")
    .not("owner_id", "is", null);
  const counts = new Map<string, { live: number; pending: number }>();
  for (const l of allListings ?? []) {
    const c = counts.get(l.owner_id) ?? { live: 0, pending: 0 };
    if (l.status === "approved") c.live += 1;
    if (l.status === "pending") c.pending += 1;
    counts.set(l.owner_id, c);
  }

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>

        <AdminNav active="accounts" />

        {/* KPI strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Kpi label="Live" value={String(live.count ?? 0)} />
          <Kpi label="Pending" value={String(pending.count ?? 0)} />
          <Kpi label="Landlords" value={String(rows.filter((r) => r.role === "landlord").length)} />
          <Kpi label="Paying" value="—" hint="after Stripe" />
          <Kpi label="MRR" value="—" hint="after Stripe" />
        </div>

        {/* Landlords */}
        <div className="mt-8 rounded-card border border-line bg-white p-7 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-[20px] font-bold text-navy">Landlords</h2>
            <form action="/admin/accounts" method="get" className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5">
                <Search className="h-4 w-4 text-muted" />
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search name or email"
                  className="w-[180px] bg-transparent text-[14px] text-ink outline-none placeholder:text-[#9aa6b3]"
                />
              </div>
              {query && (
                <Link href="/admin/accounts" className="text-[13px] font-semibold text-orange hover:underline">
                  Clear
                </Link>
              )}
            </form>
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted">No accounts match “{query}”.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3 font-bold">Name</th>
                    <th className="py-2 pr-3 font-bold">Email</th>
                    <th className="py-2 pr-3 font-bold">Listings</th>
                    <th className="py-2 pr-3 font-bold">Role</th>
                    <th className="py-2 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => {
                    const c = counts.get(r.id) ?? { live: 0, pending: 0 };
                    return (
                      <tr key={r.id}>
                        <td className="py-2.5 pr-3 font-semibold text-navy">{r.full_name || "—"}</td>
                        <td className="py-2.5 pr-3 text-ink">
                          {r.email}
                          {r.phone ? <span className="block text-[12px] text-muted">{r.phone}</span> : null}
                        </td>
                        <td className="py-2.5 pr-3 text-ink">
                          {c.live} live{c.pending ? ` · ${c.pending} pending` : ""}
                        </td>
                        <td className="py-2.5 pr-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                              r.role === "admin" ? "bg-navy text-white" : "bg-bg-band text-[#3a4a5a]"
                            }`}
                          >
                            {r.role}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          {r.role !== "admin" && (
                            <DeleteAccountButton
                              userId={r.id}
                              email={r.email}
                              listingCount={c.live + c.pending}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
