import { describe, expect, it } from "vitest";
import {
  buildListingSubmitNotification,
  buildListingEditedNotification,
} from "./listing-submit-notify";

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

describe("buildListingEditedNotification", () => {
  it("is a live-listing FYI, not a review to-do", () => {
    const { subject, text } = buildListingEditedNotification({
      title: "2BR near the plant",
      editorEmail: "jane@example.com",
    });
    expect(subject).toBe("Live listing edited: 2BR near the plant");
    // Must make clear the listing stays live and no action is required.
    expect(text.toLowerCase()).toContain("stays live");
    expect(text.toLowerCase()).toContain("no action is required");
    expect(text).toContain("jane@example.com");
    expect(text).not.toContain("submitted for approval");
  });

  it("degrades gracefully on blank title/email", () => {
    const { subject, text } = buildListingEditedNotification({ title: "  " });
    expect(subject).toContain("(untitled listing)");
    expect(text).toContain("(unknown)");
  });
});
