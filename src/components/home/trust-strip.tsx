import { Home, PiggyBank, ShieldCheck, Headset } from "lucide-react";
import { Container } from "@/components/ui/container";

const ITEMS = [
  { icon: Home, title: "Built for blue-collar workers", sub: "Comfortable, move-in ready" },
  { icon: PiggyBank, title: "Better than hotels", sub: "More space, full kitchens" },
  { icon: ShieldCheck, title: "Trusted & verified", sub: "Every listing reviewed" },
  { icon: Headset, title: "Real support", sub: "Real people, real help" },
];

export function TrustStrip() {
  return (
    <div className="bg-navy text-white">
      <Container className="grid grid-cols-1 gap-2 py-7 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, sub }, i) => (
          <div
            key={title}
            className={cnBorder(i)}
          >
            <span className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[9px] bg-white/10 text-orange-tint">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <b className="block text-[14.5px] font-semibold">{title}</b>
              <span className="block text-[12.5px] text-[#aebfd0]">{sub}</span>
            </div>
          </div>
        ))}
      </Container>
    </div>
  );
}

// left divider only on lg screens, not on the first item
function cnBorder(i: number) {
  return [
    "flex items-center gap-3 px-3.5 py-1.5",
    i > 0 ? "lg:border-l lg:border-white/10" : "",
  ]
    .filter(Boolean)
    .join(" ");
}
