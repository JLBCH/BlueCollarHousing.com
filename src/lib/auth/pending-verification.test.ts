import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  beginPendingVerificationAttempt,
  clearPendingVerification,
  type PendingVerification,
  pendingVerificationCooldownForEmail,
  PENDING_VERIFICATION_STORAGE_KEY,
  readPendingVerification,
  savePendingVerification,
  VERIFICATION_RESEND_COOLDOWN_MS,
  verificationResendCooldownRemainingMs,
  verificationResendSecondsRemaining,
} from "./pending-verification";

const PENDING: PendingVerification = {
  email: "jane@example.com",
  sentAt: 1_000,
  deliveryFailed: false,
};

describe("pending verification storage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("round-trips a valid pending state", () => {
    savePendingVerification(PENDING);

    expect(readPendingVerification()).toEqual(PENDING);
  });

  it("rejects malformed JSON", () => {
    window.sessionStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, "{not-json");

    expect(readPendingVerification()).toBeNull();
  });

  it.each([
    ["missing value", null],
    ["missing fields", {}],
    ["invalid email", { ...PENDING, email: "not-an-email" }],
    ["invalid timestamp type", { ...PENDING, sentAt: "1000" }],
    ["non-finite timestamp", { ...PENDING, sentAt: null }],
    ["invalid delivery flag", { ...PENDING, deliveryFailed: "false" }],
  ])("rejects %s", (_label, value) => {
    window.sessionStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, JSON.stringify(value));

    expect(readPendingVerification()).toBeNull();
  });

  it("degrades safely when storage reads are unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    expect(readPendingVerification()).toBeNull();
  });

  it("does not throw when storage writes or removals are unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    expect(() => savePendingVerification(PENDING)).not.toThrow();
    expect(() => clearPendingVerification()).not.toThrow();
  });
});

describe("pending verification cooldown", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("honors the exact 60-second boundary", () => {
    expect(verificationResendCooldownRemainingMs(PENDING, PENDING.sentAt)).toBe(
      VERIFICATION_RESEND_COOLDOWN_MS,
    );
    expect(
      verificationResendCooldownRemainingMs(
        PENDING,
        PENDING.sentAt + VERIFICATION_RESEND_COOLDOWN_MS - 1,
      ),
    ).toBe(1);
    expect(
      verificationResendCooldownRemainingMs(
        PENDING,
        PENDING.sentAt + VERIFICATION_RESEND_COOLDOWN_MS,
      ),
    ).toBe(0);
    expect(
      verificationResendCooldownRemainingMs(
        PENDING,
        PENDING.sentAt + VERIFICATION_RESEND_COOLDOWN_MS + 1,
      ),
    ).toBe(0);
  });

  it("rounds visible seconds up and permits immediate retry after delivery failure", () => {
    expect(verificationResendSecondsRemaining(PENDING, PENDING.sentAt + 1)).toBe(60);
    expect(verificationResendSecondsRemaining(PENDING, PENDING.sentAt + 59_001)).toBe(1);
    expect(
      verificationResendSecondsRemaining(
        { ...PENDING, deliveryFailed: true },
        PENDING.sentAt,
      ),
    ).toBe(0);
  });

  it("matches email case-insensitively only while the cooldown is active", () => {
    savePendingVerification(PENDING);

    expect(pendingVerificationCooldownForEmail("  JANE@EXAMPLE.COM ", PENDING.sentAt)).toEqual(
      PENDING,
    );
    expect(pendingVerificationCooldownForEmail("other@example.com", PENDING.sentAt)).toBeNull();
    expect(
      pendingVerificationCooldownForEmail(
        PENDING.email,
        PENDING.sentAt + VERIFICATION_RESEND_COOLDOWN_MS,
      ),
    ).toBeNull();
  });

  it("begins and persists a normalized manual attempt", () => {
    const pending = beginPendingVerificationAttempt("  Jane@Example.com  ", 5_000);

    expect(pending).toEqual({
      email: "Jane@Example.com",
      sentAt: 5_000,
      deliveryFailed: false,
    });
    expect(readPendingVerification()).toEqual(pending);
  });
});
