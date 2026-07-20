// Config that drives the commercial listing forms (RV Park / Hotel / Apartment
// Complex) for the $249 tier. One builder renders these. Type-specific fields
// land in the listing's commercial_details JSONB. Spec: commercial-forms-spec.md.

export type CommercialType = "rv_park" | "hotel" | "apartment_complex";

export type CommercialField =
  | { kind: "checkboxes"; key: string; label: string; options: string[] }
  | { kind: "radio"; key: string; label: string; options: string[] }
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; placeholder?: string; tip?: string }
  | { kind: "feature"; key: string; label: string; checkboxLabel: string; placeholder?: string; listingLabel?: string };

export type CommercialForm = {
  type: CommercialType;
  label: string; // "RV Park"
  header: string; // "List Your RV Park"
  blurb: string;
  namePlaceholder: string;
  sections: CommercialField[];
  ratesPlaceholder: string;
  ratesTip: string;
};

const PET_RATES_TIP =
  "You can also add a photo of your current rate sheet to your listing photos so renters can see all your pricing at a glance.";

export const COMMERCIAL_FORMS: Record<CommercialType, CommercialForm> = {
  rv_park: {
    type: "rv_park",
    label: "RV Park",
    header: "List Your RV Park",
    blurb: "Fill in the details below. You can save a draft and finish later.",
    namePlaceholder: "Sunset Ridge RV Park",
    sections: [
      {
        kind: "checkboxes",
        key: "hookups",
        label: "Hookups available",
        options: [
          "Full hookups (water, electric & sewer)",
          "Water only",
          "Electric only",
          "Sewer only",
          "No hookups / dry camping",
        ],
      },
      { kind: "checkboxes", key: "electrical", label: "Electrical service", options: ["20 amp", "30 amp", "50 amp"] },
      {
        kind: "feature",
        key: "cabins",
        label: "Park features",
        listingLabel: "Furnished cabins available",
        checkboxLabel: "This RV park also has furnished cabins available",
        placeholder:
          "We have 6 cabins ranging from studio to 2-bedroom, all furnished with kitchenettes.",
      },
      {
        kind: "checkboxes",
        key: "site_type",
        label: "Site type",
        options: ["Pull-through sites", "Back-in sites", "Covered RV pads available"],
      },
      { kind: "checkboxes", key: "pad_surface", label: "Pad surface", options: ["Concrete", "Gravel", "Grass / dirt"] },
      { kind: "text", key: "max_rv_length", label: "Max RV length accommodated", placeholder: "45 ft" },
      {
        kind: "checkboxes",
        key: "amenities",
        label: "Amenities",
        options: [
          "Laundry facilities", "Showers / bathhouse", "WiFi", "Cable TV", "Dump station",
          "Fitness center", "Clubhouse", "Gathering area / pavilion", "Pool", "Pet wash station",
          "Fishing pier", "Fish cleaning station", "Security / gated", "On-site management",
        ],
      },
    ],
    ratesPlaceholder:
      "Call for rates, or describe your rates — nightly, weekly, monthly or 28-day options, and let renters know if electric is included or billed separately based on meter readings. Example: RV spaces $45/night or $250/week, full hookups. Cabins range $400-$700/week depending on size. Electric metered separately, billed every 28 days. Or simply call for rates.",
    ratesTip:
      "Many RV parks find it easiest to take a photo of their current price list or rate sheet and add it to your listing photos, that way renters can see all your rates and options at a glance.",
  },

  hotel: {
    type: "hotel",
    label: "Hotel",
    header: "List Your Hotel",
    blurb: "Fill in the details below. You can save a draft and finish later.",
    namePlaceholder: "Gulf Coast Extended Stay Inn",
    sections: [
      {
        kind: "checkboxes",
        key: "room_types",
        label: "Room types",
        options: [
          "1 Queen bed", "2 Queen beds", "1 King bed", "2 Double / Full beds",
          "Suite", "Kitchenettes available", "Adjoining rooms available",
        ],
      },
      { kind: "radio", key: "housekeeping", label: "Housekeeping", options: ["Daily", "Periodic / on request", "None", "Other"] },
      {
        kind: "checkboxes",
        key: "parking",
        label: "Parking",
        options: [
          "Free parking", "Paid parking", "Secured / gated lot",
          "Gate access via room key / code", "Truck / trailer parking available",
        ],
      },
      {
        kind: "checkboxes",
        key: "amenities",
        label: "Amenities",
        options: [
          "WiFi", "Free breakfast", "Pool", "Fitness center", "Laundry on-site", "Cable TV", "Ice machine",
          "Outdoor smoking area", "Outdoor grill / cooking area", "Outdoor seating / gathering area",
        ],
      },
    ],
    ratesPlaceholder:
      "Call for rates, or describe your rates — nightly, weekly or monthly, and note if rates vary by room type. Example: 1 Queen bed $65/night or $350/week. 2 Queen beds with kitchenette $80/night or $425/week. Ask about extended stay monthly rates. If your rates change seasonally (holidays, special events, etc.), let renters know so there are no surprises. Or simply call for rates.",
    ratesTip: PET_RATES_TIP,
  },

  apartment_complex: {
    type: "apartment_complex",
    label: "Multifamily / Apartment Complex",
    header: "List Your Multifamily / Apartment Complex",
    blurb: "Fill in the details below. You can save a draft and finish later.",
    namePlaceholder: "Bayside Furnished Apartments",
    sections: [
      {
        kind: "textarea",
        key: "unit_types",
        label: "Unit types available",
        placeholder:
          "List the furnished unit types you have available — e.g. Furnished Studio, Furnished Efficiency, Furnished 1BR/1BA, Furnished 2BR/1BA, Furnished 2BR/2BA, etc.",
      },
      {
        kind: "textarea",
        key: "furnished_status",
        label: "Furnished status",
        placeholder: "Describe your furnishing level — fully furnished, semi-furnished, basics only.",
        tip: "Add photos of your floor plans to your listing photos so renters can see exact layouts.",
      },
      {
        kind: "textarea",
        key: "whats_included",
        label: "What's included",
        placeholder: "Let renters know what's provided — bedding, linens, towels, pots, pans, dishes, etc.",
      },
      {
        kind: "textarea",
        key: "utilities",
        label: "Utilities",
        placeholder:
          "Let renters know which utilities are included in rent and which are billed separately — e.g. water, trash and sewer included; electric billed separately by usage.",
      },
      {
        kind: "textarea",
        key: "leasing_terms",
        label: "Leasing structure / terms",
        placeholder:
          "Explain your leasing terms — many complexes require a minimum lease (30 days to a year) for furnished/corporate units. Let renters know your process.",
      },
      {
        kind: "checkboxes",
        key: "amenities",
        label: "Amenities",
        options: [
          "Pool", "Fitness center", "Coin-op laundry on site", "Laundry on site (included)",
          "Laundry in unit", "Gated / secured", "Covered parking", "Cleaning service available",
          "WiFi / internet included", "WiFi / internet available (paid separately)",
        ],
      },
    ],
    ratesPlaceholder:
      "Call for rates, or describe your rates — weekly, monthly or lease term, and note if rates vary by unit type. Example: Furnished Studio $1,200/month. Furnished 1BR/1BA $1,450/month. Furnished 2BR/2BA $1,800/month. Minimum lease 30 days. If your rates change seasonally, let renters know so there are no surprises. Or simply call for rates.",
    ratesTip: PET_RATES_TIP,
  },
};
