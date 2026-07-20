"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin";
import { clampRadius, SEARCH_RADIUS_MIN_MI, SEARCH_RADIUS_MAX_MI } from "@/lib/settings";

type Result = { ok: boolean; error?: string };

/** Save the search proximity radius (miles). App-level admin check on top of
 *  the RLS write policies (upsert against RLS reports an error rather than a
 *  silent zero-row write, but the shared gate keeps behavior uniform). */
export async function saveSearchRadius(miles: number): Promise<Result> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const n = Number(miles);
  if (!Number.isFinite(n) || n < SEARCH_RADIUS_MIN_MI || n > SEARCH_RADIUS_MAX_MI) {
    return {
      ok: false,
      error: `Radius must be between ${SEARCH_RADIUS_MIN_MI} and ${SEARCH_RADIUS_MAX_MI} miles.`,
    };
  }
  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert(
      { key: "search_radius_mi", value: clampRadius(n), updated_at: new Date().toISOString() },
      { onConflict: "key" },
    );
  if (error) return { ok: false, error: error.message };
  revalidatePath("/search");
  revalidatePath("/admin/settings");
  return { ok: true };
}
