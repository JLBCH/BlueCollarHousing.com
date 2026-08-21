import { beforeEach, describe, expect, it, vi } from "vitest";

const BILLING_ACCOUNT_ERROR =
  "We could not verify your billing account. Please contact support before continuing.";

const mocks = vi.hoisted(() => ({
  user: {
    id: "user-attacker",
    email: "attacker@example.com",
    email_confirmed_at: "2026-08-01T00:00:00.000Z",
  },
  profile: { stripe_customer_id: "cus_stored", full_name: "Test User" },
  profileError: null as { message: string } | null,
  listing: {
    id: "listing-1",
    title: "Test listing",
    property_type: "House",
    subscription_status: "none",
    is_comp: false,
    stripe_subscription_id: null,
    parent_listing_id: null,
    address: "1 Main St",
    unit: null,
  },
  retrieveCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  persistProfile: vi.fn(),
  persistError: null as { message: string } | null,
  createPortal: vi.fn(),
  createCheckout: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: mocks.user } }),
    },
    from: (table: string) => {
      const result = () => {
        if (table === "profiles") {
          return { data: mocks.profile, error: mocks.profileError };
        }
        if (table === "listings") return { data: mocks.listing, error: null };
        return { data: null, error: null };
      };
      const builder = {
        select: () => builder,
        eq: () => builder,
        single: async () => result(),
      };
      return builder;
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (values: { stripe_customer_id: string }) => ({
        eq: async (column: string, userId: string) => {
          mocks.persistProfile(values, column, userId);
          return { error: mocks.persistError };
        },
      }),
    }),
  }),
}));

vi.mock("@/lib/stripe", () => ({
  PRICES: { single: "price_single", addon: "price_addon", commercial: "price_commercial" },
  siteUrl: () => "https://bluecollarhousing.com",
  stripe: {
    customers: {
      retrieve: mocks.retrieveCustomer,
      update: mocks.updateCustomer,
      list: mocks.listCustomers,
      create: mocks.createCustomer,
    },
    billingPortal: { sessions: { create: mocks.createPortal } },
    checkout: { sessions: { create: mocks.createCheckout } },
  },
}));

import { openBillingPortal, subscribeListing } from "./actions";

describe("Stripe customer authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_PAYMENTS_PAUSED = "0";
    mocks.user.id = "user-attacker";
    mocks.user.email = "attacker@example.com";
    mocks.user.email_confirmed_at = "2026-08-01T00:00:00.000Z";
    mocks.profile.stripe_customer_id = "cus_stored";
    mocks.profile.full_name = "Test User";
    mocks.profileError = null;
    mocks.persistError = null;
    mocks.listing.subscription_status = "none";
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_stored",
      deleted: false,
      email: "victim@example.com",
      metadata: { user_id: "user-victim" },
    });
    mocks.updateCustomer.mockImplementation(async (id: string, params: object) => ({
      id,
      deleted: false,
      email: "attacker@example.com",
      metadata: (params as { metadata: Record<string, string> }).metadata,
    }));
    mocks.listCustomers.mockResolvedValue({ data: [] });
    mocks.createCustomer.mockResolvedValue({
      id: "cus_created",
      deleted: false,
      metadata: { user_id: "user-attacker" },
    });
    mocks.createPortal.mockResolvedValue({ url: "https://billing.stripe.test/session" });
    mocks.createCheckout.mockResolvedValue({ url: "https://checkout.stripe.test/session" });
  });

  it("rejects a stored customer ID that belongs to another application user", async () => {
    const result = await openBillingPortal();

    expect(mocks.retrieveCustomer).toHaveBeenCalledWith("cus_stored");
    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });

  it("also rejects the foreign customer before creating a Checkout session", async () => {
    const result = await subscribeListing("listing-1");

    expect(mocks.retrieveCustomer).toHaveBeenCalledWith("cus_stored");
    expect(mocks.createCheckout).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });

  it("allows a customer explicitly bound to the authenticated user", async () => {
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_stored",
      deleted: false,
      email: "old-email@example.com",
      metadata: { user_id: "user-attacker" },
    });

    const result = await openBillingPortal();

    expect(mocks.createPortal).toHaveBeenCalledWith({
      customer: "cus_stored",
      return_url: "https://bluecollarhousing.com/dashboard",
    });
    expect(result).toEqual({ ok: true, url: "https://billing.stripe.test/session" });
  });

  it("rejects a deleted stored customer", async () => {
    mocks.retrieveCustomer.mockResolvedValue({ id: "cus_stored", deleted: true });

    const result = await openBillingPortal();

    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });

  it("rejects an unbound legacy customer whose email does not match", async () => {
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_stored",
      deleted: false,
      email: "victim@example.com",
      metadata: {},
    });

    const result = await openBillingPortal();

    expect(mocks.updateCustomer).not.toHaveBeenCalled();
    expect(mocks.persistProfile).not.toHaveBeenCalled();
    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });

  it("adopts a legacy customer only after its email matches the confirmed auth email", async () => {
    mocks.user.email = "  ATTACKER@example.com ";
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_stored",
      deleted: false,
      email: "attacker@example.com",
      metadata: {},
    });

    const result = await openBillingPortal();

    expect(mocks.updateCustomer).toHaveBeenCalledWith("cus_stored", {
      metadata: { user_id: "user-attacker" },
    });
    expect(mocks.persistProfile).toHaveBeenCalledWith(
      { stripe_customer_id: "cus_stored" },
      "id",
      "user-attacker",
    );
    expect(mocks.createPortal).toHaveBeenCalledWith({
      customer: "cus_stored",
      return_url: "https://bluecollarhousing.com/dashboard",
    });
    expect(result).toEqual({ ok: true, url: "https://billing.stripe.test/session" });
  });

  it("does not adopt an email-matched legacy customer when the auth email is unconfirmed", async () => {
    mocks.user.email_confirmed_at = "";
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_stored",
      deleted: false,
      email: "attacker@example.com",
      metadata: {},
    });

    const result = await openBillingPortal();

    expect(mocks.updateCustomer).not.toHaveBeenCalled();
    expect(mocks.persistProfile).not.toHaveBeenCalled();
    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });

  it("fails closed when a legacy customer binding cannot be persisted", async () => {
    mocks.retrieveCustomer.mockResolvedValue({
      id: "cus_stored",
      deleted: false,
      email: "attacker@example.com",
      metadata: {},
    });
    mocks.persistError = { message: "database unavailable" };

    const result = await openBillingPortal();

    expect(mocks.updateCustomer).toHaveBeenCalledWith("cus_stored", {
      metadata: { user_id: "user-attacker" },
    });
    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });

  it("fails closed when Stripe cannot retrieve the stored customer", async () => {
    mocks.retrieveCustomer.mockRejectedValue(new Error("Stripe unavailable"));

    const result = await openBillingPortal();

    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, error: BILLING_ACCOUNT_ERROR });
  });
});
