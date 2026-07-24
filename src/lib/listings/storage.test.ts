import { describe, expect, it } from "vitest";
import { subscriptionsToCancel } from "./storage";

describe("subscriptionsToCancel (delete cancels auto-renewal — Terms 6.2)", () => {
  it("returns the primary listing's subscription plus every child unit's", () => {
    const rows = [
      { stripe_subscription_id: "sub_primary" },
      { stripe_subscription_id: "sub_unit2" },
      { stripe_subscription_id: "sub_unit3" },
    ];
    expect(subscriptionsToCancel(rows)).toEqual(["sub_primary", "sub_unit2", "sub_unit3"]);
  });

  it("skips rows with no subscription (unpaid/draft units bill nothing)", () => {
    const rows = [
      { stripe_subscription_id: "sub_primary" },
      { stripe_subscription_id: null },
      { stripe_subscription_id: "" },
      { stripe_subscription_id: undefined },
    ];
    expect(subscriptionsToCancel(rows)).toEqual(["sub_primary"]);
  });

  it("dedupes so the same subscription is never cancelled twice", () => {
    const rows = [
      { stripe_subscription_id: "sub_shared" },
      { stripe_subscription_id: "sub_shared" },
    ];
    expect(subscriptionsToCancel(rows)).toEqual(["sub_shared"]);
  });

  it("returns nothing when no listing was ever paid for", () => {
    expect(subscriptionsToCancel([{ stripe_subscription_id: null }])).toEqual([]);
    expect(subscriptionsToCancel([])).toEqual([]);
  });
});
