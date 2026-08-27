// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  resend: vi.fn(),
  resetCaptcha: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/components/auth/use-captcha", () => ({
  useCaptcha: () => ({
    captchaToken: "captcha-token",
    field: <div data-testid="captcha" />,
    reset: mocks.resetCaptcha,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { resend: mocks.resend } }),
}));

import { LinkErrorRecoveryForm } from "./link-error-recovery-form";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("expired confirmation link recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mocks.resend.mockResolvedValue({ error: null });
  });

  it("resends generically, stores the pending state, and navigates without exposing the email", async () => {
    render(<LinkErrorRecoveryForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "erika@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send a new confirmation email" }));

    await waitFor(() =>
      expect(mocks.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "erika@example.com",
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm-email?next=/dashboard`,
          captchaToken: "captcha-token",
        },
      }),
    );
    expect(mocks.resetCaptcha).toHaveBeenCalledOnce();
    expect(JSON.parse(window.sessionStorage.getItem("bch.pending-verification") ?? "null"))
      .toMatchObject({ email: "erika@example.com", deliveryFailed: false });
    expect(mocks.push).toHaveBeenCalledWith("/verify-email");
    expect(mocks.push).not.toHaveBeenCalledWith(expect.stringContaining("erika"));
  });

  it("never shows a raw resend error that could reveal whether an account exists", async () => {
    mocks.resend.mockResolvedValue({
      error: { message: "User with this email does not exist", status: 400 },
    });
    render(<LinkErrorRecoveryForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "unknown@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send a new confirmation email" }));

    expect(await screen.findByText(/couldn't complete that request/i)).toBeInTheDocument();
    expect(screen.queryByText(/does not exist/i)).not.toBeInTheDocument();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("gives safe retry guidance when Supabase rate-limits resends", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-27T20:30:00.000Z"));
    mocks.resend.mockResolvedValue({
      error: { message: "email rate limit exceeded", status: 429 },
    });
    render(<LinkErrorRecoveryForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "erika@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send a new confirmation email" }));

    await act(async () => {});
    expect(screen.getByText(/wait about a minute/i)).toBeInTheDocument();
    expect(screen.queryByText(/rate limit exceeded/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again in 60s" })).toBeDisabled();
    expect(JSON.parse(window.sessionStorage.getItem("bch.pending-verification") ?? "null"))
      .toMatchObject({
        email: "erika@example.com",
        sentAt: Date.parse("2026-08-27T20:30:00.000Z"),
        deliveryFailed: false,
      });
  });

  it("does not send again when another verification entry point is cooling down", async () => {
    window.sessionStorage.setItem(
      "bch.pending-verification",
      JSON.stringify({
        email: "erika@example.com",
        sentAt: Date.now(),
        deliveryFailed: false,
      }),
    );
    render(<LinkErrorRecoveryForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ERIKA@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send a new confirmation email" }));

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/verify-email"));
    expect(mocks.resend).not.toHaveBeenCalled();
  });
});
