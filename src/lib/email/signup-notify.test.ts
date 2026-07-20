import { describe, expect, it } from "vitest";
import { buildSignupNotification } from "./signup-notify";

describe("buildSignupNotification", () => {
  it("summarizes a complete signup", () => {
    const { subject, text } = buildSignupNotification({
      email: "jane@example.com",
      full_name: "Jane Smith",
      phone: "(555) 123-4567",
      role: "landlord",
    });
    expect(subject).toBe("New account: jane@example.com");
    expect(text).toContain("Jane Smith");
    expect(text).toContain("jane@example.com");
    expect(text).toContain("(555) 123-4567");
    expect(text).toContain("/admin/accounts");
  });

  it("fills placeholders for a bot signup with blank name/phone", () => {
    const { subject, text } = buildSignupNotification({
      email: "c8r4vjwl9a@bltiwd.com",
      full_name: "",
      phone: null,
    });
    expect(subject).toContain("c8r4vjwl9a@bltiwd.com");
    expect(text).toContain("(no name given)");
    expect(text).toContain("(none)");
    // Role defaults to landlord when the webhook omits it.
    expect(text).toContain("landlord");
  });

  it("degrades gracefully when even the email is missing", () => {
    const { subject } = buildSignupNotification({});
    expect(subject).toBe("New account: (unknown email)");
  });
});
