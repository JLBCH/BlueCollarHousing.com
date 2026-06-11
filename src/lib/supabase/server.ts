import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cookie-bound server client for authenticated server components / route
 * handlers (landlord + admin). For public listing reads use
 * createPublicClient() so pages stay cacheable.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, safe to ignore when middleware
            // refreshes the session.
          }
        },
      },
    },
  );
}
