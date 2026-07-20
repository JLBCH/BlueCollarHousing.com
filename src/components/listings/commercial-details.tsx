import { COMMERCIAL_FORMS, type CommercialType } from "@/lib/listings/commercial-forms";
import { FreeText } from "@/components/listings/free-text";

/** A field value is "long" when it wraps or spans lines — those get a
 *  full-width block instead of a grid cell, so a 20-line list never sits next
 *  to a two-word value with a giant hole under it. */
const isLong = (v: string) => v.includes("\n") || v.length > 90;

/** Renders a commercial listing's type-specific fields, labelled + ordered per
 *  the form spec. Used on the public listing page. */
export function CommercialDetails({
  type,
  details,
}: {
  type: CommercialType;
  details: Record<string, unknown>;
}) {
  const form = COMMERCIAL_FORMS[type];
  const rows: { label: string; value: string }[] = [];

  for (const field of form.sections) {
    if (field.kind === "feature") {
      if (details[`${field.key}_enabled`]) {
        const note = String(details[field.key] ?? "").trim();
        // Workers never see the form's checkbox — show a clean label + the
        // landlord's description, not "Yes — …".
        rows.push({ label: field.listingLabel ?? field.label, value: note || "Available" });
      }
      continue;
    }
    const v = details[field.key];
    if (Array.isArray(v)) {
      if (v.length > 0) rows.push({ label: field.label, value: v.join(" · ") });
    } else if (v != null && String(v).trim()) {
      const val = String(v);
      // "Other" is a form-only bucket: workers see just the landlord's free text
      // (never "Other — …"). If they picked Other but wrote nothing, skip the row.
      if (val === "Other") {
        const other = String(details[`${field.key}_other`] ?? "").trim();
        if (other) rows.push({ label: field.label, value: other });
      } else {
        rows.push({ label: field.label, value: val });
      }
    }
  }

  const petNote = String(details.pet_note ?? "").trim();
  if (petNote) rows.push({ label: "Pet policy", value: petNote });

  if (rows.length === 0) return null;

  // Short one-liners make a compact facts grid up top; anything long stacks
  // full-width below it, each in form-spec order within its group.
  const shortRows = rows.filter((r) => !isLong(r.value));
  const longRows = rows.filter((r) => isLong(r.value));

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div>
      <div className="text-[12px] font-bold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 space-y-2 text-[15px] leading-relaxed text-ink">
        <FreeText value={value} />
      </div>
    </div>
  );

  return (
    <div className="grid gap-5">
      {shortRows.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {shortRows.map((r) => (
            <Row key={r.label} label={r.label} value={r.value} />
          ))}
        </div>
      )}
      {longRows.map((r) => (
        <Row key={r.label} label={r.label} value={r.value} />
      ))}
    </div>
  );
}
