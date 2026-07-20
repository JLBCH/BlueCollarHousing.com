"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin";

type Result = { ok: boolean; error?: string };

/** Mark a renter report handled (or reopen it). App-level admin check on top
 *  of RLS: an RLS-filtered update that matches zero rows returns NO error, so
 *  without this a non-admin caller would get a false { ok: true }. */
export async function setReportResolved(id: string, resolved: boolean): Promise<Result> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { error } = await ctx.supabase
    .from("listing_reports")
    .update({ resolved, resolved_at: resolved ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reports");
  return { ok: true };
}
