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
  it("shows next to Submit for approval on drafts", () => {
    render(<ListingActions id="x" status="draft" />);
    expect(screen.getByRole("button", { name: /Submit for approval/ })).toBeDefined();
    const note = screen.getByText(SUBMIT_CONSENT);
    expect(note.querySelector('a[href="/terms"]')?.textContent).toMatch(/Terms and Conditions/);
  });

  it("shows on rejected listings (resubmit path)", () => {
    render(<ListingActions id="x" status="rejected" />);
    expect(screen.getByText(SUBMIT_CONSENT)).toBeDefined();
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
