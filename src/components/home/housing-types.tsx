import Link from "next/link";
import { Home, TreePine, Caravan, Building, Warehouse, Building2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHead } from "@/components/ui/section-head";

const TYPES = [
  { label: "Houses", icon: Home, q: "house" },
  { label: "Cabins", icon: TreePine, q: "cabin" },
  { label: "RV Spaces", icon: Caravan, q: "rv" },
  { label: "Duplexes", icon: Building, q: "duplex" },
  { label: "Mobile Homes", icon: Warehouse, q: "mobile-home" },
  { label: "Apartments", icon: Building2, q: "apartment" },
];

export function HousingTypes() {
  return (
    <section className="bg-bg-soft py-16 sm:py-20">
      <SectionHead eyebrow="Browse" title="Housing types that fit the job">
        From a private room for a two-week turnaround to a whole house for the
        crew.
      </SectionHead>

      <Container className="mt-11 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TYPES.map(({ label, icon: Icon, q }) => (
          <Link
            key={label}
            href={`/search?type=${q}`}
            className="group overflow-hidden rounded-xl border border-line bg-white text-center transition-[transform,box-shadow] duration-150 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(16,32,48,0.1)]"
          >
            <div className="grid h-24 place-items-center bg-navy text-white">
              <Icon className="h-9 w-9 opacity-90" strokeWidth={1.6} />
            </div>
            <span className="block px-1.5 py-3.5 text-[14.5px] font-semibold text-navy">
              {label}
            </span>
          </Link>
        ))}
      </Container>
    </section>
  );
}
