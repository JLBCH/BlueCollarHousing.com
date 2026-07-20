import { describe, expect, it } from "vitest";
import { insertImageMarkdown } from "./blog-image-upload";

const URL = "https://x.supabase.co/storage/v1/object/public/blog-images/u/1.jpg";

describe("insertImageMarkdown", () => {
  it("appends to an empty body without a leading newline", () => {
    const { text, cursor } = insertImageMarkdown("", 0, 0, "photo", URL);
    expect(text).toBe(`![photo](${URL})\n`);
    expect(cursor).toBe(text.length);
  });

  it("inserts at the cursor mid-text and starts the image on its own line", () => {
    const body = "Intro paragraph.";
    const { text, cursor } = insertImageMarkdown(body, 16, 16, "photo", URL);
    expect(text).toBe(`Intro paragraph.\n![photo](${URL})\n`);
    // Cursor lands just past the inserted snippet + its trailing newline.
    expect(text.slice(0, cursor).endsWith(`![photo](${URL})\n`)).toBe(true);
  });

  it("does not add a leading newline when already at a line start", () => {
    const body = "First line\n";
    const { text } = insertImageMarkdown(body, body.length, body.length, "p", URL);
    expect(text).toBe(`First line\n![p](${URL})\n`);
  });

  it("replaces the current selection instead of duplicating it", () => {
    const body = "keep REPLACE keep";
    // Select the word "REPLACE" (indices 5..12).
    const { text } = insertImageMarkdown(body, 5, 12, "p", URL);
    expect(text).toBe(`keep \n![p](${URL})\n keep`);
    expect(text).not.toContain("REPLACE");
  });
});
