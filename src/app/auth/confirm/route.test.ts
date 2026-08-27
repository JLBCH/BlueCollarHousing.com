import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  verifyOtp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: mocks.exchangeCodeForSession,
      verifyOtp: mocks.verifyOtp,
    },
  }),
}));

import * as confirmRoute from "./route";

describe("email confirmation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.verifyOtp.mockResolvedValue({ error: null });
  });

  it("supports a user-initiated POST so mail scanners cannot consume the token", async () => {
    const post = (confirmRoute as typeof confirmRoute & { POST?: (request: NextRequest) => Promise<Response> })
      .POST;
    expect(post).toBeTypeOf("function");

    const request = new NextRequest("https://bluecollarhousing.com/auth/confirm", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token_hash: "token-hash",
        type: "signup",
        next: "/dashboard",
      }),
    });
    const response = await post!(request);

    expect(mocks.verifyOtp).toHaveBeenCalledWith({ type: "signup", token_hash: "token-hash" });
    expect(response.headers.get("location")).toBe("https://bluecollarhousing.com/dashboard");
  });

  it("sends invalid or expired links to a recovery page", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: { message: "Token has expired or is invalid" } });

    const response = await confirmRoute.GET(
      new NextRequest(
        "https://bluecollarhousing.com/auth/confirm?token_hash=expired&type=signup",
      ),
    );

    expect(response.headers.get("location")).toBe("https://bluecollarhousing.com/auth/link-error");
  });

  it("sends an expired password-recovery code back to password recovery", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: { message: "Auth code has expired" },
    });

    const response = await confirmRoute.GET(
      new NextRequest(
        "https://bluecollarhousing.com/auth/confirm?code=expired-code&next=/reset-password",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://bluecollarhousing.com/forgot-password?error=expired-link",
    );
    expect(response.headers.get("location")).not.toContain("expired-code");
  });

  it("sends an expired password-recovery OTP back to password recovery", async () => {
    mocks.verifyOtp.mockResolvedValue({ error: { message: "Token has expired" } });

    const response = await confirmRoute.POST(
      new NextRequest("https://bluecollarhousing.com/auth/confirm", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token_hash: "expired-recovery-token",
          type: "recovery",
          next: "/reset-password",
        }),
      }),
    );

    expect(response.headers.get("location")).toBe(
      "https://bluecollarhousing.com/forgot-password?error=expired-link",
    );
    expect(response.headers.get("location")).not.toContain("expired-recovery-token");
  });

  it("rejects invalid POST parameters without trying to consume the token", async () => {
    const response = await confirmRoute.POST(
      new NextRequest("https://bluecollarhousing.com/auth/confirm", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token_hash: "secret-token",
          type: "not-a-real-type",
          next: "/dashboard",
        }),
      }),
    );

    expect(mocks.verifyOtp).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("https://bluecollarhousing.com/auth/link-error");
    expect(response.headers.get("location")).not.toContain("secret-token");
  });

  it("does not allow an external redirect after a valid POST", async () => {
    const response = await confirmRoute.POST(
      new NextRequest("https://bluecollarhousing.com/auth/confirm", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token_hash: "token-hash",
          type: "signup",
          next: "https://example.com/steal-session",
        }),
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://bluecollarhousing.com/dashboard");
  });
});
