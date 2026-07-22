import { describe, expect, it } from "vitest";
import { buildListingSubmitNotification } from "./listing-submit-notify";

describe("buildListingSubmitNotification", () => {
  it("summarizes a standard listing submission", () => {
    const { subject, text } = buildListingSubmitNotification({
      title: "2BR near the plant",
      submitterEmail: "jane@example.com",
    });
    expect(subject).toBe("New listing submitted for review: 2BR near the plant");
    expect(text).toContain("Standard");
    expect(text).toContain("jane@example.com");
    expect(text).toContain("/admin");
  });

  it("labels commercial submissions", () => {
    const { text } = buildListingSubmitNotification({
      title: "Kemah RV Park",
      submitterEmail: "owner@rv.com",
      isCommercial: true,
    });
    expect(text).toContain("Commercial");
  });

  it("degrades gracefully on blank title/email", () => {
    const { subject, text } = buildListingSubmitNotification({ title: "  " });
    expect(subject).toContain("(untitled listing)");
    expect(text).toContain("(unknown)");
  });
});
