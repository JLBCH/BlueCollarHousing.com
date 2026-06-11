"use client";

import { Search } from "lucide-react";
import type { ListingFilters, PropertyType } from "@/lib/listings/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/listings/types";

const TYPES = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];

const selectClass =
  "rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] text-ink outline-none focus:border-navy/40";

export function FilterBar({
  filters,
  onChange,
}: {
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
}) {
  const set = (patch: Partial<ListingFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
        <Search className="h-4 w-4 flex-shrink-0 text-orange" />
        <input
          type="text"
          value={filters.q ?? ""}
          onChange={(e) => set({ q: e.target.value })}
          placeholder="City or state"
          className="w-full bg-transparent text-[14.5px] text-ink outline-none placeholder:text-[#9aa6b3]"
        />
      </label>

      <select
        aria-label="Property type"
        className={selectClass}
        value={filters.type ?? ""}
        onChange={(e) =>
          set({ type: (e.target.value || undefined) as PropertyType | undefined })
        }
      >
        <option value="">All types</option>
        {TYPES.map((t) => (
          <option key={t} value={t}>
            {PROPERTY_TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <select
        aria-label="Max price"
        className={selectClass}
        value={filters.maxPrice ?? ""}
        onChange={(e) =>
          set({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
        }
      >
        <option value="">Any price</option>
        <option value="1000">Up to $1,000</option>
        <option value="1500">Up to $1,500</option>
        <option value="2000">Up to $2,000</option>
        <option value="2500">Up to $2,500</option>
        <option value="3500">Up to $3,500</option>
      </select>

      <select
        aria-label="Bedrooms"
        className={selectClass}
        value={filters.minBeds ?? ""}
        onChange={(e) =>
          set({ minBeds: e.target.value ? Number(e.target.value) : undefined })
        }
      >
        <option value="">Any beds</option>
        <option value="1">1+ beds</option>
        <option value="2">2+ beds</option>
        <option value="3">3+ beds</option>
        <option value="4">4+ beds</option>
      </select>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] text-ink">
        <input
          type="checkbox"
          checked={filters.pets ?? false}
          onChange={(e) => set({ pets: e.target.checked || undefined })}
          className="h-4 w-4 accent-orange"
        />
        Pets OK
      </label>
    </div>
  );
}
