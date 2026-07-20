import { describe, expect, it } from "vitest";
import { accountDeleteError } from "./account-delete";

describe("accountDeleteError", () => {
  it("refuses a missing account", () => {
    expect(accountDeleteError("admin-1", null)).toMatch(/no longer exists/i);
  });

  it("refuses deleting yourself", () => {
    expect(accountDeleteError("me", { id: "me", role: "admin" })).toMatch(/your own/i);
  });

  it("refuses deleting another admin", () => {
    expect(accountDeleteError("me", { id: "other-admin", role: "admin" })).toMatch(/admin/i);
  });

  it("allows deleting a landlord", () => {
    expect(accountDeleteError("me", { id: "spam-bot", role: "landlord" })).toBeNull();
  });
});
