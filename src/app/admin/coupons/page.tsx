import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { stripe } from "@/lib/stripe";
import { AdminNav } from "@/components/admin/admin-nav";
import { CouponForm } from "@/components/admin/coupon-form";
import { DeactivateButton } from "@/components/admin/deactivate-button";

export const metadata: Metadata = { title: "Admin · Coupons" };

export default async function CouponsPage() {
  await requireAdmin();

  let promos: Awaited<ReturnType<typeof stripe.promotionCodes.list>>["data"] = [];
  try {
    const res = await stripe.promotionCodes.list({ limit: 100, expand: ["data.promotion.coupon"] });
    promos = res.data;
  } catch {
    // Stripe unreachable — show the form anyway.
  }

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <AdminNav active="coupons" />

        <div className="mt-6 grid gap-5">
          <CouponForm />

          <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
            <h2 className="font-display text-[18px] font-bold text-navy">Codes</h2>
            {promos.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-card border border-dashed border-line py-12 text-center">
                <Ticket className="h-9 w-9 text-muted" />
                <p className="mt-3 text-[14px] text-muted">No coupon codes yet. Create one above.</p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                      <th className="py-2 pr-3 font-bold">Code</th>
                      <th className="py-2 pr-3 font-bold">Discount</th>
                      <th className="py-2 pr-3 font-bold">Used</th>
                      <th className="py-2 pr-3 font-bold">Status</th>
                      <th className="py-2 font-bold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {promos.map((p) => {
                      const couponRef = p.promotion?.coupon;
                      const coupon = couponRef && typeof couponRef === "object" ? couponRef : null;
                      const pct = coupon?.percent_off ?? 0;
                      const dur = coupon?.duration === "forever" ? "every year" : "first year";
                      return (
                        <tr key={p.id}>
                          <td className="py-2.5 pr-3 font-mono font-semibold text-navy">
                            {p.code}
                            {(p.metadata?.restrict_email || p.expires_at) && (
                              <div className="mt-0.5 font-sans text-[11px] font-normal text-muted">
                                {p.metadata?.restrict_email && <span>🔒 {p.metadata.restrict_email}</span>}
                                {p.metadata?.restrict_email && p.expires_at ? " · " : ""}
                                {p.expires_at && <span>expires {new Date(p.expires_at * 1000).toLocaleDateString()}</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 pr-3 text-ink">
                            {pct}% off · {dur}
                          </td>
                          <td className="py-2.5 pr-3 text-ink">{p.times_redeemed}</td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                                p.active ? "bg-green-100 text-green-800" : "bg-bg-band text-[#3a4a5a]"
                              }`}
                            >
                              {p.active ? "active" : "off"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">{p.active && <DeactivateButton id={p.id} />}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
