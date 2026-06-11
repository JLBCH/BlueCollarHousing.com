import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * Brand logo: the house-and-refinery mark, blue+orange on light backgrounds
 * and white on dark. Mark-only PNGs live in /public/brand; the wordmark text
 * is typeset beside it.
 */
export function LogoMark({
  inverted = false,
  className,
}: {
  inverted?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={inverted ? "/brand/logo-white.png" : "/brand/logo-color.png"}
      alt="BlueCollarHousing"
      className={cn("h-11 w-auto", className)}
    />
  );
}

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
      aria-label="BlueCollarHousing home"
      className={cn("flex items-center gap-2.5", className)}
    >
      <LogoMark inverted={inverted} />
      <span className="font-display leading-[0.92]">
        <span
          className={cn(
            "block text-[19px] font-bold tracking-[0.01em]",
            inverted ? "text-white" : "text-navy",
          )}
        >
          Blue Collar Housing
        </span>
        <span
          className={cn(
            "block text-[9.5px] font-semibold tracking-[0.13em]",
            inverted ? "text-white/70" : "text-muted",
          )}
        >
          QUALITY HOUSING. BUILT FOR THE JOB.
        </span>
      </span>
    </Link>
  );
}
