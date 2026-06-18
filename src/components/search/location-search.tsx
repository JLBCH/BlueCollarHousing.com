"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { geocodeUS } from "@/lib/geo";
import { cn } from "@/lib/cn";

export type Place = { name: string; center: [number, number] };
type Suggestion = { id: string; label: string };

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function newSession(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `s-${Math.floor(Math.random() * 1e9)}`;
  }
}

// Mapbox Search Box API — built for autocomplete and tolerant of misspellings
// and missing spaces ("laporte tx" -> "La Porte, Texas"). Two steps: suggest
// (names) then retrieve (coordinates for the picked one).
async function suggest(q: string, session: string): Promise<Suggestion[]> {
  if (!TOKEN || q.trim().length < 2) return [];
  const url =
    `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(q.trim())}` +
    `&access_token=${TOKEN}&session_token=${session}&country=us&language=en&limit=6` +
    // Bias toward the Gulf Coast, where most listings and demand are, so an
    // ambiguous name like "laporte" surfaces La Porte, TX over Laporte, CO.
    `&proximity=-94.5,29.9` +
    `&types=city,place,postcode,locality,neighborhood,district,region`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as {
      suggestions?: { mapbox_id: string; name?: string; place_formatted?: string }[];
    };
    return (data.suggestions ?? []).map((s) => ({
      id: s.mapbox_id,
      label: [s.name, s.place_formatted]
        .filter(Boolean)
        .join(", ")
        .replace(/, United States$/, ""),
    }));
  } catch {
    return [];
  }
}

export function LocationSearch({
  defaultValue = "",
  placeholder = "Search by city, state, or zip",
  showButton = false,
  buttonLabel = "Search the Map",
  onSelect,
  onSubmitText,
}: {
  defaultValue?: string;
  placeholder?: string;
  showButton?: boolean;
  buttonLabel?: string;
  onSelect: (place: Place) => void;
  onSubmitText?: (text: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>("");
  const justPicked = useRef(false);
  const firstRun = useRef(true);
  if (!sessionRef.current) sessionRef.current = newSession();

  // Debounced suggestions as the user types.
  useEffect(() => {
    // Don't auto-open on mount when a default value is present.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await suggest(q, sessionRef.current);
      if (!alive) return;
      setItems(res);
      setOpen(res.length > 0);
      setActive(-1);
      setLoading(false);
    }, 220);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function pick(s: Suggestion) {
    justPicked.current = true;
    setValue(s.label);
    setItems([]);
    setOpen(false);
    setActive(-1);
    setLoading(true);
    // The suggestion label is a full canonical place name, so a plain forward
    // geocode resolves it unambiguously to coordinates.
    const center = await geocodeUS(s.label);
    setLoading(false);
    sessionRef.current = newSession(); // fresh session for the next search
    if (center) onSelect({ name: s.label, center });
    else if (onSubmitText) onSubmitText(s.label);
  }

  function submit() {
    if (open && active >= 0 && items[active]) return void pick(items[active]);
    if (open && items[0]) return void pick(items[0]);
    setOpen(false);
    // Fire even when the box is empty so the button still takes you to the map
    // (browse everything) instead of doing nothing.
    onSubmitText?.(value.trim());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (!open) {
      return;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <div
        className={
          showButton
            ? "flex flex-col gap-2 rounded-[14px] bg-white p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:flex-row sm:items-stretch"
            : "flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5"
        }
      >
        <label
          className={
            showButton
              ? "flex flex-1 items-center gap-2.5 rounded-[9px] px-3.5 py-2"
              : "flex flex-1 items-center gap-2"
          }
        >
          <MapPin className="h-5 w-5 flex-shrink-0 text-orange" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => items.length > 0 && setOpen(true)}
            type="text"
            placeholder={placeholder}
            autoComplete="off"
            className="w-full bg-transparent text-[15.5px] text-ink outline-none placeholder:text-[#9aa6b3]"
          />
          {loading && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-muted" />}
        </label>
        {showButton && (
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-orange px-[22px] py-[13px] text-[15px] font-semibold text-white transition hover:bg-orange-dark"
          >
            <Search className="h-[18px] w-[18px]" /> {buttonLabel}
          </button>
        )}
      </div>

      {open && items.length > 0 && (
        <ul className="absolute z-[60] mt-1.5 w-full overflow-hidden rounded-xl border border-line bg-white py-1 text-left shadow-[0_12px_32px_rgba(16,32,48,0.18)]">
          {items.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                // mousedown (not click) so it fires before the input blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  void pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[14.5px]",
                  i === active ? "bg-bg-soft text-navy" : "text-ink hover:bg-bg-soft",
                )}
              >
                <MapPin className="h-4 w-4 flex-shrink-0 text-orange" />
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
