import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { SettingsForm } from "@/components/admin/settings-form";
import {
  getSearchRadiusMi,
  SEARCH_RADIUS_MIN_MI,
  SEARCH_RADIUS_MAX_MI,
} from "@/lib/settings";

export const metadata: Metadata = { title: "Admin · Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const radius = await getSearchRadiusMi();

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <AdminNav active="settings" />

        <div className="mt-6 rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
          <h2 className="font-display text-[18px] font-bold text-navy">Site settings</h2>
          <SettingsForm
            initialRadius={radius}
            min={SEARCH_RADIUS_MIN_MI}
            max={SEARCH_RADIUS_MAX_MI}
          />
        </div>
      </Container>
    </section>
  );
}
