"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, Loader2 } from "lucide-react";
import { PhotoUploader } from "@/components/listings/photo-uploader";
import {
  createCommercialListing,
  updateCommercialListing,
  type CommercialInput,
} from "@/app/dashboard/listings/new/commercial-actions";
import { COMMERCIAL_FORMS, type CommercialType } from "@/lib/listings/commercial-forms";
import { US_STATES } from "@/lib/listings/us-states";
import { formatPhone } from "@/lib/format-phone";
import { cn } from "@/lib/cn";

const input =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";

/** Values to prefill the builder when editing an existing commercial listing. */
export type CommercialInitial = {
  name?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  description?: string;
  nearbyProjects?: string;
  anonymizeAddress?: boolean;
  details?: Record<string, unknown>;
  petPolicy?: "allowed" | "no" | "case_by_case" | "";
  petNote?: string;
  rates?: string;
  contactPhone?: string;
  showPhone?: boolean;
  contactEmail?: string;
  showEmail?: boolean;
  allowContactForm?: boolean;
  photos?: string[];
};

function Section({ n, title, children }: { n: number | string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-[0_4px_16px_rgba(16,32,48,0.05)]">
      <h2 className="font-display mb-3 flex items-center gap-2 text-[16px] font-bold text-navy">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-orange/15 text-[12px] text-orange">{n}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

/** Two-button yes/no toggle used for the contact preferences. */
function Toggle({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            "rounded-lg border px-3.5 py-2 text-[14px] font-medium",
            value === o.v ? "border-orange bg-orange-tint/40 text-navy" : "border-line bg-white text-navy hover:border-navy/30",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function CommercialBuilder({
  type,
  initial,
  listingId,
  currentStatus,
}: {
  type: CommercialType;
  initial?: CommercialInitial;
  listingId?: string;
  currentStatus?: string;
}) {
  const router = useRouter();
  const form = COMMERCIAL_FORMS[type];
  const i = initial ?? {};

  const [name, setName] = useState(i.name ?? "");
  const [street, setStreet] = useState(i.streetAddress ?? "");
  const [city, setCity] = useState(i.city ?? "");
  const [stateVal, setStateVal] = useState(i.state ?? "");
  const [zip, setZip] = useState(i.zip ?? "");
  const [description, setDescription] = useState(i.description ?? "");
  const [nearbyProjects, setNearbyProjects] = useState(i.nearbyProjects ?? "");
  // Default to hiding the street address (privacy-safe, matches residential). A
  // business that wants its address shown toggles it; undefined = new listing.
  const [anonymize, setAnonymize] = useState<"yes" | "no">(i.anonymizeAddress === false ? "no" : "yes");
  const [values, setValues] = useState<Record<string, unknown>>(i.details ?? {});
  const [pet, setPet] = useState<"allowed" | "no" | "case_by_case" | "">(i.petPolicy ?? "");
  const [petNote, setPetNote] = useState(i.petNote ?? "");
  const [rates, setRates] = useState(i.rates ?? "");
  const [contactPhone, setContactPhone] = useState(i.contactPhone ?? "");
  const [showPhone, setShowPhone] = useState<"yes" | "no">(i.showPhone === false ? "no" : "yes");
  const [contactEmail, setContactEmail] = useState(i.contactEmail ?? "");
  const [showEmail, setShowEmail] = useState<"yes" | "no">(i.showEmail ? "yes" : "no");
  const [allowContactForm, setAllowContactForm] = useState<"yes" | "no">(i.allowContactForm === false ? "no" : "yes");
  const [photos, setPhotos] = useState<string[]>(i.photos ?? []);
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setVal = (k: string, v: unknown) => setValues((p) => ({ ...p, [k]: v }));
  const toggle = (k: string, opt: string) =>
    setValues((p) => {
      const cur = (p[k] as string[]) ?? [];
      return { ...p, [k]: cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt] };
    });

  async function save(submit: boolean) {
    setError(null);
    const errs: string[] = [];
    if (!name.trim()) errs.push("Add the property name.");
    if (!city.trim() || !stateVal.trim() || !zip.trim())
      errs.push("Complete the location (city, state, zip).");
    if (!description.trim()) errs.push("Add a property description.");
    if (!rates.trim()) errs.push("Describe your rates.");
    // A real contact (phone or email) must be on file — even if kept private and
    // only the form is used. The form alone (nothing entered) isn't enough.
    if (!(contactPhone.trim() || contactEmail.trim())) {
      errs.push("Enter a phone number or email. You can keep it private and still use the contact form.");
    } else if (
      !((showPhone === "yes" && contactPhone.trim()) ||
        (showEmail === "yes" && contactEmail.trim()) ||
        allowContactForm !== "no")
    ) {
      errs.push("Choose at least one way for workers to reach you — show your phone or email, or turn on the contact form.");
    }
    // Contact-form messages are delivered by EMAIL, so the form needs an email
    // on file — even when the phone is shown.
    if (allowContactForm !== "no" && !contactEmail.trim()) {
      errs.push("The contact form sends messages to your email — add an email address to use it (it can stay private).");
    }
    if (errs.length) return setError(errs.map((e) => `• ${e}`).join("\n"));

    setBusy(submit ? "submit" : "draft");
    const payload: CommercialInput = {
      type,
      name,
      streetAddress: street,
      city,
      state: stateVal,
      zip,
      description,
      nearbyProjects,
      anonymizeAddress: anonymize === "yes",
      details: { ...values, pet_note: petNote },
      petPolicy: pet || "no",
      rates,
      contactPhone,
      showPhone: showPhone === "yes",
      contactEmail,
      showEmail: showEmail === "yes",
      allowContactForm: allowContactForm !== "no",
      photos,
      submit,
    };
    const res = listingId
      ? await updateCommercialListing(listingId, payload, currentStatus)
      : await createCommercialListing(payload);
    if (!res.ok) {
      setError(res.error || "Could not save the listing.");
      setBusy(null);
      return;
    }
    router.replace(listingId ? "/dashboard?saved=1" : submit ? "/dashboard?submitted=1" : "/dashboard?created=1");
    router.refresh();
  }

  let n = 0;

  return (
    <div className="grid gap-4">
      <Section n={(n += 1)} title="Property name">
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} aria-label="Property name" placeholder={form.namePlaceholder} />
      </Section>

      <Section n={(n += 1)} title="Location">
        <div className="grid gap-3">
          <input className={input} value={street} onChange={(e) => setStreet(e.target.value)} aria-label="Street address" placeholder="Street address" />
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={input} value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" placeholder="City" />
            <select className={input} value={stateVal} aria-label="State" onChange={(e) => setStateVal(e.target.value)}>
              <option value="">State</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input className={input} value={zip} onChange={(e) => setZip(e.target.value)} aria-label="Zip code" placeholder="Zip" inputMode="numeric" />
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-semibold text-navy">Map pin and address display</label>
            <Toggle
              value={anonymize}
              onChange={(v) => setAnonymize(v as "yes" | "no")}
              options={[
                { v: "no", l: "Show my full address publicly" },
                { v: "yes", l: "Show city and zip only (hide my street address)" },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section n={(n += 1)} title="Property description">
        <textarea
          className={`${input} min-h-[110px] resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)} aria-label="Property description"
          placeholder="Describe the property, the area, what makes it a good fit for workers, and anything a renter would want to know before reaching out."
        />
      </Section>

      <Section n={(n += 1)} title="Nearby projects and facilities">
        <textarea
          className={`${input} min-h-[90px] resize-y`}
          value={nearbyProjects}
          onChange={(e) => setNearbyProjects(e.target.value)} aria-label="Nearby projects and facilities"
          placeholder="Examples: ExxonMobil Baytown refinery, LyondellBasell expansion, Chevron Phillips turnaround, pipeline corridor Hwy 90, data center construction."
        />
      </Section>

      {form.sections.map((field) => {
        n += 1;
        if (field.kind === "checkboxes") {
          const sel = (values[field.key] as string[]) ?? [];
          return (
            <Section key={field.key} n={n} title={field.label}>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {field.options.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[14px]",
                      sel.includes(opt) ? "border-orange bg-orange-tint/30 text-navy" : "border-line bg-bg-soft text-[#3a4a5a]",
                    )}
                  >
                    <input type="checkbox" checked={sel.includes(opt)} onChange={() => toggle(field.key, opt)} className="h-4 w-4 accent-orange" />
                    {opt}
                  </label>
                ))}
              </div>
            </Section>
          );
        }
        if (field.kind === "radio") {
          const v = (values[field.key] as string) ?? "";
          return (
            <Section key={field.key} n={n} title={field.label}>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVal(field.key, opt)}
                    className={cn(
                      "rounded-lg border px-3.5 py-2 text-[14px] font-medium",
                      v === opt ? "border-orange bg-orange-tint/40 text-navy" : "border-line bg-white text-navy hover:border-navy/30",
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {/* An "Other" choice reveals a free-text box to explain. */}
              {v === "Other" && (
                <textarea
                  className={`${input} mt-3 min-h-[70px] resize-y`}
                  value={(values[`${field.key}_other`] as string) ?? ""}
                  onChange={(e) => setVal(`${field.key}_other`, e.target.value)}
                  placeholder="Please explain."
                />
              )}
            </Section>
          );
        }
        if (field.kind === "feature") {
          const enabled = Boolean((values[`${field.key}_enabled`] as boolean));
          return (
            <Section key={field.key} n={n} title={field.label}>
              <label className="flex cursor-pointer items-center gap-2.5 text-[14.5px] text-navy">
                <input type="checkbox" checked={enabled} onChange={(e) => setVal(`${field.key}_enabled`, e.target.checked)} className="h-4 w-4 accent-orange" />
                {field.checkboxLabel}
              </label>
              {enabled && (
                <textarea
                  className={`${input} mt-3 min-h-[80px] resize-y`}
                  value={(values[field.key] as string) ?? ""}
                  onChange={(e) => setVal(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </Section>
          );
        }
        // text / textarea
        return (
          <Section key={field.key} n={n} title={field.label}>
            {field.kind === "text" ? (
              <input className={input} value={(values[field.key] as string) ?? ""} onChange={(e) => setVal(field.key, e.target.value)} placeholder={field.placeholder} />
            ) : (
              <>
                <textarea
                  className={`${input} min-h-[90px] resize-y`}
                  value={(values[field.key] as string) ?? ""}
                  onChange={(e) => setVal(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
                {field.tip && <p className="mt-1.5 text-[12.5px] text-muted">{field.tip}</p>}
              </>
            )}
          </Section>
        );
      })}

      <Section n={(n += 1)} title="Pet policy">
        <Toggle
          value={pet}
          onChange={(v) => setPet(v as "allowed" | "no" | "case_by_case")}
          options={[
            { v: "allowed", l: "Pets welcome" },
            { v: "no", l: "No pets" },
            { v: "case_by_case", l: "Case by case" },
          ]}
        />
        <textarea
          className={`${input} mt-3 min-h-[70px] resize-y`}
          value={petNote}
          onChange={(e) => setPetNote(e.target.value)}
          placeholder="Describe your pet policy — breed/size restrictions, fees, etc."
        />
      </Section>

      <Section n={(n += 1)} title="Rates">
        <textarea className={`${input} min-h-[110px] resize-y`} value={rates} onChange={(e) => setRates(e.target.value)} placeholder={form.ratesPlaceholder} />
        <p className="mt-1.5 text-[12.5px] text-muted">{form.ratesTip}</p>
      </Section>

      <Section n={(n += 1)} title="How workers reach you">
        <p className="mb-4 text-[13px] text-muted">
          Choose how renters get in touch. Show your phone for direct calls and texts, keep it private and take messages through a contact form, or both.
        </p>
        <div className="grid gap-4">
          <div>
            <label className="mb-1.5 block text-[13.5px] font-semibold text-navy">Phone number</label>
            <input
              type="tel"
              inputMode="tel"
              className={input}
              value={contactPhone}
              onChange={(e) => setContactPhone(formatPhone(e.target.value))}
              placeholder="(555) 123-4567"
            />
            <div className="mt-2.5">
              <Toggle
                value={showPhone}
                onChange={(v) => setShowPhone(v as "yes" | "no")}
                options={[
                  { v: "yes", l: "Show my phone (calls + texts)" },
                  { v: "no", l: "Keep my phone private" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-semibold text-navy">Email address</label>
            <input
              type="email"
              inputMode="email"
              className={input}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <p className="mt-1 text-[12.5px] text-muted">
              Contact-form messages are sent to this email, even if you keep it private.
            </p>
            <div className="mt-2.5">
              <Toggle
                value={showEmail}
                onChange={(v) => setShowEmail(v as "yes" | "no")}
                options={[
                  { v: "yes", l: "Show my email" },
                  { v: "no", l: "Keep my email private" },
                ]}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13.5px] font-semibold text-navy">Contact form</label>
            <Toggle
              value={allowContactForm}
              onChange={(v) => setAllowContactForm(v as "yes" | "no")}
              options={[
                { v: "yes", l: "Let renters message me through a form" },
                { v: "no", l: "No contact form" },
              ]}
            />
            <p className="mt-1 text-[12.5px] text-muted">
              The form lets renters message you without showing your phone or email publicly. Form messages are delivered to the email address entered above, so an email is required to use the form (it can stay private). We recommend leaving this on.
            </p>
          </div>
        </div>
      </Section>

      <Section n={(n += 1)} title="Photos">
        <PhotoUploader value={photos} onChange={setPhotos} />
      </Section>

      {/* Error lives inside the sticky footer so a failed submit is always
          visible next to the button (not rendered far down the long form). */}
      <div className="sticky bottom-0 flex flex-col gap-3 rounded-card border border-line bg-white/95 p-3 shadow-[0_-4px_16px_rgba(16,32,48,0.08)] backdrop-blur">
        {error && (
          <p role="alert" className="whitespace-pre-line rounded-lg bg-red-50 px-3.5 py-2.5 text-[14px] font-medium text-red-600">{error}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
        {currentStatus === "approved" && (
          <p className="mr-auto text-[13px] text-muted">This listing is live. Saving updates it right away — no re-approval needed.</p>
        )}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => save(false)}
          className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-white px-5 py-2.5 text-[15px] font-semibold text-navy hover:border-navy/40 disabled:opacity-60"
        >
          {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-[18px] w-[18px]" />}{" "}
          {currentStatus === "approved" ? "Save changes (stays live)" : listingId ? "Save changes" : "Save draft"}
        </button>
        {currentStatus !== "approved" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => save(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-orange px-5 py-2.5 text-[15px] font-semibold text-white hover:bg-orange-dark disabled:opacity-60"
          >
            {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-[18px] w-[18px]" />} Submit for approval
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
