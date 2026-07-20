/** Supabase Storage bucket holding listing photos. */
export const BUCKET = "listing-photos";

/** Extract the storage object path from a public photo URL, or null. */
export function storagePath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx === -1 ? null : url.slice(idx + marker.length);
}
