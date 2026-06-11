import Link from "next/link";
import { ShieldCheck, Lock, BadgeDollarSign, HardHat } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/brand/logo";

const TRUST = [
  { icon: ShieldCheck, title: "Verified properties", sub: "Quality you can count on" },
  { icon: Lock, title: "Secure & private", sub: "Your info stays safe" },
  { icon: BadgeDollarSign, title: "No hidden fees", sub: "Transparent pricing" },
  { icon: HardHat, title: "Built for workers", sub: "By people who get it" },
];

const COLUMNS = [
  {
    heading: "Workers",
    links: [
      { href: "/search", label: "Find Housing" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    heading: "Property Owners",
    links: [
      { href: "/list-your-property", label: "List My Property" },
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
      {/* trust strip */}
      <div className="border-b border-white/10">
        <Container className="grid grid-cols-2 gap-5 py-7 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <Icon className="h-5.5 w-5.5 flex-shrink-0 text-orange-tint" />
              <div>
                <b className="block text-[14px] text-white">{title}</b>
                <span className="text-[12.5px]">{sub}</span>
              </div>
            </div>
          ))}
        </Container>
      </div>

      {/* main footer */}
      <Container className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo inverted />
          <p className="mt-4 max-w-[34ch] leading-relaxed">
            Furnished housing for the people who keep America working. Hotel
            alternatives, extended-stay houses, refinery and oilfield lodging, RV
            spots and crew housing for turnarounds, shutdowns and out-of-town work.
          </p>
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
            Hotel alternative · Extended stay · Refinery &amp; oilfield housing · RV
            spots · Turnaround &amp; shutdown lodging
          </span>
        </Container>
      </div>
    </footer>
  );
}
