// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  signUp: vi.fn(),
  resend: vi.fn(),
  resetCaptcha: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

vi.mock("@/components/auth/use-captcha", () => ({
  useCaptcha: () => ({
    captchaToken: "captcha-token",
    field: null,
    reset: mocks.resetCaptcha,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: mocks.signUp, resend: mocks.resend },
  }),
}));

import { RegisterForm } from "./register-form";

afterEach(cleanup);

describe("registration verification handoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    mocks.signUp.mockResolvedValue({
      data: { user: { identities: [{ id: "new-identity" }] }, session: null },
      error: null,
    });
  });

  it("persists the pending address and moves signup to a dedicated verification page", async () => {
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "5551234567" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "jane@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "CorrectHorseBattery1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/verify-email"));
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          emailRedirectTo: `${window.location.origin}/auth/confirm-email?next=/dashboard`,
        }),
      }),
    );
    expect(JSON.parse(window.sessionStorage.getItem("bch.pending-verification") ?? "null")).toMatchObject({
      email: "jane@example.com",
    });
  });

  it("does not create another signup request while the same address is cooling down", async () => {
    window.sessionStorage.setItem(
      "bch.pending-verification",
      JSON.stringify({
        email: "jane@example.com",
        sentAt: Date.now(),
        deliveryFailed: false,
      }),
    );
    render(<RegisterForm />);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Jane Smith" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "5551234567" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "JANE@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "CorrectHorseBattery1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/verify-email"));
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
});
