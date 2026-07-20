import { describe, expect, it } from "vitest";
import { cancelEffectiveAt, cancelJustScheduled, isCancelScheduled } from "./stripe-cancel";

// Real field shapes observed on the account (API version 2026-06-24.dahlia).
//
// LEGACY portal cancel: cancel_at_period_end=true.
// CURRENT dashboard/portal cancel: Stripe schedules via cancel_at (a unix
// timestamp at the period end) and leaves cancel_at_period_end FALSE —
// exactly what happened when Joe canceled five $10 subs on 2026-07-12:
//   status: active, cancel_at_period_end: false,
//   cancel_at: 1815173114 (2027-07-10), canceled_at: 1783891594 (2026-07-12)
const CANCEL_AT = 1815173114; // 2027-07-10, the period end
const CANCELED_AT = 1783891594; // 2026-07-12, when Joe clicked cancel

const legacyCancel = { cancel_at_period_end: true, cancel_at: CANCEL_AT, canceled_at: CANCELED_AT };
const modernCancel = { cancel_at_period_end: false, cancel_at: CANCEL_AT, canceled_at: CANCELED_AT };
const notCanceled = { cancel_at_period_end: false, cancel_at: null, canceled_at: null };

describe("isCancelScheduled", () => {
  it("detects a legacy cancel-at-period-end cancellation", () => {
    expect(isCancelScheduled(legacyCancel)).toBe(true);
  });

  it("detects a modern cancel_at-scheduled cancellation (Joe's five $10 subs)", () => {
    expect(isCancelScheduled(modernCancel)).toBe(true);
  });

  it("is false for a live subscription with no cancellation", () => {
    expect(isCancelScheduled(notCanceled)).toBe(false);
  });
});

describe("cancelEffectiveAt", () => {
  it("prefers the explicit cancel_at date when set", () => {
    // A dashboard cancel can pick a custom date, which may differ from the
    // period end — the explicit date is the one that's true.
    expect(cancelEffectiveAt(modernCancel, CANCEL_AT + 999)).toBe(CANCEL_AT);
  });

  it("falls back to the current period end when there is no cancel_at", () => {
    expect(cancelEffectiveAt(legacyCancel, 1_800_000_000)).toBe(CANCEL_AT);
    expect(cancelEffectiveAt({ ...legacyCancel, cancel_at: null }, 1_800_000_000)).toBe(
      1_800_000_000,
    );
  });
});

describe("cancelJustScheduled", () => {
  it("fires when a legacy cancel flips the boolean on", () => {
    expect(cancelJustScheduled(legacyCancel, { cancel_at_period_end: false })).toBe(true);
  });

  it("fires when a modern cancel sets cancel_at (previous_attributes has the old null)", () => {
    // previous_attributes lists changed fields with their OLD values.
    expect(cancelJustScheduled(modernCancel, { cancel_at: null, canceled_at: null })).toBe(true);
  });

  it("does not fire for unrelated subscription updates", () => {
    expect(cancelJustScheduled(notCanceled, undefined)).toBe(false);
    expect(cancelJustScheduled(notCanceled, { cancel_at_period_end: false })).toBe(false);
    // Already-canceled sub gets some other update (no cancel fields changed).
    expect(cancelJustScheduled(modernCancel, undefined)).toBe(false);
  });

  it("does not fire when the update REMOVES the cancellation (resume)", () => {
    expect(cancelJustScheduled(notCanceled, { cancel_at: CANCEL_AT, canceled_at: CANCELED_AT })).toBe(false);
  });
});
