"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

// Tabs organized into clear groups: worker, landlord (grouped under one menu),
// then company. The logo links home, so there's no separate Home tab.
const WORKER = [
  { href: "/search", label: "Find Housing" },
  { href: "/worker-faq", label: "Worker FAQ" },
];
const LANDLORD = [
  { href: "/landlords", label: "Landlords" },
  { href: "/list-your-property", label: "Pricing" },
  { href: "/landlord-faq", label: "Landlord FAQ" },
];
const COMPANY = [
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

const linkCls = "text-[14.5px] font-medium text-[#33445a] hover:text-orange";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <Container className="flex h-[92px] items-center justify-between gap-6">
        <Logo className="h-[52px] sm:h-[60px] lg:h-[64px]" />

        {/* desktop nav */}
        <nav className="hidden items-center gap-x-6 lg:flex">
          {WORKER.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {l.label}
            </Link>
          ))}

          {/* For Landlords dropdown */}
          <div className="group relative">
            <button
              type="button"
              className={`flex items-center gap-1 ${linkCls}`}
            >
              For Landlords
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="min-w-[190px] rounded-xl border border-line bg-white py-1.5 shadow-[0_12px_32px_rgba(16,32,48,0.14)]">
                {LANDLORD.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block px-4 py-2.5 text-[14.5px] font-medium text-[#33445a] hover:bg-bg-soft hover:text-orange"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {COMPANY.map((l) => (
            <Link key={l.href} href={l.href} className={linkCls}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* desktop actions */}
        <div className="hidden items-center gap-3.5 lg:flex">
          <Link
            href="/login"
            className="text-[14.5px] font-semibold text-navy hover:text-orange"
          >
            Log In
          </Link>
          <Button href="/list-your-property" variant="orange">
            List My Property
          </Button>
        </div>

        {/* mobile toggle */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="grid h-11 w-11 place-items-center lg:hidden"
        >
          <Menu className="h-6 w-6 text-navy" />
        </button>
      </Container>

      {/* mobile menu */}
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-navy-deep px-6 py-6 text-white lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="self-end"
          >
            <X className="h-8 w-8" />
          </button>

          <MobileGroup label="For Workers" links={WORKER} onNav={() => setOpen(false)} />
          <MobileGroup label="For Landlords" links={LANDLORD} onNav={() => setOpen(false)} />
          <MobileGroup label="Company" links={COMPANY} onNav={() => setOpen(false)} />

          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-display border-b border-white/10 py-3 text-xl uppercase"
          >
            Log In
          </Link>
          <Button
            href="/list-your-property"
            variant="orange"
            size="lg"
            className="mt-5 w-full"
            onClick={() => setOpen(false)}
          >
            List My Property
          </Button>
        </div>
      )}
    </header>
  );
}

function MobileGroup({
  label,
  links,
  onNav,
}: {
  label: string;
  links: { href: string; label: string }[];
  onNav: () => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-orange-tint">
        {label}
      </p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          onClick={onNav}
          className="font-display block border-b border-white/10 py-2.5 text-lg"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
