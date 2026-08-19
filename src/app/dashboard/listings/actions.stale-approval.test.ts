import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ListingInput } from "@/app/dashboard/listings/new/actions";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  geocodeAddress: vi.fn(),
  scopeOwner: vi.fn(),
  notifySubmitted: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/geo", () => ({ geocodeAddress: mocks.geocodeAddress }));
vi.mock("@/lib/listings/scope-owner", () => ({ scopeOwner: mocks.scopeOwner }));
vi.mock("@/lib/email/listing-submit-notify", () => ({
  notifyAdminListingSubmitted: mocks.notifySubmitted,
}));
vi.mock("@/lib/stripe", () => ({
  stripe: { subscriptions: { cancel: vi.fn() } },
}));

import { updateListing } from "./actions";
import { updateCommercialListing, type CommercialInput } from "./new/commercial-actions";

function validInput(): ListingInput {
  return {
    listingKind: "room",
    propertyType: "house",
    propertyTypeOther: "",
    title: "Furnished private room",
    description: "A furnished private room near local job sites.",
    nearbyProjects: "",
    streetAddress: "123 Main St",
    unit: "",
    city: "Roseville",
    state: "CA",
    zip: "95678",
    anonymizeAddress: true,
    rates: "$300/week",
    priceMonth: 1300,
    rateAmount: 300,
    rateBilled: "weekly",
    bedrooms: 1,
    bedroomType: "",
    bathrooms: 1,
    utilitiesIncluded: true,
    petPolicy: "no",
    internet: "wifi",
    laundry: "in_unit",
    amenities: [],
    houseRules: "",
    paymentMethods: "",
    contactPhone: "5551234567",
    showPhone: true,
    contactEmail: "owner@example.com",
    showEmail: false,
    allowContactForm: true,
    photos: [],
    roomDetails: {
      household: "all_renters",
      householdNote: "",
      bathroom: "shared",
      shared: [],
      sharedNote: "",
    },
    submit: true,
  };
}

function validCommercialInput(): CommercialInput {
  return {
    type: "rv_park",
    name: "Roseville RV Park",
    streetAddress: "123 Main St",
    city: "Roseville",
    state: "CA",
    zip: "95678",
    description: "RV spaces near local job sites.",
    nearbyProjects: "",
    anonymizeAddress: true,
    details: {},
    petPolicy: "no",
    rates: "$300/week",
    contactPhone: "5551234567",
    showPhone: true,
    contactEmail: "owner@example.com",
    showEmail: false,
    allowContactForm: true,
    photos: [],
    submit: true,
  };
}

