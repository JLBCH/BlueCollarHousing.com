import Link from "next/link";
import { cn } from "@/lib/cn";

/* eslint-disable @next/next/no-img-element */

// The logo is a single self-contained image (mark + wordmark + slogan baked
// in), so we drop it in whole with no typeset text beside it. `inverted` swaps
// to the white version for dark backgrounds (footer).
const COLOR = "/brand/header-logo.png";
const WHITE = "/brand/options/white.png";

export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="Blue Collar Housing home"
      className="inline-flex items-center"
    >
      <img
        src={inverted ? WHITE : COLOR}
        alt="Blue Collar Housing"
        className={cn("w-auto", className)}
      />
    </Link>
  );
}
