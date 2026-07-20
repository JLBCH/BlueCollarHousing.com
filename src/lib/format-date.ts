/**
 * The one place dates get formatted for display, so locale (and any future
 * timezone handling) is fixed once instead of in every page's private helper.
 */
export function formatDate(
  iso: string,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
): string {
  return new Date(iso).toLocaleDateString("en-US", opts);
}
