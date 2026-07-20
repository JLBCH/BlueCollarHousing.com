import Link from "next/link";
import { Inbox, Users, Ticket, List, Newspaper, Flag, Settings } from "lucide-react";

/** Tab nav shared across the admin pages. */
export function AdminNav({
  active,
}: {
  active: "queue" | "listings" | "accounts" | "coupons" | "blog" | "reports" | "settings";
}) {
  const tabs = [
    { key: "queue", href: "/admin", label: "Approval queue", icon: Inbox },
    { key: "listings", href: "/admin/listings", label: "All listings", icon: List },
    { key: "accounts", href: "/admin/accounts", label: "Landlords", icon: Users },
    { key: "coupons", href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { key: "blog", href: "/admin/blog", label: "Blog", icon: Newspaper },
    { key: "reports", href: "/admin/reports", label: "Reports", icon: Flag },
    { key: "settings", href: "/admin/settings", label: "Settings", icon: Settings },
  ] as const;
  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-line [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const on = t.key === active;
        const Icon = t.icon;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px] font-semibold transition ${
              on
                ? "border-orange text-navy"
                : "border-transparent text-muted hover:text-navy"
            }`}
          >
            <Icon className="h-4 w-4" /> {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
