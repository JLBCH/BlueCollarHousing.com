import { describe, expect, it } from "vitest";
import { buildCouponNotification } from "./coupon-notify";

describe("buildCouponNotification", () => {
  it("describes a first-payment discount with expiry", () => {
    const { subject, text } = buildCouponNotification({
      code: "WELCOME50",
      percentOff: 50,
      duration: "once",
      expiresAt: "2026-08-31",
    });
    expect(subject).toContain("WELCOME50");
    expect(text).toContain("50% off");
    expect(text).toContain("first payment");
    expect(text).toContain("2026-08-31");
    expect(text).toContain("/dashboard");
  });

  it("describes a free (100%) forever code without expiry", () => {
    const { text } = buildCouponNotification({
      code: "FREEYEAR",
      percentOff: 100,
      duration: "forever",
    });
    expect(text).toContain("100% off (free)");
    expect(text).toContain("every billing period");
    expect(text).not.toContain("expires");
  });
});
