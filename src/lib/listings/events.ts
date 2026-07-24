export type ListingEventType =
  | "submitted"
  | "approved"
  | "rejected"
  | "revised"
  | "removed";

export type ListingEvent = {
  event: ListingEventType | string;
  actor_is_admin: boolean;
  created_at: string;
};

/**
 * Human label for a listing lifecycle event, naming who did it (admin vs the
 * landlord). Backs the Privacy Policy 2.1 history shown to admins. Pure.
 */
export function listingEventLabel(e: {
  event: string;
  actor_is_admin: boolean;
}): string {
  const who = e.actor_is_admin ? "admin" : "landlord";
  switch (e.event) {
    case "submitted":
      return `Submitted for review by the ${who}`;
    case "approved":
      return "Approved by admin";
    case "rejected":
      return "Rejected by admin";
    case "revised":
      return `Edited by the ${who}`;
    case "removed":
      return `Removed by the ${who}`;
    default:
      return e.event;
  }
}
