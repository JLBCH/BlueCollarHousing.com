"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, DoorOpen, ImageUp, Save, Send } from "lucide-react";
import {
  BUILDER_PROPERTY_TYPES,
  AMENITY_OPTIONS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/listings/types";
import { createListing, type ListingInput } from "@/app/dashboard/listings/new/actions";
import { cn } from "@/lib/cn";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";
const label = "mb-1.5 block text-[13.5px] font-semibold text-navy";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-orange text-[13px] font-bold text-white">
          {n}
        </span>
        <h2 className="font-display text-[15px] font-bold uppercase tracking-wide text-navy">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/** Radio group rendered as selectable pills. */
function Pills({
  name, value, onChange, options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition",
            value === o.value
              ? "border-orange bg-orange-tint/40 text-navy"
              : "border-line bg-bg-soft text-[#3a4a5a] hover:border-navy/30",
          )}
        >
          <span className={cn("grid h-4 w-4 place-items-center rounded-full border", value === o.value ? "border-orange" : "border-muted")}>
            {value === o.value && <span className="h-2 w-2 rounded-full bg-orange" />}
          </span>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ListingBuilder() {
  const router = useRouter();
  const [f, setF] = useState({
    listingKind: "" as "" | "entire" | "room",
    propertyType: "",
    title: "",
    description: "",
    nearbyProjects: "",
    streetAddress: "",
    unit: "",
    city: "",
    state: "",
    zip: "",
    anonymizeAddress: "yes", // yes = city/zip only
    rates: "",
    priceMonth: "",
    bedrooms: "",
    bathrooms: "",
    utilitiesIncluded: "",
    petPolicy: "",
    internet: "",
    laundry: "",
    amenities: [] as string[],
    paymentMethods: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "draft" | "submit">(null);

  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (a: string) =>
    setF((p) => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter((x) => x !== a)
        : [...p.amenities, a],
    }));

  async function save(submit: boolean) {
    setError(null);
    if (!f.listingKind) return setError("Please choose what you are listing.");
    if (!f.propertyType) return setError("Please select a property type.");
    if (!f.title.trim()) return setError("Please add a listing title.");
    if (!f.description.trim()) return setError("Please add a description.");
    if (!f.city.trim() || !f.state || !f.zip.trim())
      return setError("Please complete the property address (city, state, zip).");
    if (!f.rates.trim()) return setError("Please add your rates.");

    setBusy(submit ? "submit" : "draft");
    const payload: ListingInput = {
      listingKind: f.listingKind as "entire" | "room",
      propertyType: f.propertyType,
      title: f.title,
      description: f.description,
      nearbyProjects: f.nearbyProjects,
      streetAddress: f.streetAddress,
      unit: f.unit,
      city: f.city,
      state: f.state,
      zip: f.zip,
      anonymizeAddress: f.anonymizeAddress === "yes",
      rates: f.rates,
      priceMonth: f.priceMonth ? Number(f.priceMonth) : null,
      bedrooms: Number(f.bedrooms) || 0,
      bathrooms: Number(f.bathrooms) || 0,
      utilitiesIncluded: f.utilitiesIncluded === "yes",
      petPolicy: (f.petPolicy || "no") as "allowed" | "no" | "case_by_case",
      internet: (f.internet || "none") as "wifi" | "wired" | "none",
      laundry: (f.laundry || "none") as "in_unit" | "coin_op" | "laundromat" | "none",
      amenities: f.amenities,
      paymentMethods: f.paymentMethods,
      submit,
    };
    const res = await createListing(payload);
    if (!res.ok) {
      setError(res.error || "Could not save the listing.");
      setBusy(null);
      return;
    }
    router.replace("/dashboard?created=1");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {/* 1. What are you listing */}
      <Section n={1} title="What are you listing?">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: "entire", icon: Home, t: "Entire place", s: "Renters have the whole property" },
            { v: "room", icon: DoorOpen, t: "Private room", s: "Renter has their own room" },
          ].map(({ v, icon: Icon, t, s }) => (
            <button
              key={v}
              type="button"
              onClick={() => set("listingKind", v)}
              aria-pressed={f.listingKind === v}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-card border p-5 text-center transition",
                f.listingKind === v ? "border-orange bg-orange-tint/30" : "border-line bg-bg-soft hover:border-navy/30",
              )}
            >
              <Icon className="h-6 w-6 text-orange" />
              <span className="text-[15px] font-bold text-navy">{t}</span>
              <span className="text-[13px] text-muted">{s}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* 2. Property type */}
      <Section n={2} title="Property type">
        <label className={label} htmlFor="propertyType">Select property type *</label>
        <select id="propertyType" className={input} value={f.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
          <option value="">Select one</option>
          {BUILDER_PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
          ))}
        </select>
      </Section>

      {/* 3. Title + description */}
      <Section n={3} title="Listing title and description">
        <div className="grid gap-4">
          <div>
            <label className={label} htmlFor="title">Listing title *</label>
            <input id="title" className={input} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Furnished 2BR house near ExxonMobil Baytown" />
            <p className="mt-1 text-[12.5px] text-muted">Keep it short and descriptive. Tell workers what makes your place great.</p>
          </div>
          <div>
            <label className={label} htmlFor="description">Property description *</label>
            <textarea id="description" className={`${input} min-h-[130px] resize-y`} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe your property, layout, furnishings, what is included, house rules, anything a worker would want to know before calling you." />
          </div>
        </div>
      </Section>

      {/* 4. Nearby projects */}
      <Section n={4} title="Nearby projects and facilities">
        <label className={label} htmlFor="nearby">What is going on in your area?</label>
        <textarea id="nearby" className={`${input} min-h-[90px] resize-y`} value={f.nearbyProjects} onChange={(e) => set("nearbyProjects", e.target.value)} placeholder="Examples: ExxonMobil Baytown refinery, LyondellBasell expansion, Chevron Phillips turnaround, pipeline corridor Hwy 90, data center construction." />
      </Section>

      {/* 5. Address */}
      <Section n={5} title="Property address">
        <div className="mb-4 rounded-lg border border-[#bcd3ec] bg-[#eef5fc] px-3.5 py-3 text-[13px] text-[#2c4a6b]">
          Your exact address is never shown publicly unless you choose to display it. By default only your city and zip are shown and your map pin is placed approximately near your property.
        </div>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="street">Street address</label>
              <input id="street" className={input} value={f.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} placeholder="123 Main St" />
            </div>
            <div>
              <label className={label} htmlFor="unit">Unit / Apt (optional)</label>
              <input id="unit" className={input} value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Unit B" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="city">City *</label>
              <input id="city" className={input} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Baytown" />
            </div>
            <div>
              <label className={label} htmlFor="state">State *</label>
              <select id="state" className={input} value={f.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">State</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="zip">Zip code *</label>
              <input id="zip" className={input} value={f.zip} onChange={(e) => set("zip", e.target.value)} placeholder="77520" inputMode="numeric" />
            </div>
          </div>
          <div>
            <label className={label}>Map pin and address display</label>
            <Pills
              name="anonymize"
              value={f.anonymizeAddress}
              onChange={(v) => set("anonymizeAddress", v)}
              options={[
                { value: "yes", label: "Show city and zip only · place pin near my property" },
                { value: "no", label: "Show my full address publicly" },
              ]}
            />
            <p className="mt-2 text-[12.5px] text-muted">
              If you choose to hide your address, your map pin will be placed automatically in the general area of your property, not at your exact location.
            </p>
          </div>
        </div>
      </Section>

      {/* 6. Rates */}
      <Section n={6} title="Rates">
        <label className={label} htmlFor="rates">Rates *</label>
        <textarea id="rates" className={`${input} min-h-[90px] resize-y`} value={f.rates} onChange={(e) => set("rates", e.target.value)} placeholder={"Examples: $400/week · $1,500/month · $500 deposit\nOr simply: Call for rates\nWeekly and monthly rates are up to you, write whatever works."} />
        <p className="mt-1 text-[12.5px] text-muted">Write your rates however you want. Weekly, monthly, deposit, call for rates, it is your listing.</p>
        <div className="mt-3 max-w-[280px]">
          <label className={label} htmlFor="priceMonth">Approx monthly rate (optional)</label>
          <input id="priceMonth" className={input} value={f.priceMonth} onChange={(e) => set("priceMonth", e.target.value.replace(/[^0-9]/g, ""))} placeholder="1500" inputMode="numeric" />
          <p className="mt-1 text-[12px] text-muted">Used only to place you on the map and in price sorting. Leave blank to skip.</p>
        </div>
      </Section>

      {/* 7. Details and amenities */}
      <Section n={7} title="Details and amenities">
        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className={label}>All bills paid</label>
              <Pills name="bills" value={f.utilitiesIncluded} onChange={(v) => set("utilitiesIncluded", v)} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
            </div>
            <div>
              <label className={label}>Pets allowed</label>
              <Pills name="pets" value={f.petPolicy} onChange={(v) => set("petPolicy", v)} options={[{ value: "allowed", label: "Yes" }, { value: "no", label: "No" }, { value: "case_by_case", label: "Case by case" }]} />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className={label} htmlFor="beds">Bedrooms</label>
              <input id="beds" className={input} value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/[^0-9]/g, ""))} placeholder="2" inputMode="numeric" />
            </div>
            <div>
              <label className={label} htmlFor="baths">Bathrooms</label>
              <input id="baths" className={input} value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="1" inputMode="decimal" />
            </div>
          </div>
          <div>
            <label className={label}>Internet</label>
            <Pills name="internet" value={f.internet} onChange={(v) => set("internet", v)} options={[{ value: "wifi", label: "WiFi" }, { value: "wired", label: "Plug-in / wired" }, { value: "none", label: "None" }]} />
          </div>
          <div>
            <label className={label}>Laundry</label>
            <Pills name="laundry" value={f.laundry} onChange={(v) => set("laundry", v)} options={[{ value: "in_unit", label: "Washer and dryer in unit" }, { value: "coin_op", label: "Coin-op on site" }, { value: "laundromat", label: "Laundromat nearby" }, { value: "none", label: "None" }]} />
          </div>
          <div>
            <label className={label}>Additional amenities</label>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {AMENITY_OPTIONS.map((a) => (
                <label key={a} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[14px]", f.amenities.includes(a) ? "border-orange bg-orange-tint/30 text-navy" : "border-line bg-bg-soft text-[#3a4a5a]")}>
                  <input type="checkbox" checked={f.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="h-4 w-4 accent-orange" />
                  {a}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Payment methods */}
      <Section n={8} title="Payment methods accepted">
        <textarea className={`${input} min-h-[70px] resize-y`} value={f.paymentMethods} onChange={(e) => set("paymentMethods", e.target.value)} placeholder="Examples: Cash, Zelle, Venmo, CashApp, card. Write whatever payment methods you accept." />
        <p className="mt-1 text-[12.5px] text-muted">No right or wrong answer · just let workers know how you prefer to be paid.</p>
      </Section>

      {/* 9. Photos (upload arrives in 2.3) */}
      <Section n={9} title="Photos">
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-bg-soft py-10 text-center">
          <ImageUp className="h-8 w-8 text-muted" />
          <p className="mt-2 max-w-[44ch] text-[13.5px] text-muted">
            Photo upload is being finalized. Save your listing now, and you will be able to add photos to it in the next step. At least 3 photos recommended, listings with professional photos rent faster and for more.
          </p>
        </div>
      </Section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[14px] font-medium text-red-600">{error}</p>
      )}

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-[0_-4px_16px_rgba(16,32,48,0.06)] sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => save(false)}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[15px] font-semibold text-navy hover:border-navy/40 disabled:opacity-60"
        >
          <Save className="h-[18px] w-[18px]" /> {busy === "draft" ? "Saving..." : "Save draft"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => save(true)}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white hover:bg-orange-dark disabled:opacity-60"
        >
          <Send className="h-[18px] w-[18px]" /> {busy === "submit" ? "Submitting..." : "Submit for approval"}
        </button>
      </div>
    </div>
  );
}
