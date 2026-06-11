"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Find Housing" },
  { href: "/landlords", label: "Landlords" },
  { href: "/landlord-faq", label: "Landlord FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* top utility bar */}
      <div className="hidden bg-navy-deep text-[13px] text-[#cdd9e6] md:block">
        <Container className="flex h-[38px] items-center justify-between">
          <span>Furnished housing for the people who keep America working.</span>
          <div className="flex items-center gap-5">
            <a
              href="tel:18886807368"
              className="flex items-center gap-1.5 font-medium text-[#e7eef6] hover:text-white"
            >
              <Phone className="h-3.5 w-3.5" /> (888) 680-7368
            </a>
          </div>
        </Container>
      </div>

      {/* main nav */}
      <header className="sticky top-0 z-50 border-b border-line bg-white">
        <Container className="flex h-[72px] items-center justify-between gap-5">
          <Logo />

          <nav className="hidden items-center gap-x-5 xl:flex">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[14.5px] font-medium text-[#33445a] hover:text-orange"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3.5 xl:flex">
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

          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center xl:hidden"
          >
            <Menu className="h-6 w-6 text-navy" />
          </button>
        </Container>
      </header>

      {/* mobile menu */}
      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col gap-1 overflow-y-auto bg-navy-deep px-6 py-6 text-white xl:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="self-end"
          >
            <X className="h-8 w-8" />
          </button>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display border-b border-white/10 py-3 text-xl uppercase"
            >
              {l.label}
            </Link>
          ))}
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
            className="mt-4 w-full"
          >
            List My Property
          </Button>
        </div>
      )}
    </>
  );
}
