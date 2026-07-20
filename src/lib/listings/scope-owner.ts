import type { createClient } from "@/lib/supabase/server";

/** Owner id to scope a listing mutation to — null for admins, who may edit or
 *  delete ANY listing (the admin RLS policies + status guard already permit it).
 *  Owners are scoped to their own id. */
export async function scopeOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).single();
  return data?.role === "admin" ? null : userId;
}
