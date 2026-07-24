import { describe, expect, it } from "vitest";
import { listingEventLabel } from "./events";

describe("listingEventLabel", () => {
  it("attributes submit and edit to the actor (landlord vs admin)", () => {
    expect(listingEventLabel({ event: "submitted", actor_is_admin: false })).toBe(
      "Submitted for review by the landlord",
    );
    expect(listingEventLabel({ event: "revised", actor_is_admin: true })).toBe(
      "Edited by the admin",
    );
  });

  it("labels admin decisions", () => {
    expect(listingEventLabel({ event: "approved", actor_is_admin: true })).toBe("Approved by admin");
    expect(listingEventLabel({ event: "rejected", actor_is_admin: true })).toBe("Rejected by admin");
  });

  it("labels removal", () => {
    expect(listingEventLabel({ event: "removed", actor_is_admin: false })).toBe(
      "Removed by the landlord",
    );
  });

  it("falls back to the raw event for anything unknown", () => {
    expect(listingEventLabel({ event: "mystery", actor_is_admin: false })).toBe("mystery");
  });
});
