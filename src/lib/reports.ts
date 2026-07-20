/**
 * Listing-report reasons — the ONE definition shared by the public form's
 * options, the API route's validation, and the admin review table. The values
 * must match the CHECK constraint in migration 20260720090004.
 */
export const REPORT_REASONS = ["bad-contact", "not-available", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  "bad-contact": "Contact info is wrong or dead",
  "not-available": "Property is no longer available",
  other: "Something else",
};

export function asReportReason(v: string): ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(v) ? (v as ReportReason) : "other";
}
