import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Landlord FAQ",
  description:
    "Answers for property owners listing on BlueCollarHousing: how it works, pricing, tenants, payments and more.",
};

// Landlord FAQ content.
const FAQS: { q: string; a: string[] }[] = [
  {
    q: "What makes BlueCollarHousing different from vacation and corporate rental sites?",
    a: [
      "We are built specifically for the industrial workforce, the crews working turnarounds, shutdowns, outages, expansions, pipelines, data centers, shipyards and major commercial construction projects. That is our primary audience and our primary focus. Travel nurses, healthcare professionals and corporate travelers are also welcome and make up a meaningful part of our user base, but if you are looking to reach industrial tradesmen specifically, there is no better place to list your property.",
    ],
  },
  {
    q: "Why not simply list my property on one of the many vacation or corporate rental sites?",
    a: [
      "Most blue collar workers do not use those sites and here is why. Vacationers know exactly when they will arrive and exactly when they will depart, making reservations easy. Blue collar workers usually do not have that information. They know when they are checking in but have no idea if they will be there for four weeks or a year. In our experience they almost always stay longer than they tell you up front, which is a good thing. But that makes the reservation model completely unworkable. Nobody wants to tell a good paying long term tenant to leave to make way for a reservation.",
      "The workers who do use Airbnb and similar sites often get burned, hosts kick them out for spring break, holidays or any event where they can charge more. That does not happen here. Once your tenant is in and paying rent that place is theirs until they are ready to check out.",
      "The other reason is communication and control. Potential tenants view your listing and if it looks like a good fit they call or email you directly. We simply put your property in front of people working in your area who need a place to stay. Who you rent to, what you charge, what forms of payment you accept and your house rules and policies are entirely up to you.",
    ],
  },
  {
    q: "Do you have a calendar?",
    a: [
      "No. And that is intentional.",
      "Many platforms, even ones that do not do traditional bookings, require landlords to maintain an availability calendar. If you do not keep it updated you stop getting leads. That is a hassle nobody needs, and it creates a real problem. Your tenant could have just gotten laid off and has not told you yet. Meanwhile your calendar still shows unavailable and a potential tenant who would have called you never does. You just lost a lead you did not even know about.",
      "On BlueCollarHousing your listing is simply here. Always visible, always findable. There is no available or unavailable status to manage. If someone sees your listing and calls you and it turns out you are full right now, that is fine. Take their number, add them to your waiting list and call them when something opens up. The point is you deserve every lead that comes your way whether you have availability or not. We are not going to let an outdated calendar stand between you and a potential tenant.",
    ],
  },
  {
    q: "Why not just use Craigslist?",
    a: [
      "Craigslist works and we use it ourselves. But Craigslist is for everyone, thousands of listings across dozens of categories, constantly pushing your ad down the page. Workers in the field do not always have time to sift through all of that and if they do not use exactly the right search terms they may never find you. BlueCollarHousing is focused entirely on this audience. Every person who visits this site is either a traveling worker looking for a place to stay or a landlord who wants to rent to them. No noise, no clutter, no competition from unrelated listings.",
    ],
  },
  {
    q: "I already have a waiting list. Why do I need this?",
    a: [
      "We have waiting lists too. Here is the honest reality, that list is essentially useless unless you can call someone back within 24 hours. And even then it depends.",
      "A lot of these guys find out they are going to a job with very little notice. Sometimes just a few hours. They call on the way to town. By the time your unit opens up and you work down that list the people you reach have already found somewhere else. The ones who were calling ahead and planning in advance are the exception not the rule. The nature of this business is last minute.",
      "Meanwhile your unit is sitting empty. Our weekly rates run from $295 to $500 per week, averaging around $400. That is roughly $1,300 to $2,200 per month depending on the unit. A vacancy of two or three weeks happens a few times a year and suddenly you have lost thousands of dollars in rental income before you know it.",
      "At the same time there are workers sitting in hotels right now who would move into your place tomorrow if they knew it existed. BlueCollarHousing closes that gap.",
    ],
  },
  {
    q: "How do I get started?",
    a: [
      "Simply head to the List My Property page, choose your subscription plan and create your listing. The whole process takes about fifteen minutes. Once you submit your listing it goes through a quick review and once approved it goes live and starts working for you immediately.",
    ],
  },
  {
    q: "What makes a good listing?",
    a: [
      "The landlords who get the most calls are the ones who put in the effort upfront. A clear descriptive title, a detailed description of the property, accurate amenities, your rates and most importantly good photos. We highly recommend professional photos, listings with professional photos rent faster and for more. Also take advantage of the nearby projects and facilities field. Tell workers what is going on in your area, refineries, turnarounds, pipelines, plant expansions. The more specific you are the more the right workers will find you.",
    ],
  },
  {
    q: "Can I edit my listing after it goes live?",
    a: [
      "Yes. You can log into your account and update your listing anytime. We encourage you to keep your nearby projects and facilities section current as industrial activity in your area changes.",
    ],
  },
  {
    q: "Do you screen tenants?",
    a: [
      "We do not screen tenants on your behalf, that is your call as the landlord. That said a simple phone conversation before committing to a rental can tell you a lot about a person. The right questions about where they are working, who they work for, how long they expect to be in the area and how they prefer to pay can give you a pretty good read on someone before they ever show up at your door. Most industrial workers are also drug tested on the job and many carry TWIC cards, that alone filters out a significant portion of potential problem renters. Ultimately who you rent to is your decision and yours alone.",
    ],
  },
  {
    q: "Do you offer refunds?",
    a: [
      "All subscriptions are annual and non refundable with one exception, if your listing is reviewed and not approved by our admin team you will receive a full refund. We review every listing before it goes live to maintain the quality and credibility of the platform. If your listing is rejected you will be notified with an explanation of what needs to be addressed, and you are welcome to resubmit.",
    ],
  },
  {
    q: "Do I need a furnished property to list?",
    a: [
      "For houses, apartments, cabins, mobile homes and similar properties, yes. BlueCollarHousing is specifically for furnished or semi furnished weekly and monthly rentals. Traveling workers need a place they can move into without buying furniture or setting up utilities. That said furnished means different things to different landlords. Some provide a fully equipped home right down to linens and kitchenware. Others provide the basics, beds, a couch, a table, a functioning kitchen. Workers in this space are generally practical and understanding about what furnished means as long as the listing is honest about what is and is not included. Be clear in your listing description about exactly what you provide so workers know what to expect before they call.",
      "RV spots, camper pads and RV parks are a different story entirely, those are absolutely welcome on BlueCollarHousing and obviously do not require furnishing. Many traveling workers bring their own camper or travel trailer and simply need a spot with hookups. If you have that we want you here.",
    ],
  },
  {
    q: "Can I list a property that is not move in ready yet?",
    a: [
      "Yes. You can create your listing in advance and submit it for approval before the property is available. Just be clear in your listing description about when the property will be ready. Workers plan ahead when they can and having your listing visible early means you could have a tenant lined up before the unit is even available.",
    ],
  },
  {
    q: "How do workers typically pay rent?",
    a: [
      "That is entirely between you and your tenant, we do not handle payments between landlords and renters. Most landlords in this space accept a combination of cash, Zelle, Venmo, CashApp and sometimes card. When you create your listing there is a payment methods field where you can let workers know exactly how you prefer to be paid. As for frequency, weekly is the most common arrangement but monthly, every 28 days (four weeks) or whatever works for both parties is perfectly fine. You set the terms that work for your situation.",
    ],
  },
  {
    q: "What if my property is not in a major industrial area?",
    a: [
      "Do not count yourself out. Industrial activity exists across the entire country, refineries, pipelines, data centers, nuclear facilities, wind farms, commercial construction projects and more. Even smaller markets have projects that bring traveling workers to town. List your property and let the workers find you. You may be surprised how much activity is happening right in your backyard.",
    ],
  },
  {
    q: "Is this a national site?",
    a: [
      "Yes. BlueCollarHousing is nationwide from day one. Workers travel all over the country following the work and landlords from every state are welcome to list. Whether you are in Texas, Louisiana, California, Kansas or anywhere in between this is your platform.",
    ],
  },
  {
    q: "I have multiple properties, an RV park or a multifamily property. Can I list them all?",
    a: [
      "Absolutely. All property types are welcome, houses, apartments, cabins, mobile homes, travel trailers, RV spots, RV parks, hotels, extended stay properties and everything in between. List as many properties as you have. Each listing is managed separately so you can keep details, photos and availability current for each one.",
    ],
  },
];

export default function LandlordFaqPage() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-[800px]">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Landlord FAQ
          </p>
          <h1 className="font-display mt-3 text-[36px] font-bold text-navy sm:text-[44px]">
            Questions from property owners
          </h1>
        </div>

        <div className="mt-10 grid gap-3">
          {FAQS.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-card border border-line bg-white px-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 text-[16px] font-semibold text-navy">
                {q}
                <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="grid gap-3 pb-5">
                {a.map((para, i) => (
                  <p key={i} className="text-[14.5px] leading-relaxed text-[#3a4a5a]">
                    {para}
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button href="/list-your-property" variant="orange" size="lg">
            List My Property
          </Button>
        </div>
      </Container>
    </section>
  );
}
