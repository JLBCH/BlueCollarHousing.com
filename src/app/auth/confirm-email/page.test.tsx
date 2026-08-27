// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/brand/logo", () => ({
  Logo: () => <div data-testid="logo" />,
}));

import ConfirmEmailPage from "./page";

afterEach(cleanup);

describe("confirmation interstitial", () => {
  it("waits for an explicit POST before consuming a valid email token", async () => {
    render(
      await ConfirmEmailPage({
        searchParams: Promise.resolve({
          token_hash: "email-token",
          type: "signup",
          next: "/dashboard/listings/new",
        }),
      }),
    );

    const button = screen.getByRole("button", { name: "Confirm my email" });
    const form = button.closest("form");

    expect(form).toHaveAttribute("action", "/auth/confirm");
    expect(form).toHaveAttribute("method", "post");
    expect(form?.querySelector('input[name="token_hash"]')).toHaveValue("email-token");
    expect(form?.querySelector('input[name="type"]')).toHaveValue("signup");
    expect(form?.querySelector('input[name="next"]')).toHaveValue(
      "/dashboard/listings/new",
    );
  });

  it.each([
    { token_hash: undefined, type: "signup" },
    { token_hash: "email-token", type: undefined },
    { token_hash: "email-token", type: "not-a-real-type" },
  ])("does not render a confirmation form for missing or invalid parameters", async (params) => {
    render(
      await ConfirmEmailPage({
        searchParams: Promise.resolve(params),
      }),
    );

    expect(screen.queryByRole("button", { name: "Confirm my email" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new confirmation email/i })).toHaveAttribute(
      "href",
      "/auth/link-error",
    );
  });

  it("sanitizes the post-confirmation destination", async () => {
    render(
      await ConfirmEmailPage({
        searchParams: Promise.resolve({
          token_hash: "email-token",
          type: "signup",
          next: "https://example.com/steal-session",
        }),
      }),
    );

    const form = screen.getByRole("button", { name: "Confirm my email" }).closest("form");
    expect(form?.querySelector('input[name="next"]')).toHaveValue("/dashboard");
  });
});
