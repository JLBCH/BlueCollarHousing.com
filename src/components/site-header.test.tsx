// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

afterEach(cleanup);

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
  }),
}));

import { SiteHeader } from "./site-header";

describe("desktop 'For Landlords' dropdown", () => {
  it("releases focus when a sub-item is clicked, so the CSS menu can close", () => {
    // The dropdown opens via group-hover OR group-focus-within. Client-side
    // navigation keeps the header mounted, so if the clicked link KEEPS focus,
    // focus-within pins the menu open until the user clicks elsewhere (the
    // reported bug). Browsers focus a link on mousedown before click — mirror
    // that sequence, then assert focus has left the dropdown.
    render(<SiteHeader />);
    const pricing = screen.getByRole("link", { name: "Pricing" });
    pricing.focus();
    expect(document.activeElement).toBe(pricing); // sanity: focus really was inside
    fireEvent.click(pricing);
    expect(document.activeElement).not.toBe(pricing);
  });
});
