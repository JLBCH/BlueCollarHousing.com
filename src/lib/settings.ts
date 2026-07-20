import { createPublicClient } from "@/lib/supabase/public";

/**
 * Site settings (key/value, admin-edited). Reads fall back to the built-in
 * default on any error — including the table not existing yet — so the site
 * never breaks on a missing setting.
 */

export const SEARCH_RADIUS_DEFAULT_MI = 100;
export const SEARCH_RADIUS_MIN_MI = 10;
export const SEARCH_RADIUS_MAX_MI = 300;

export function clampRadius(n: number): number {
  if (!Number.isFinite(n)) return SEARCH_RADIUS_DEFAULT_MI;
  return Math.min(SEARCH_RADIUS_MAX_MI, Math.max(SEARCH_RADIUS_MIN_MI, Math.round(n)));
}

/** Raw setting value by key, or null on any failure (missing table included).
 *  Add new settings as thin typed wrappers like getSearchRadiusMi below. */
async function getSetting(key: string): Promise<unknown> {
  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || data?.value == null) return null;
    return data.value;
  } catch {
    return null;
  }
}

/** Search proximity radius in miles (admin-tunable; Joe's request). */
export async function getSearchRadiusMi(): Promise<number> {
  const v = await getSetting("search_radius_mi");
  return v == null ? SEARCH_RADIUS_DEFAULT_MI : clampRadius(Number(v));
}