describe("updateListing approval concurrency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.geocodeAddress.mockResolvedValue(null);
    mocks.scopeOwner.mockResolvedValue("owner-1");
    mocks.notifySubmitted.mockResolvedValue(undefined);
  });

  it("does not undo an admin approval when a stale pre-approval page submits afterward", async () => {
    let writtenPatch: Record<string, unknown> | undefined;
    let listingQueryCount = 0;
    const updateFilters: [string, unknown][] = [];

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "owner-1", email: "owner@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        expect(table).toBe("listings");
        listingQueryCount += 1;

        if (listingQueryCount === 1) {
          const readQuery = {
            select: vi.fn(),
            eq: vi.fn(),
            single: vi.fn().mockResolvedValue({
              // Joe approved and comped the listing after this browser page
              // loaded, so the database is newer than currentStatus below.
              data: {
                photos: [],
                status: "approved",
                reviewed_at: "2026-08-19T01:17:55.348Z",
              },
              error: null,
            }),
          };
          readQuery.select.mockReturnValue(readQuery);
          readQuery.eq.mockReturnValue(readQuery);
          return readQuery;
        }

        const updateQuery = {
          update: vi.fn(),
          eq: vi.fn(),
          select: vi.fn(),
        };
        updateQuery.update.mockImplementation((patch: Record<string, unknown>) => {
          writtenPatch = patch;
          return updateQuery;
        });
        updateQuery.eq.mockImplementation((column: string, value: unknown) => {
          updateFilters.push([column, value]);
          return updateQuery;
        });
        updateQuery.select.mockImplementation(async () => ({
          data: [{ id: "listing-1", status: writtenPatch?.status }],
          error: null,
        }));
        return updateQuery;
      }),
      storage: {
        from: vi.fn(() => ({ remove: vi.fn() })),
      },
    };
    mocks.createClient.mockResolvedValue(supabase);

    const result = await updateListing(
      "listing-1",
      validInput(),
      "pending", // stale status rendered before the admin approval
    );

    expect(result).toEqual({ ok: true });
    expect(writtenPatch?.status).toBe("approved");
    expect(updateFilters).toContainEqual(["status", "approved"]);
    expect(updateFilters).toContainEqual(["reviewed_at", "2026-08-19T01:17:55.348Z"]);
    expect(mocks.notifySubmitted).not.toHaveBeenCalled();
  });

  it("refuses an owner write when an admin decision changes after the status read", async () => {
    let writtenPatch: Record<string, unknown> | undefined;
    let listingQueryCount = 0;
    const updateFilters: [string, unknown][] = [];
    const observedReviewTime = "2026-08-19T01:17:55.348Z";

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "owner-1", email: "owner@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        expect(table).toBe("listings");
        listingQueryCount += 1;

        if (listingQueryCount === 1) {
          const readQuery = {
            select: vi.fn(),
            eq: vi.fn(),
            single: vi.fn().mockResolvedValue({
              data: { photos: [], status: "approved", reviewed_at: observedReviewTime },
              error: null,
            }),
          };
          readQuery.select.mockReturnValue(readQuery);
          readQuery.eq.mockReturnValue(readQuery);
          return readQuery;
        }

        const updateQuery = {
          update: vi.fn(),
          eq: vi.fn(),
          select: vi.fn(),
        };
        updateQuery.update.mockImplementation((patch: Record<string, unknown>) => {
          writtenPatch = patch;
          return updateQuery;
        });
        updateQuery.eq.mockImplementation((column: string, value: unknown) => {
          updateFilters.push([column, value]);
          return updateQuery;
        });
        updateQuery.select.mockImplementation(async () => {
          const guardedAgainstTheObservedDecision =
            updateFilters.some(([column, value]) => column === "status" && value === "approved") &&
            updateFilters.some(
              ([column, value]) => column === "reviewed_at" && value === observedReviewTime,
            );

          // A second admin approval changed reviewed_at after the action's read.
          // PostgreSQL returns no row only when the update carries both guards.
          return guardedAgainstTheObservedDecision
            ? { data: [], error: null }
            : { data: [{ id: "listing-1", status: writtenPatch?.status }], error: null };
        });
        return updateQuery;
      }),
      storage: {
        from: vi.fn(() => ({ remove: vi.fn() })),
      },
    };
    mocks.createClient.mockResolvedValue(supabase);

    const result = await updateListing("listing-1", validInput(), "pending");

    expect(result).toEqual({
      ok: false,
      error: "This listing changed while you were editing. Refresh the page and try again.",
    });
    expect(mocks.notifySubmitted).not.toHaveBeenCalled();
  });

  it("applies the same stale approval guard to commercial listing edits", async () => {
    let writtenPatch: Record<string, unknown> | undefined;
    let listingQueryCount = 0;
    const updateFilters: [string, unknown][] = [];

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "owner-1", email: "owner@example.com" } },
        }),
      },
      from: vi.fn((table: string) => {
        expect(table).toBe("listings");
        listingQueryCount += 1;

        if (listingQueryCount === 1) {
          const readQuery = {
            select: vi.fn(),
            eq: vi.fn(),
            single: vi.fn().mockResolvedValue({
              data: {
                photos: [],
                status: "approved",
                reviewed_at: "2026-08-19T01:17:55.348Z",
              },
              error: null,
            }),
          };
          readQuery.select.mockReturnValue(readQuery);
          readQuery.eq.mockReturnValue(readQuery);
          return readQuery;
        }

        const updateQuery = {
          update: vi.fn(),
          eq: vi.fn(),
          select: vi.fn(),
        };
        updateQuery.update.mockImplementation((patch: Record<string, unknown>) => {
          writtenPatch = patch;
          return updateQuery;
        });
        updateQuery.eq.mockImplementation((column: string, value: unknown) => {
          updateFilters.push([column, value]);
          return updateQuery;
        });
        updateQuery.select.mockImplementation(async () => ({
          data: [{ id: "listing-1", status: writtenPatch?.status }],
          error: null,
        }));
        return updateQuery;
      }),
      storage: {
        from: vi.fn(() => ({ remove: vi.fn() })),
      },
    };
    mocks.createClient.mockResolvedValue(supabase);

    const result = await updateCommercialListing(
      "listing-1",
      validCommercialInput(),
      "pending",
    );

    expect(result).toEqual({ ok: true });
    expect(writtenPatch?.status).toBe("approved");
    expect(updateFilters).toContainEqual(["status", "approved"]);
    expect(updateFilters).toContainEqual(["reviewed_at", "2026-08-19T01:17:55.348Z"]);
    expect(mocks.notifySubmitted).not.toHaveBeenCalled();
  });
});
