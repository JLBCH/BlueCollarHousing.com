"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { accountDeleteError } from "@/lib/account-delete";

/**
 * Permanently delete a landlord account — the auth user (which cascades their
 * profile row) plus any listings they own. For clearing out spam/bot signups
 * that slip past the approval queue. Admin-gated and irreversible.
 */
export async function deleteAccount(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const { data: target } = await ctx.supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  const guardErr = accountDeleteError(ctx.user.id, target);
  if (guardErr) return { ok: false, error: guardErr };

  // Service-role: bypass RLS to remove the account cleanly. Delete the owner's
  // listings first — listings.owner_id is ON DELETE SET NULL, so deleting the
  // user alone would orphan any listings (left public with no owner).
  const admin = createAdminClient();
  const { error: listErr } = await admin.from("listings").delete().eq("owner_id", userId);
  if (listErr) return { ok: false, error: listErr.message };

  // Deleting the auth user cascades the profile (profiles.id refs auth.users).
  const { error: delErr } = await admin.auth.admin.deleteUser(userId);
  if (delErr) return { ok: false, error: delErr.message };

  revalidatePath("/admin/accounts");
  return { ok: true };
}
