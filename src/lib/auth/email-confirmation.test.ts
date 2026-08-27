import { describe, expect, it } from "vitest";
import {
  isAuthRateLimitError,
  isEmailOtpType,
  isVerificationEmailDeliveryError,
  SIGNUP_CONFIRMATION_PATH,
} from "./email-confirmation";

describe("email confirmation helpers", () => {
  it("keeps every signup sender on the scanner-resistant destination", () => {
    expect(SIGNUP_CONFIRMATION_PATH).toBe("/auth/confirm-email?next=/dashboard");
  });

  it("recognizes structured Supabase email delivery errors", () => {
    expect(
      isVerificationEmailDeliveryError({
        code: "email_address_not_authorized",
        message: "Unable to complete request",
      }),
    ).toBe(true);
  });

  it("recognizes structured Supabase email rate limits", () => {
    expect(
      isAuthRateLimitError({
        code: "over_email_send_rate_limit",
        message: "Request rejected",
      }),
    ).toBe(true);
  });

  it("rejects unknown OTP types", () => {
    expect(isEmailOtpType("signup")).toBe(true);
    expect(isEmailOtpType("not-a-real-type")).toBe(false);
  });
});
