/** URL-safe slug from a title. Falls back to "listing" when empty. */
export function slugify(s: string, max = 60): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max) || "listing"
  );
}
