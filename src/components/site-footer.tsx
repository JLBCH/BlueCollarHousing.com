import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  {
    heading: "Workers",
    links: [
      { href: "/search", label: "Find Housing" },
      { href: "/help-me-find", label: "Help Me Find a Place" },
      { href: "/worker-faq", label: "Worker FAQ" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    heading: "Property Owners",
    links: [
      { href: "/list-your-property", label: "Pricing" },
      { href: "/landlords", label: "Landlords" },
      { href: "/landlord-faq", label: "Landlord FAQ" },
      { href: "/login", label: "Log In" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/terms", label: "Terms & Privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-navy-deep text-[14px] text-[#9fb1c4]">
      {/* main footer */}
      <Container className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo inverted className="h-[60px]" />
          <p className="mt-4 max-w-[42ch] leading-relaxed">
            Furnished housing for people working away from home for months on
            end. Furnished houses, cabins, campers, apartments, or any other type
            living quarters. RV spots, campground and RV parks, hotels and
            multifamily properties.
          </p>
          <Button href="/list-your-property" variant="orange" className="mt-5">
            List My Property
          </Button>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <h4 className="mb-4 text-[13px] font-bold uppercase tracking-[0.1em] text-white">
              {col.heading}
            </h4>
            {col.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block py-[5px] hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </Container>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <Container className="flex flex-wrap justify-between gap-2.5 py-5 text-[13px]">
          <span>© 2026 BlueCollarHousing.com · All rights reserved</span>
          <span>
            Furnished monthly rentals · Weekly furnished rentals
          </span>
        </Container>
      </div>
    </footer>
  );
}
