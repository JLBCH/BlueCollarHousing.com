import type { Metadata } from "next";
import { ShieldCheck, BadgeCheck, Wallet, Home } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Quote } from "@/components/home/quote";

export const metadata: Metadata = {
  title: "Landlords",
  description:
    "Built by landlords for landlords. Reach the traveling industrial workforce who need furnished weekly and monthly rentals near the job.",
};

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: "Drug tested on the job" },
  { icon: BadgeCheck, label: "Many carry TWIC cards" },
  { icon: Wallet, label: "Good money, pay on time" },
  { icon: Home, label: "Prefer weekly, steadier cash flow" },
];

// Landlord page content.
const PARAS = [
  "As landlords ourselves, our tenants have always been the skilled traveling tradesmen and professionals who work away from home: welders, pipefitters, boilermakers, electricians, ironworkers, millwrights and instrumentation techs working refineries, petrochemical plants, pipelines, nuclear power plant outages, data centers, shipyards, wind and solar farms, and major commercial construction projects. Travel nurses, traveling healthcare professionals and other corporate travelers are also a significant part of this audience, giving landlords an even broader pool of potential tenants.",
  "These are not your average renters. On most industrial jobs workers are drug tested before they ever set foot on site. Many carry TWIC cards, federal credentials that require a background check to obtain. They earn good money plus per diem, pay on time, and in our experience the vast majority are respectful of the property and among the most hassle free tenants you will find. Most are self sufficient, no nonsense people. They are not high maintenance renters. Your rental does not need to be magazine ready, it needs to be clean, furnished and close to the job. These workers understand that and respect it. Most prefer to pay weekly rather than monthly, which means more frequent and consistent cash flow for you.",
  "Most of them are on the road constantly, moving from turnaround to shutdown to expansion to outage, job after job, month after month. They do not want to sign a long lease. They do not want to set up utilities. They want a furnished place close to the job site where they can decompress after a twelve hour shift, crack open a beer, cook their own food, and feel like a human being.",
  "Some workers are perfectly happy in a hotel and that is completely fine. BlueCollarHousing welcomes hotels and extended stay properties too. But many tradesmen prefer something that feels more like home. A house, an apartment, a cabin, a mobile home, a travel trailer, a garage apartment, a private room or an RV spot, all kinds of spaces work for these guys and all are welcome here.",
  "That is why BlueCollarHousing.com exists. To make sure traveling workers have options and can find the right place from day one.",
  "If you are a landlord who already rents to industrial workers you know exactly what we are talking about. If you own property in an area with significant industrial activity, refineries, plants, pipelines, data centers, nuclear facilities, shipyards, or anywhere commercial construction and development projects bring large crews of traveling workers, furnished weekly and monthly rentals can significantly increase your revenue while giving you a more self sufficient and hassle free tenant than you might expect.",
];

export default function LandlordsPage() {
  return (
    <>
      <section className="py-16 sm:py-20">
        <Container className="max-w-[760px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            For landlords
          </p>
          <h1 className="font-display mt-3 text-balance text-[40px] font-bold text-navy sm:text-[52px]">
            Why Blue Collar Housing exists
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] text-muted">
            Built by landlords, for landlords who understand the needs of those
            working on the road.
          </p>
        </Container>
      </section>

      <Quote />

      <section className="py-16 sm:py-20">
        <Container className="max-w-[760px]">
          <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="rounded-card border border-line bg-white p-4 text-center"
              >
                <Icon className="mx-auto h-6 w-6 text-orange" />
                <p className="mt-2 text-[12.5px] font-semibold leading-snug text-navy">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5">
            {PARAS.map((p, i) => (
              <p key={i} className="text-[16px] leading-relaxed text-[#2a3744]">
                {p}
              </p>
            ))}
            <p className="font-display text-[20px] font-bold text-navy">
              Either way, this is your platform.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button href="/list-your-property" variant="orange" size="lg">
              List My Property
            </Button>
            <Button href="/landlord-faq" variant="outline" size="lg">
              Landlord FAQ
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
