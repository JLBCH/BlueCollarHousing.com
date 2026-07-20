import { describe, it, expect } from "vitest";
import { postStatus, uniqueSlug } from "./blog";

describe("postStatus", () => {
  const now = new Date("2026-07-20T12:00:00Z");

  it("unpublished is a draft", () => {
    expect(postStatus({ published: false, publishedAt: null }, now)).toBe("draft");
    expect(
      postStatus({ published: false, publishedAt: "2026-07-01T00:00:00Z" }, now),
    ).toBe("draft");
  });

  it("published without a date is treated as draft (matches RLS: invisible)", () => {
    expect(postStatus({ published: true, publishedAt: null }, now)).toBe("draft");
  });

  it("future published_at means scheduled", () => {
    expect(
      postStatus({ published: true, publishedAt: "2026-08-01T09:00:00Z" }, now),
    ).toBe("scheduled");
  });

  it("past or exactly-now published_at means published", () => {
    expect(
      postStatus({ published: true, publishedAt: "2026-07-01T00:00:00Z" }, now),
    ).toBe("published");
    expect(
      postStatus({ published: true, publishedAt: "2026-07-20T12:00:00Z" }, now),
    ).toBe("published");
  });
});

describe("uniqueSlug", () => {
  it("keeps a free slug as-is", () => {
    expect(uniqueSlug("housing-tips", [])).toBe("housing-tips");
    expect(uniqueSlug("housing-tips", ["other-post"])).toBe("housing-tips");
  });

  it("suffixes -2 on the first collision", () => {
    expect(uniqueSlug("housing-tips", ["housing-tips"])).toBe("housing-tips-2");
  });

  it("keeps counting past taken suffixes", () => {
    expect(
      uniqueSlug("housing-tips", ["housing-tips", "housing-tips-2", "housing-tips-3"]),
    ).toBe("housing-tips-4");
  });

  it("is not fooled by unrelated prefixed slugs", () => {
    expect(uniqueSlug("housing", ["housing-tips"])).toBe("housing");
  });
});
