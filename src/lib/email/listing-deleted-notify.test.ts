import { describe, expect, it } from "vitest";
import { buildListingDeletedNotification } from "./listing-deleted-notify";

describe("buildListingDeletedNotification", () => {
  it("names the listing, the actor, and the cancellation", () => {
    const { subject, text } = buildListingDeletedNotification({
      title: "Furnished 3BR Baytown",
      actorEmail: "landlord@example.com",
      wasAdmin: false,
    });
    expect(subject).toBe("Listing deleted — subscription canceled: Furnished 3BR Baytown");
    expect(text).toContain("Furnished 3BR Baytown");
    expect(text).toContain("landlord@example.com (landlord)");
    expect(text).toContain("Its subscription was canceled.");
  });

  it("labels an admin deleter and pluralizes multiple subscriptions", () => {
    const { text } = buildListingDeletedNotification({
      title: "RV Park",
      actorEmail: "admin@bch.com",
      wasAdmin: true,
      subscriptionCount: 3,
    });
    expect(text).toContain("admin@bch.com (admin)");
    expect(text).toContain("3 subscriptions were canceled");
  });

  it("falls back gracefully when title/actor are missing", () => {
    const { subject, text } = buildListingDeletedNotification({ title: "  " });
    expect(subject).toContain("(untitled listing)");
    expect(text).toContain("(unknown) (landlord)");
  });
});
