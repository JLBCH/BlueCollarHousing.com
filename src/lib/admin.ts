import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate an admin-only page or action: requires a signed-in user whose profile
 * role is 'admin'. Non-admins are bounced (to login or their own dashboard).
 * Returns the authed Supabase client + user for the caller to reuse.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return { supabase, user };
}

/**
 * Non-redirecting admin gate for SERVER ACTIONS (they return errors instead of
 * navigating). One shared implementation on purpose: RLS still backs every
 * admin table, but an RLS-filtered write that matches zero rows returns NO
 * error, so an action without this check would report false success to
 * non-admins.
 */
export async function adminAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "You must be signed in." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { ok: false as const, error: "Admins only." };
  return { ok: true as const, supabase, user };
}
