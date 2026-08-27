import type { EmailOtpType } from "@supabase/supabase-js";

type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

export const SIGNUP_CONFIRMATION_PATH = "/auth/confirm-email?next=/dashboard";

const EMAIL_OTP_TYPES: ReadonlySet<string> = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
] satisfies EmailOtpType[]);

export function isEmailOtpType(value: string | null | undefined): value is EmailOtpType {
  return typeof value === "string" && EMAIL_OTP_TYPES.has(value);
}

export function isAuthRateLimitError(error: AuthErrorLike) {
  return (
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    error.status === 429 ||
    /rate.?limit|too many requests|security purposes.*seconds/i.test(error.message ?? "")
  );
}

export function isVerificationEmailDeliveryError(error: AuthErrorLike) {
  if (error.code === "email_address_not_authorized") return true;

  const message = (error.message ?? "").toLowerCase();
  if (message.includes("email address not authorized")) return true;

  return (
    message.includes("email") &&
    (message.includes("confirmation") || message.includes("verification")) &&
    (message.includes("send") || message.includes("deliver") || message.includes("smtp"))
  );
}
