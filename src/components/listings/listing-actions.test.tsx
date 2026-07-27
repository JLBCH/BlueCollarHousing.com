// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

afterEach(cleanup);
import { ListingActions } from "./listing-actions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/dashboard/listings/actions", () => ({
  deleteListing: vi.fn(),
  duplicateListing: vi.fn(),
  setListingStatus: vi.fn(),
}));
vi.mock("@/app/dashboard/billing/actions", () => ({
  subscribeListing: vi.fn(),
  openBillingPortal: vi.fn(),
}));

// Joe (Jul 16): consent lives at "Submit for approval" only — every listing,
// free or paid, passes through submit, so no separate line at the pay button.
const PURCHASE_CONSENT = /By completing your purchase/;

describe("pay buttons carry no separate consent line", () => {
  it("Pay to publish (awaiting payment)", () => {
    render(<ListingActions id="x" status="approved" subscriptionStatus="none" />);
    expect(screen.getByRole("button", { name: /Pay to publish/ })).toBeDefined();
    expect(screen.queryByText(PURCHASE_CONSENT)).toBeNull();
  });

  it("Reactivate (lapsed)", () => {
    render(
      <ListingActions id="x" status="approved" subscriptionStatus="canceled" hasSubscription />,
    );
    expect(screen.getByRole("button", { name: /Reactivate/ })).toBeDefined();
    expect(screen.queryByText(PURCHASE_CONSENT)).toBeNull();
  });
});

const SUBMIT_CONSENT = /By submitting your listing you agree to our/;

describe("submit consent line (covers free/comped listings)", () => {
  it("shows next to Submit for approval on drafts, linking Terms and Privacy", () => {
    render(<ListingActions id="x" status="draft" />);
    expect(screen.getByRole("button", { name: /Submit for approval/ })).toBeDefined();
    const note = screen.getByText(SUBMIT_CONSENT);
    expect(note.querySelector('a[href="/terms"]')?.textContent).toMatch(/Terms of Use/);
    expect(note.querySelector('a[href="/privacy"]')?.textContent).toMatch(/Privacy Policy/);
  });

  it("shows on rejected listings (resubmit path)", () => {
    render(<ListingActions id="x" status="rejected" />);
    expect(screen.getByText(SUBMIT_CONSENT)).toBeDefined();
  });
});

// Terms 5.3 requires the payment authorization disclosure to sit with the pay
// click, not only at submission.
const PAY_CONSENT = /By paying for your listing you agree to our/;

describe("payment consent line", () => {
  it("shows next to Pay to publish, naming auto-renewal and how to cancel", () => {
    render(<ListingActions id="x" status="approved" subscriptionStatus="none" />);
    expect(screen.getByRole("button", { name: /Pay to publish/ })).toBeDefined();
    const note = screen.getByText(PAY_CONSENT);
    expect(note.querySelector('a[href="/terms"]')?.textContent).toMatch(/Terms of Use/);
    expect(note.querySelector('a[href="/privacy"]')?.textContent).toMatch(/Privacy Policy/);
    expect(note.textContent).toMatch(/automatic annual renewal/);
    expect(note.textContent).toMatch(/[Cc]ancel any time/);
  });

  it("is absent on a draft (nothing to pay for yet)", () => {
    render(<ListingActions id="x" status="draft" />);
    expect(screen.queryByText(PAY_CONSENT)).toBeNull();
  });

  it("hidden once pending or live (nothing left to submit)", () => {
    render(<ListingActions id="x" status="pending" />);
    expect(screen.queryByText(SUBMIT_CONSENT)).toBeNull();
    cleanup();
    render(
      <ListingActions id="x" status="approved" subscriptionStatus="active" hasSubscription />,
    );
    expect(screen.queryByText(SUBMIT_CONSENT)).toBeNull();
  });
});
