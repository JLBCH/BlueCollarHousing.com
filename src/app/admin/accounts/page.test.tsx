import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listUsers: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { listUsers: mocks.listUsers } },
  }),
}));

vi.mock("@/components/admin/admin-nav", () => ({
  AdminNav: () => <nav>Admin navigation</nav>,
}));

vi.mock("@/components/admin/delete-account-button", () => ({
  DeleteAccountButton: () => <button type="button">Delete</button>,
}));

import AdminAccountsPage from "./page";

afterEach(cleanup);

function makeSupabase() {
  const profiles = [
    {
      id: "verified-user",
      full_name: "Verified Owner",
      email: "verified@example.com",
      phone: null,
      role: "landlord",
      created_at: "2026-08-01T00:00:00.000Z",
    },
    {
      id: "unverified-user",
      full_name: "Unverified Owner",
      email: "unverified@example.com",
      phone: null,
      role: "landlord",
      created_at: "2026-08-02T00:00:00.000Z",
    },
  ];

  return {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: profiles }),
          }),
        };
      }

      return {
        select: (_columns: string, options?: { head?: boolean }) =>
          options?.head
            ? { eq: () => Promise.resolve({ count: 0 }) }
            : { not: () => Promise.resolve({ data: [] }) },
      };
    }),
  };
}

describe("AdminAccountsPage", () => {
  beforeEach(() => {
    mocks.requireAdmin.mockResolvedValue({ supabase: makeSupabase() });
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: "verified-user", email_confirmed_at: "2026-08-01T01:00:00.000Z" },
          { id: "unverified-user", email_confirmed_at: null },
        ],
      },
      error: null,
    });
  });

  it("shows whether each visible profile has verified its email", async () => {
    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("columnheader", { name: "Email status" })).toBeInTheDocument();
    const verifiedRow = screen.getByText("verified@example.com").closest("tr");
    const unverifiedRow = screen.getByText("unverified@example.com").closest("tr");

    expect(verifiedRow).not.toBeNull();
    expect(unverifiedRow).not.toBeNull();
    expect(within(verifiedRow!).getByText("Verified")).toBeInTheDocument();
    expect(within(verifiedRow!).queryByText("Unverified")).not.toBeInTheDocument();
    expect(within(unverifiedRow!).getByText("Unverified")).toBeInTheDocument();
    expect(within(unverifiedRow!).queryByText("Verified")).not.toBeInTheDocument();
  });

  it("shows Unknown for every row when Auth returns an error", async () => {
    mocks.listUsers.mockResolvedValue({
      data: { users: [] },
      error: { message: "Auth is unavailable" },
    });

    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));

    const verifiedRow = screen.getByText("verified@example.com").closest("tr");
    const unverifiedRow = screen.getByText("unverified@example.com").closest("tr");
    expect(within(verifiedRow!).getByText("Unknown")).toBeInTheDocument();
    expect(within(unverifiedRow!).getByText("Unknown")).toBeInTheDocument();
  });

  it("shows Unknown for every row when the Auth lookup throws", async () => {
    mocks.listUsers.mockRejectedValue(new Error("Auth network failure"));

    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));

    const verifiedRow = screen.getByText("verified@example.com").closest("tr");
    const unverifiedRow = screen.getByText("unverified@example.com").closest("tr");
    expect(within(verifiedRow!).getByText("Unknown")).toBeInTheDocument();
    expect(within(unverifiedRow!).getByText("Unknown")).toBeInTheDocument();
  });
});
