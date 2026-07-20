import { describe, it, expect } from "vitest";
import { safePath } from "./safe-path";

describe("safePath", () => {
  it("allows same-origin relative paths", () => {
    expect(safePath("/dashboard")).toBe("/dashboard");
    expect(safePath("/reset-password", "/login")).toBe("/reset-password");
  });
  it("blocks absolute external URLs", () => {
    expect(safePath("https://evil.com")).toBe("/dashboard");
    expect(safePath("http://evil.com")).toBe("/dashboard");
  });
  it("blocks protocol-relative and backslash tricks", () => {
    expect(safePath("//evil.com")).toBe("/dashboard");
    expect(safePath("/\\evil.com")).toBe("/dashboard");
  });
  it("falls back on empty/null input", () => {
    expect(safePath(null)).toBe("/dashboard");
    expect(safePath(undefined)).toBe("/dashboard");
    expect(safePath("")).toBe("/dashboard");
  });
  it("respects a custom fallback", () => {
    expect(safePath("//evil.com", "/")).toBe("/");
  });
});
