export const PENDING_VERIFICATION_STORAGE_KEY = "bch.pending-verification";
export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

export type PendingVerification = {
  email: string;
  sentAt: number;
  deliveryFailed: boolean;
};

function sameEmail(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function verificationResendCooldownRemainingMs(
  pending: PendingVerification,
  now = Date.now(),
) {
  if (pending.deliveryFailed) return 0;
  return Math.max(0, pending.sentAt + VERIFICATION_RESEND_COOLDOWN_MS - now);
}

export function verificationResendSecondsRemaining(
  pending: PendingVerification,
  now = Date.now(),
) {
  return Math.ceil(verificationResendCooldownRemainingMs(pending, now) / 1_000);
}

export function readPendingVerification(): PendingVerification | null {
  if (typeof window === "undefined") return null;

  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(PENDING_VERIFICATION_STORAGE_KEY) ?? "null",
    ) as Partial<PendingVerification> | null;

    if (
      !value ||
      typeof value.email !== "string" ||
      !value.email.includes("@") ||
      typeof value.sentAt !== "number" ||
      !Number.isFinite(value.sentAt) ||
      typeof value.deliveryFailed !== "boolean"
    ) {
      return null;
    }

    return {
      email: value.email,
      sentAt: value.sentAt,
      deliveryFailed: value.deliveryFailed,
    };
  } catch {
    return null;
  }
}

export function savePendingVerification(value: PendingVerification) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(PENDING_VERIFICATION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Auth can still continue when storage is unavailable; the verification
    // page will provide safe recovery links instead of exposing the address.
  }
}

/**
 * Returns the pending state only when the same address is still cooling down.
 * Initial signup delivery failures deliberately do not count: the verification
 * page may make one immediate manual retry, which begins a real attempt below.
 */
export function pendingVerificationCooldownForEmail(email: string, now = Date.now()) {
  const pending = readPendingVerification();
  if (
    !pending ||
    !sameEmail(pending.email, email) ||
    verificationResendCooldownRemainingMs(pending, now) === 0
  ) {
    return null;
  }
  return pending;
}

/**
 * Persist the cooldown before a manual resend. Delivery can fail after the
 * provider accepted a message, so retry timing must not depend on its response.
 */
export function beginPendingVerificationAttempt(email: string, now = Date.now()) {
  const pending: PendingVerification = {
    email: email.trim(),
    sentAt: now,
    deliveryFailed: false,
  };
  savePendingVerification(pending);
  return pending;
}

export function clearPendingVerification() {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(PENDING_VERIFICATION_STORAGE_KEY);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}
