import { createClient } from "@supabase/supabase-js";

/**
 * Public (anon/publishable) Supabase client for reading public data ,
 * approved listings, etc. No cookies, so pages using it stay cacheable.
 * RLS policy "approved listings are public" governs what comes back.
 * For authed routes (landlord/admin) use server.ts / client.ts instead.
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
}
