"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, DoorOpen, Save, Send, Check } from "lucide-react";
import {
  BUILDER_PROPERTY_TYPES,
  AMENITY_GROUPS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/listings/types";
import { createListing, type ListingInput } from "@/app/dashboard/listings/new/actions";
import { updateListing } from "@/app/dashboard/listings/actions";
import { PhotoUploader } from "@/components/listings/photo-uploader";
import { formatPhone } from "@/lib/format-phone";
import { cn } from "@/lib/cn";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";
const label = "mb-1.5 block text-[13.5px] font-semibold text-navy";

function Section({ n, title, children }: { n: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-7 min-w-7 flex-shrink-0 place-items-center rounded-full bg-orange px-1.5 text-[13px] font-bold text-white">
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

/** Checkbox group rendered as multi-select pills (several can be active). */
function MultiPills({
  values, onToggle, options,
}: {
  values: string[];
  onToggle: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            aria-pressed={on}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition",
              on
                ? "border-orange bg-orange-tint/40 text-navy"
                : "border-line bg-bg-soft text-[#3a4a5a] hover:border-navy/30",
            )}
          >
            <span className={cn("grid h-4 w-4 place-items-center rounded border", on ? "border-orange bg-orange" : "border-muted")}>
              {on && <Check className="h-3 w-3 text-white" />}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Property types that don't make sense for a single private room (whole-park /
// whole-building types). Hidden from the dropdown when listing a Private Room.
const ROOM_EXCLUDED_TYPES = ["rv_spot", "rv_resort", "rv_park", "hotel", "apartment_complex"];
// Commercial types have their own dedicated builder + $249 tier — they must
// never be selectable in this ($99) residential builder, or a landlord ends up
// with a hybrid listing (no commercial_details) that routes to the wrong
// builder on edit and gets charged the wrong price.
const COMMERCIAL_TYPES = ["rv_park", "hotel", "apartment_complex"];

/** Normalize the structured rate to a monthly figure for price sorting. */
function rateMonthlyEstimate(amount: string, billed: string): number | null {
  const a = Number(amount);
  if (!a || billed === "call" || !billed) return null;
  if (billed === "weekly") return Math.round((a * 52) / 12);
  if (billed === "four_weeks") return Math.round((a * 13) / 12);
  return a; // monthly
}

const ROOM_HOUSEHOLD_OPTIONS = [
  { value: "family", label: "Family home", hint: "You'll be renting a room in an owner-occupied house" },
  { value: "all_renters", label: "All renters", hint: "Multiple rooms rented separately to workers" },
  { value: "other", label: "Other", hint: "" },
];

const ROOM_SHARED_OPTIONS = [
  "Private entrance",
  "Kitchen access (shared)",
  "No kitchen access",
  "Shared common areas",
  "Laundry access",
  "Locking door on room",
];

const DEFAULTS = {
  listingKind: "" as "" | "entire" | "room",
  propertyType: "",
  propertyTypeOther: "",
  roomHousehold: "",
  roomHouseholdNote: "",
  roomBathroom: "",
  roomShared: [] as string[],
  roomSharedNote: "",
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
  rateAmount: "",
  rateBilled: "" as "" | "weekly" | "four_weeks" | "monthly" | "call",
  bedrooms: "",
  bedroomType: "",
  bathrooms: "",
  utilitiesIncluded: "",
  petPolicy: "",
  internet: "",
  laundry: "",
  amenities: [] as string[],
  houseRules: "",
  paymentMethods: "",
  contactPhone: "",
  showPhone: "yes",
  contactEmail: "",
  showEmail: "no",
  allowContactForm: "yes",
  photos: [] as string[],
};

export type ListingFormValues = typeof DEFAULTS;

export function ListingBuilder({
  initial,
  listingId,
  currentStatus,
  addlUnit,
  parentListingId,
}: {
  initial?: Partial<ListingFormValues>;
  listingId?: string;
  currentStatus?: string;
  /** Set when creating an ADDITIONAL unit at an address the owner already lists,
   *  so the form shows the $10 per-unit context and pre-fills the address.
   *  firstIsLive = a paid/comped unit already exists here, so THIS unit is $10. */
  addlUnit?: { addressLabel: string; unitNumber: number; firstIsLive: boolean };
  /** The primary listing this additional unit belongs to. */
  parentListingId?: string;
} = {}) {
  const router = useRouter();
  const [f, setF] = useState<ListingFormValues>({ ...DEFAULTS, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "draft" | "submit">(null);

  const set = (k: keyof typeof f, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  // Additional units share the primary's address, contact, nearby-projects and
  // payment info — those sections are locked here and edited on the primary.
  const locked = !!addlUnit;
  const lockNote = (text: string) => (
    <p className="mt-1 mb-2 rounded-md bg-bg-soft px-2.5 py-1.5 text-[12.5px] font-medium text-muted">
      🔒 {text}
    </p>
  );
  // #2: typing a 5-digit zip auto-fills the state (always — the zip determines
  // it) and the city when it's still blank, so unincorporated places like
  // Bacliff come through correctly without the landlord hunting for the name.
  const onZipChange = (raw: string) => {
    const zip = raw.replace(/\D/g, "").slice(0, 5);
    set("zip", zip);
    if (zip.length !== 5) return;
    fetch(`https://api.zippopotam.us/us/${zip}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const place = data?.places?.[0];
        if (!place) return;
        setF((p) => {
          if (p.zip !== zip) return p; // user kept typing; ignore stale lookup
          return {
            ...p,
            city: p.city.trim() ? p.city : (place["place name"] ?? p.city),
            state: p.state || (place["state abbreviation"] ?? p.state),
          };
        });
      })
      .catch(() => {});
  };
  const toggleAmenity = (a: string) =>
    setF((p) => ({
      ...p,
      amenities: p.amenities.includes(a)
        ? p.amenities.filter((x) => x !== a)
        : [...p.amenities, a],
    }));

  // Internet is multi-select (e.g. WiFi + wired). "None" is exclusive.
  const internetValues = f.internet ? f.internet.split(",").filter(Boolean) : [];
  const toggleInternet = (v: string) =>
    setF((p) => {
      const cur = p.internet ? p.internet.split(",").filter(Boolean) : [];
      let next: string[];
      if (v === "none") {
        next = cur.includes("none") ? [] : ["none"];
      } else {
        const base = cur.filter((x) => x !== "none");
        next = base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
      }
      return { ...p, internet: next.join(",") };
    });

  const toggleRoomShared = (a: string) =>
    setF((p) => ({
      ...p,
      roomShared: p.roomShared.includes(a)
        ? p.roomShared.filter((x) => x !== a)
        : [...p.roomShared, a],
    }));

  // Map-pin rate: "Call for rates" needs no amount, so clear + disable it.
  const setRateBilled = (v: string) =>
    setF((p) => ({ ...p, rateBilled: v as typeof p.rateBilled, rateAmount: v === "call" ? "" : p.rateAmount }));

  // Property types offered depend on what's being listed: a private room can't
  // be a whole RV park / hotel / apartment complex.
  const residentialTypes = BUILDER_PROPERTY_TYPES.filter((t) => !COMMERCIAL_TYPES.includes(t));
  const propertyTypes =
    f.listingKind === "room"
      ? residentialTypes.filter((t) => !ROOM_EXCLUDED_TYPES.includes(t))
      : residentialTypes;

  // Switching what you're listing: clear a now-invalid property type so the
  // dropdown never shows a stale (hidden) selection.
  const setListingKind = (v: string) =>
    setF((p) => ({
      ...p,
      listingKind: v as typeof p.listingKind,
      propertyType:
        v === "room" && ROOM_EXCLUDED_TYPES.includes(p.propertyType) ? "" : p.propertyType,
    }));

  // Bedrooms: a single select that also offers open-plan options.
  const bedroomChoice = f.bedroomType || (f.bedrooms ? f.bedrooms : "");
  const setBedroomChoice = (v: string) =>
    setF((p) =>
      v === "studio" || v === "efficiency"
        ? { ...p, bedroomType: v, bedrooms: "0" }
        : { ...p, bedroomType: "", bedrooms: v },
    );

  async function save(submit: boolean) {
    setError(null);
    // Collect every problem so the landlord sees them all at once, not one per submit.
    const errs: string[] = [];
    if (!f.listingKind) errs.push("Choose what you are listing.");
    if (!f.propertyType) errs.push("Select a property type.");
    if (f.propertyType === "other" && !f.propertyTypeOther.trim())
      errs.push("Describe your property type.");
    if (!f.title.trim()) errs.push("Add a listing title.");
    if (!f.description.trim()) errs.push("Add a description.");
    if (!f.streetAddress.trim() || !f.city.trim() || !f.state || !f.zip.trim())
      errs.push("Complete the property address (street, city, state, zip). Your street can stay private.");
    if (!f.rates.trim()) errs.push("Add your rates.");
    if (!f.rateBilled) errs.push("Choose how your map-pin rate is billed.");
    if (f.rateBilled !== "call" && !(Number(f.rateAmount) > 0))
      errs.push("Enter your rate amount, or choose Call for rates.");
    // A real contact must be on file — a phone or email — even if the landlord
    // keeps it private and only uses the form. The form alone (with nothing
    // entered) isn't enough.
    if (!(f.contactPhone.trim() || f.contactEmail.trim())) {
      errs.push("Enter a phone number or email. You can keep it private and still use the contact form.");
    } else if (
      // A SHOWN channel only counts if it has a value; otherwise workers can't reach them.
      !((f.showPhone === "yes" && f.contactPhone.trim()) ||
        (f.showEmail === "yes" && f.contactEmail.trim()) ||
        f.allowContactForm !== "no")
    ) {
      errs.push("Choose at least one way for workers to reach you — show your phone or email, or turn on the contact form.");
    }
    // Contact-form messages are delivered by EMAIL, so the form needs an email
    // on file — even when the landlord shows a phone number.
    if (f.allowContactForm !== "no" && !f.contactEmail.trim()) {
      errs.push("The contact form sends messages to your email — add an email address to use it (it can stay private).");
    }
    if (errs.length) return setError(errs.map((e) => `• ${e}`).join("\n"));

    setBusy(submit ? "submit" : "draft");
    const payload: ListingInput = {
      listingKind: f.listingKind as "entire" | "room",
      propertyType: f.propertyType,
      propertyTypeOther: f.propertyTypeOther,
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
      rateBilled: (f.rateBilled || "call") as "weekly" | "four_weeks" | "monthly" | "call",
      rateAmount: f.rateBilled === "call" || !f.rateAmount ? null : Number(f.rateAmount),
      // Monthly estimate kept for price sorting/legacy map fallback.
      priceMonth: rateMonthlyEstimate(f.rateAmount, f.rateBilled),
      bedrooms: Number(f.bedrooms) || 0,
      bedroomType: f.bedroomType,
      bathrooms: Number(f.bathrooms) || 0,
      utilitiesIncluded: f.utilitiesIncluded === "yes",
      petPolicy: (f.petPolicy || "no") as "allowed" | "no" | "case_by_case",
      internet: f.internet || "none",
      laundry: (f.laundry || "none") as "in_unit" | "coin_op" | "laundromat" | "free_onsite" | "none",
      amenities: f.amenities,
      houseRules: f.houseRules,
      paymentMethods: f.paymentMethods,
      contactPhone: f.contactPhone,
      showPhone: f.showPhone === "yes",
      contactEmail: f.contactEmail,
      showEmail: f.showEmail === "yes",
      allowContactForm: f.allowContactForm !== "no",
      photos: f.photos,
      roomDetails: {
        household: f.roomHousehold,
        householdNote: f.roomHouseholdNote,
        bathroom: f.roomBathroom,
        shared: f.roomShared,
        sharedNote: f.roomSharedNote,
      },
      parentListingId: parentListingId ?? null,
      submit,
    };
    const res = listingId
      ? await updateListing(listingId, payload, currentStatus)
      : await createListing(payload);
    if (!res.ok) {
      setError(res.error || "Could not save the listing.");
      setBusy(null);
      return;
    }
    router.replace(listingId ? "/dashboard?saved=1" : submit ? "/dashboard?submitted=1" : "/dashboard?created=1");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      {addlUnit &&
        (addlUnit.unitNumber > 6 ? (
          <div className="rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
            <span className="font-semibold">{addlUnit.addressLabel}</span> already has 6 units — the
            most on the per-unit plan. For more units at one address, use the commercial listing type
            ($249/yr) instead.
          </div>
        ) : (
          <div className="rounded-card border border-orange/40 bg-orange-tint/30 px-4 py-3 text-[14px] text-navy">
            {addlUnit.firstIsLive ? (
              <>
                <span className="font-semibold">
                  Additional unit at {addlUnit.addressLabel} — $10/yr
                </span>{" "}
                (unit {addlUnit.unitNumber} of 6). Your first year is prorated so this unit renews on
                the same date as your primary listing — you pay a reduced amount now, then $10/yr
                alongside the primary.
              </>
            ) : (
              <>
                <span className="font-semibold">Another unit at {addlUnit.addressLabel}</span> (unit{" "}
                {addlUnit.unitNumber} of 6). Your first unit at an address is $99/yr; each additional
                unit is $10/yr, prorated to renew on the same date as your primary listing.
              </>
            )}{" "}
            The address and contact info from your primary listing are already filled in below — just
            add this unit’s own details (unit number, beds, rate, photos).
          </div>
        ))}
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
              onClick={() => setListingKind(v)}
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
          {propertyTypes.map((t) => (
            <option key={t} value={t}>{PROPERTY_TYPE_LABELS[t]}</option>
          ))}
        </select>
        {f.propertyType === "other" && (
          <input
            className={`${input} mt-2.5`}
            value={f.propertyTypeOther}
            onChange={(e) => set("propertyTypeOther", e.target.value)}
            placeholder="Tell us the property type"
            aria-label="Other property type"
          />
        )}
      </Section>

      {/* 2b. Room details (Private Room only) */}
      {f.listingKind === "room" && (
        <Section n="2b" title="Room details">
          <p className="-mt-2 mb-4 text-[13px] text-muted">Let renters know exactly what they are walking into.</p>
          <div className="grid gap-5">
            <div>
              <label className={label}>Who else is in the home?</label>
              <div className="grid gap-2.5">
                {ROOM_HOUSEHOLD_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() =>
                      setF((p) => ({
                        ...p,
                        roomHousehold: o.value,
                        // The note belongs to "Other" — drop it when switching away.
                        roomHouseholdNote: o.value === "other" ? p.roomHouseholdNote : "",
                      }))
                    }
                    aria-pressed={f.roomHousehold === o.value}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left transition",
                      f.roomHousehold === o.value ? "border-orange bg-orange-tint/30" : "border-line bg-bg-soft hover:border-navy/30",
                    )}
                  >
                    <span className={cn("mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border", f.roomHousehold === o.value ? "border-orange" : "border-muted")}>
                      {f.roomHousehold === o.value && <span className="h-2 w-2 rounded-full bg-orange" />}
                    </span>
                    <span>
                      <span className="text-[14px] font-semibold text-navy">{o.label}</span>
                      {o.hint && <span className="block text-[12.5px] text-muted">{o.hint}</span>}
                    </span>
                  </button>
                ))}
              </div>
              {f.roomHousehold === "other" && (
                <textarea
                  className={`${input} mt-2.5 min-h-[70px] resize-y`}
                  value={f.roomHouseholdNote}
                  onChange={(e) => set("roomHouseholdNote", e.target.value)}
                  placeholder="Describe the situation, for example pets in the home, smoking policy, quiet hours, or anything else a renter should know."
                />
              )}
            </div>

            <div>
              <label className={label}>Bathroom</label>
              <Pills
                name="roomBathroom"
                value={f.roomBathroom}
                onChange={(v) => set("roomBathroom", v)}
                options={[{ value: "private", label: "Private bathroom" }, { value: "shared", label: "Shared bathroom" }]}
              />
            </div>

            <div>
              <label className={label}>What else is shared or included</label>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {ROOM_SHARED_OPTIONS.map((a) => (
                  <label key={a} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[14px]", f.roomShared.includes(a) ? "border-orange bg-orange-tint/30 text-navy" : "border-line bg-bg-soft text-[#3a4a5a]")}>
                    <input type="checkbox" checked={f.roomShared.includes(a)} onChange={() => toggleRoomShared(a)} className="h-4 w-4 accent-orange" />
                    {a}
                  </label>
                ))}
              </div>
              <textarea
                className={`${input} mt-2.5 min-h-[70px] resize-y`}
                value={f.roomSharedNote}
                onChange={(e) => set("roomSharedNote", e.target.value)}
                placeholder="Explain the kitchen situation and anything else worth mentioning, e.g. full shared kitchen, kitchenette, mini fridge in the room, shared workspace, pool access."
              />
            </div>
          </div>
        </Section>
      )}

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
        {locked && lockNote("Nearby projects can only be edited on your primary listing.")}
        <fieldset disabled={locked} className={cn(locked && "opacity-60")}>
          <label className={label} htmlFor="nearby">What is going on in your area?</label>
          <textarea id="nearby" className={`${input} min-h-[90px] resize-y`} value={f.nearbyProjects} onChange={(e) => set("nearbyProjects", e.target.value)} placeholder="Examples: ExxonMobil Baytown refinery, LyondellBasell expansion, Chevron Phillips turnaround, pipeline corridor Hwy 90, data center construction." />
        </fieldset>
      </Section>

      {/* 5. Address */}
      <Section n={5} title="Property address">
        {locked
          ? lockNote("All additional units must be at the same address as the primary. Only the Unit / Apt below can change.")
          : (
            <div className="mb-4 rounded-lg border border-[#bcd3ec] bg-[#eef5fc] px-3.5 py-3 text-[13px] text-[#2c4a6b]">
              Your exact address is never shown publicly unless you choose to display it. By default only your city and zip are shown and your map pin is placed approximately near your property.
            </div>
          )}
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={cn(locked && "opacity-60")}>
              <label className={label} htmlFor="street">Street address *</label>
              <input id="street" disabled={locked} className={`${input} disabled:cursor-not-allowed disabled:bg-bg-soft disabled:text-muted`} value={f.streetAddress} onChange={(e) => set("streetAddress", e.target.value)} placeholder="123 Main St" />
            </div>
            <div>
              <label className={label} htmlFor="unit">Unit / Apt (optional)</label>
              <input id="unit" className={input} value={f.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Unit B" />
            </div>
          </div>
          <div className={cn("grid gap-4 sm:grid-cols-3", locked && "opacity-60")}>
            <div>
              <label className={label} htmlFor="city">City *</label>
              <input id="city" disabled={locked} className={`${input} disabled:cursor-not-allowed disabled:bg-bg-soft disabled:text-muted`} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Baytown" />
            </div>
            <div>
              <label className={label} htmlFor="state">State *</label>
              <select id="state" disabled={locked} className={`${input} disabled:cursor-not-allowed disabled:bg-bg-soft disabled:text-muted`} value={f.state} onChange={(e) => set("state", e.target.value)}>
                <option value="">State</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="zip">Zip code *</label>
              <input id="zip" disabled={locked} className={`${input} disabled:cursor-not-allowed disabled:bg-bg-soft disabled:text-muted`} value={f.zip} onChange={(e) => onZipChange(e.target.value)} placeholder="77520" inputMode="numeric" />
            </div>
          </div>
          <div className={cn(locked && "pointer-events-none opacity-60")}>
            <label className={label}>Map pin and address display</label>
            <Pills
              name="anonymize"
              value={f.anonymizeAddress}
              onChange={(v) => set("anonymizeAddress", v)}
              options={[
                { value: "yes", label: "Show city and zip only (hide my street address)" },
                { value: "no", label: "Show my full address publicly" },
              ]}
            />
            <p className="mt-2 text-[12.5px] text-muted">
              {f.anonymizeAddress === "no"
                ? "Your full street address will be shown publicly on your listing."
                : "Only your city and zip show publicly; your full street address stays private."}
            </p>
          </div>
        </div>
      </Section>

      {/* 6. Rates */}
      <Section n={6} title="Rates">
        <label className={label} htmlFor="rates">Rates *</label>
        <textarea id="rates" className={`${input} min-h-[90px] resize-y`} value={f.rates} onChange={(e) => set("rates", e.target.value)} placeholder={"Examples: $400/week · $1,500/month · $500 deposit\nOr simply: Call for rates\nWeekly and monthly rates are up to you, write whatever works."} />
        <p className="mt-1 text-[12.5px] text-muted">Write your rates however you want. Weekly, monthly, deposit, call for rates, it is your listing.</p>

        <hr className="my-5 border-line" />

        <label className={label}>Rate shown when renters tap your map pin *</label>
        <p className="-mt-0.5 mb-3 text-[12.5px] text-muted">
          This rate does not appear on the pin itself, only in the preview card when a renter taps or hovers your listing, alongside your first photo. Required, choose an option below.
        </p>
        <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
          <div>
            <label className={label} htmlFor="rateAmount">Amount</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-muted">$</span>
              <input
                id="rateAmount"
                className={`${input} pl-7 disabled:bg-bg-band disabled:text-muted`}
                value={f.rateAmount}
                onChange={(e) => set("rateAmount", e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="400"
                inputMode="numeric"
                disabled={f.rateBilled === "call"}
              />
            </div>
          </div>
          <div>
            <label className={label}>Billed</label>
            <div className="grid gap-2">
              {[
                { value: "weekly", label: "Weekly", hint: "" },
                { value: "four_weeks", label: "4 weeks (28 days)", hint: "" },
                { value: "monthly", label: "Monthly", hint: "" },
                { value: "call", label: "Call for rates", hint: "no amount needed" },
              ].map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setRateBilled(o.value)}
                  aria-pressed={f.rateBilled === o.value}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-[14px] transition",
                    f.rateBilled === o.value ? "border-orange bg-orange-tint/30 text-navy" : "border-line bg-bg-soft text-[#3a4a5a] hover:border-navy/30",
                  )}
                >
                  <span className={cn("grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border", f.rateBilled === o.value ? "border-orange" : "border-muted")}>
                    {f.rateBilled === o.value && <span className="h-2 w-2 rounded-full bg-orange" />}
                  </span>
                  <span className="font-medium">{o.label}</span>
                  {o.hint && <span className="text-[12.5px] text-muted">({o.hint})</span>}
                </button>
              ))}
            </div>
          </div>
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
          {/* Bedrooms/bathrooms describe a whole place. A private room captures
              its bathroom in Room details, so hide these for room listings. */}
          {f.listingKind !== "room" && (
            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label className={label} htmlFor="beds">Bedrooms</label>
                <select id="beds" className={input} value={bedroomChoice} onChange={(e) => setBedroomChoice(e.target.value)}>
                  <option value="">Select</option>
                  <option value="studio">Studio</option>
                  <option value="efficiency">Efficiency</option>
                  <option value="1">1 bedroom</option>
                  <option value="2">2 bedrooms</option>
                  <option value="3">3 bedrooms</option>
                  <option value="4">4 bedrooms</option>
                  <option value="5">5 bedrooms</option>
                  <option value="6">6+ bedrooms</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="baths">Bathrooms</label>
                <input id="baths" className={input} value={f.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="1" inputMode="decimal" />
              </div>
            </div>
          )}
          <div>
            <label className={label}>Internet</label>
            <MultiPills
              values={internetValues}
              onToggle={toggleInternet}
              options={[{ value: "wifi", label: "WiFi" }, { value: "wired", label: "Plug-in / wired" }, { value: "none", label: "None" }]}
            />
            <p className="mt-1.5 text-[12.5px] text-muted">Select all that apply. Some places offer both WiFi and a wired connection.</p>
          </div>
          <div>
            <label className={label}>Laundry</label>
            <Pills name="laundry" value={f.laundry} onChange={(v) => set("laundry", v)} options={[{ value: "in_unit", label: "Washer and dryer in unit" }, { value: "free_onsite", label: "Free laundry on site" }, { value: "coin_op", label: "Coin-op on site" }, { value: "laundromat", label: "Laundromat nearby" }, { value: "none", label: "None" }]} />
          </div>
          <div>
            <label className={label}>Additional amenities</label>
            <div className="grid gap-5">
              {AMENITY_GROUPS
                // For a private room the kitchen situation is captured in Room
                // details (kitchen-access checkboxes + note), so drop the
                // duplicate Kitchen amenity group here.
                .filter((grp) => !(f.listingKind === "room" && grp.group === "Kitchen"))
                .map((grp) => (
                <div key={grp.group}>
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">{grp.group}</p>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {grp.items.map((a) => (
                      <label key={a} className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[14px]", f.amenities.includes(a) ? "border-orange bg-orange-tint/30 text-navy" : "border-line bg-bg-soft text-[#3a4a5a]")}>
                        <input type="checkbox" checked={f.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="h-4 w-4 accent-orange" />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 8. Payment methods */}
      <Section n={8} title="Payment methods accepted">
        {locked && lockNote("Payment methods are shared with the primary listing at this address.")}
        <fieldset disabled={locked} className={cn(locked && "opacity-60")}>
          <textarea className={`${input} min-h-[70px] resize-y`} value={f.paymentMethods} onChange={(e) => set("paymentMethods", e.target.value)} aria-label="Payment methods accepted" placeholder="Examples: Cash, Zelle, Venmo, CashApp, card. Write whatever payment methods you accept." />
        </fieldset>
        <p className="mt-1 text-[12.5px] text-muted">No right or wrong answer · just let workers know how you prefer to be paid.</p>
      </Section>

      {/* 9. House rules */}
      <Section n={9} title="House rules">
        <textarea
          className={`${input} min-h-[90px] resize-y`}
          value={f.houseRules}
          onChange={(e) => set("houseRules", e.target.value)} aria-label="House rules"
          placeholder="Examples: No smoking indoors, quiet hours after 10pm, no overnight guests, parking for one vehicle, security deposit required. List anything renters should agree to."
        />
        <p className="mt-1 text-[12.5px] text-muted">Optional · workers see these on your listing so there are no surprises.</p>
      </Section>

      {/* 10. Contact */}
      <Section n={10} title="How workers reach you">
        <p className="mb-4 text-[13px] text-muted">
          Choose how renters get in touch. You can show your phone for direct calls and texts, keep it private and take messages through a contact form, or both.
        </p>
        {locked && lockNote("Contact info is set on your primary listing — the same contact is used for every unit at this address.")}
        <fieldset disabled={locked} className={cn(locked && "opacity-60")}>
        <div className="grid gap-4">
          <div>
            <label className={label}>Phone number</label>
            <input
              type="tel"
              inputMode="tel"
              className={input}
              value={f.contactPhone}
              onChange={(e) => set("contactPhone", formatPhone(e.target.value))} aria-label="Contact phone number"
              placeholder="(555) 123-4567"
            />
            <div className="mt-2.5">
              <Pills
                name="showPhone"
                value={f.showPhone}
                onChange={(v) => set("showPhone", v)}
                options={[
                  { value: "yes", label: "Show my phone (calls + texts)" },
                  { value: "no", label: "Keep my phone private" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className={label}>Email address</label>
            <input
              type="email"
              inputMode="email"
              className={input}
              value={f.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)} aria-label="Contact email address"
              placeholder="you@example.com"
            />
            <p className="mt-1 text-[12.5px] text-muted">
              Contact-form messages are sent to this email, even if you keep it private.
            </p>
            <div className="mt-2.5">
              <Pills
                name="showEmail"
                value={f.showEmail}
                onChange={(v) => set("showEmail", v)}
                options={[
                  { value: "yes", label: "Show my email" },
                  { value: "no", label: "Keep my email private" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className={label}>Contact form</label>
            <Pills
              name="allowContactForm"
              value={f.allowContactForm}
              onChange={(v) => set("allowContactForm", v)}
              options={[
                { value: "yes", label: "Let renters message me through a form" },
                { value: "no", label: "No contact form" },
              ]}
            />
            <p className="mt-1 text-[12.5px] text-muted">
              The form lets renters message you without showing your phone or email publicly. Form messages are delivered to the email address entered above, so an email is required to use the form (it can stay private). We recommend leaving this on.
            </p>
          </div>
        </div>
        </fieldset>
      </Section>

      {/* 11. Photos */}
      <Section n={11} title="Photos">
        <p className="mb-3 text-[13px] text-muted">
          More photos get more calls. We highly recommend professional photos, listings with professional photos rent faster and for more.
        </p>
        <PhotoUploader value={f.photos} onChange={(urls) => set("photos", urls)} />
      </Section>

      {/* Errors live INSIDE the sticky footer so a failed submit is always
          visible next to the button — landlords were missing an error rendered
          far down the (long) form and not scrolling to it. */}
      <div className="sticky bottom-0 flex flex-col gap-3 rounded-card border border-line bg-white p-4 shadow-[0_-4px_16px_rgba(16,32,48,0.06)]">
        {error && (
          <p
            role="alert"
            className="whitespace-pre-line rounded-lg bg-red-50 px-3.5 py-2.5 text-[14px] font-medium text-red-600"
          >
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          {currentStatus === "approved" && (
            <p className="mr-auto text-[13px] text-muted">
              This listing is live. Saving updates it right away — no re-approval needed.
            </p>
          )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => save(false)}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-5 py-3 text-[15px] font-semibold text-navy hover:border-navy/40 disabled:opacity-60"
        >
          <Save className="h-[18px] w-[18px]" />{" "}
          {busy === "draft"
            ? "Saving..."
            : currentStatus === "approved"
              ? "Save changes (stays live)"
              : listingId
                ? "Save changes"
                : "Save draft"}
        </button>
        {/* Once a listing is approved, edits go live on save — Joe asked that we
            not push approved listings back through the review queue (#9). */}
        {currentStatus !== "approved" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => save(true)}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white hover:bg-orange-dark disabled:opacity-60"
          >
            <Send className="h-[18px] w-[18px]" /> {busy === "submit" ? "Submitting..." : "Submit for approval"}
          </button>
        )}
        {/* Terms consent has to happen pre-approval: comped (free) listings never
            see a payment step, so submission is the one gate every listing passes. */}
        {currentStatus !== "approved" && (
          <p className="w-full text-right text-[11px] text-muted">
            By submitting your listing you agree to our{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy">
              Terms of Use
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy">
              Privacy Policy
            </a>
            .
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
