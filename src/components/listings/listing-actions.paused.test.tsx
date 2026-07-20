// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

afterEach(cleanup);

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

// The flag is read once at module load, so it must be stubbed BEFORE the
// component module is imported — hence the dynamic import (a static import
// would hoist above the stub).
vi.stubEnv("NEXT_PUBLIC_PAYMENTS_PAUSED", "1");
const { ListingActions } = await import("./listing-actions");

describe("payments paused (pre-launch gate)", () => {
  it("replaces Pay to publish with the check-back note", () => {
    render(<ListingActions id="x" status="approved" subscriptionStatus="none" />);
    expect(screen.queryByRole("button", { name: /Pay to publish/ })).toBeNull();
    expect(screen.getByText(/Paid listings open soon/)).toBeDefined();
  });

  it("replaces Reactivate with the check-back note", () => {
    render(
      <ListingActions id="x" status="approved" subscriptionStatus="canceled" hasSubscription />,
    );
    expect(screen.queryByRole("button", { name: /Reactivate/ })).toBeNull();
    expect(screen.getByText(/Paid listings open soon/)).toBeDefined();
  });

  it("leaves non-payment actions alone (submit still there on drafts)", () => {
    render(<ListingActions id="x" status="draft" />);
    expect(screen.getByRole("button", { name: /Submit for approval/ })).toBeDefined();
    expect(screen.queryByText(/Paid listings open soon/)).toBeNull();
  });
});
