import { describe, it, expect } from "vitest";
import { formatPhone } from "./format-phone";

describe("formatPhone", () => {
  it("formats progressively as digits are entered", () => {
    expect(formatPhone("5")).toBe("(5");
    expect(formatPhone("555")).toBe("(555");
    expect(formatPhone("5551")).toBe("(555) 1");
    expect(formatPhone("555123")).toBe("(555) 123");
    expect(formatPhone("5551234567")).toBe("(555) 123-4567");
  });
  it("strips non-digits and caps at 10 digits", () => {
    expect(formatPhone("(555) 123-4567")).toBe("(555) 123-4567");
    expect(formatPhone("555.123.4567 ext")).toBe("(555) 123-4567");
    expect(formatPhone("55512345678901")).toBe("(555) 123-4567");
  });
  it("returns empty for empty/no digits", () => {
    expect(formatPhone("")).toBe("");
    expect(formatPhone("abc")).toBe("");
  });
});
