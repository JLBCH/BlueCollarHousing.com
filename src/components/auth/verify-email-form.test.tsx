// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resend: vi.fn(),
  resetCaptcha: vi.fn(),
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

import { VerifyEmailForm } from "./verify-email-form";

const STORAGE_KEY = "bch.pending-verification";
const NOW = Date.parse("2026-08-27T20:30:00.000Z");

function persistPending(overrides: Record<string, unknown> = {}) {
  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      email: "jane@example.com",
      sentAt: Date.now(),
      deliveryFailed: false,
      ...overrides,
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("pending email verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mocks.resend.mockResolvedValue({ error: null });
  });

  it("restores the pending state after a refresh without displaying the full address", async () => {
    persistPending();
    const firstRender = render(<VerifyEmailForm />);

    expect(await screen.findByText("j***@example.com")).toBeInTheDocument();
    expect(screen.queryByText("jane@example.com")).not.toBeInTheDocument();
    expect(screen.getByText(/sent less than a minute ago/i)).toBeInTheDocument();
    expect(screen.getByText(/spam, junk, other, or quarantine/i)).toBeInTheDocument();

    firstRender.unmount();
    render(<VerifyEmailForm />);
    expect(await screen.findByText("j***@example.com")).toBeInTheDocument();
  });

  it("enforces and visibly counts down a 60-second resend cooldown", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    persistPending();
    render(<VerifyEmailForm />);

    await act(async () => {});
    expect(screen.getByRole("button", { name: "Resend available in 60s" })).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByRole("button", { name: "Resend verification email" })).toBeEnabled();
  });

  it("resends with captcha and restarts the persisted cooldown", async () => {
    persistPending({ deliveryFailed: true, sentAt: NOW - 5_000 });
    render(<VerifyEmailForm />);

    fireEvent.click(await screen.findByRole("button", { name: "Resend verification email" }));

    await waitFor(() =>
      expect(mocks.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "jane@example.com",
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm-email?next=/dashboard`,
          captchaToken: "captcha-token",
        },
      }),
    );
    expect(mocks.resetCaptcha).toHaveBeenCalledOnce();
    expect(await screen.findByText(/sent again/i)).toBeInTheDocument();

    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null");
    expect(saved).toMatchObject({ email: "jane@example.com", deliveryFailed: false });
    expect(saved.sentAt).toBeGreaterThan(NOW - 5_000);
    expect(screen.getByRole("button", { name: /resend available in \d+s/i })).toBeDisabled();
  });

  it("shows safe retry guidance instead of raw resend errors", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    mocks.resend.mockResolvedValue({
      error: { code: "over_email_send_rate_limit", message: "email rate limit exceeded" },
    });
    persistPending({ deliveryFailed: true, sentAt: NOW - 5_000 });
    render(<VerifyEmailForm />);

    await act(async () => {});
    fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));

    await act(async () => {});
    expect(screen.getByText(/wait about a minute/i)).toBeInTheDocument();
    expect(screen.queryByText(/rate limit exceeded/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend available in 60s" })).toBeDisabled();
    expect(JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "null")).toMatchObject({
      email: "jane@example.com",
      sentAt: NOW,
      deliveryFailed: false,
    });
  });

  it("offers safe recovery links when there is no pending state", async () => {
    render(<VerifyEmailForm />);

    expect(await screen.findByText(/no email is waiting for verification/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  });
});
