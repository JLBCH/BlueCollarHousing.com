import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "orange" | "navy" | "ghost" | "outline";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[transform,background-color,box-shadow] duration-150 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/60 disabled:opacity-60 disabled:pointer-events-none cursor-pointer";

const variants: Record<Variant, string> = {
  orange: "bg-orange text-white hover:bg-orange-dark",
  navy: "bg-navy text-white hover:bg-navy-deep",
  ghost:
    "bg-white/10 text-white border border-white/55 backdrop-blur-sm hover:bg-white/20",
  outline: "bg-white text-navy border border-line hover:border-navy/40",
};

const sizes: Record<Size, string> = {
  md: "text-[15px] px-[22px] py-[13px]",
  lg: "text-base px-7 py-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

/** Anchor/link button when `href` is provided, otherwise a real <button>. */
export function Button(
  props: CommonProps &
    (
      | ({ href: string } & Omit<
          React.ComponentProps<typeof Link>,
          "className" | "children"
        >)
      | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
    ),
) {
  const { variant = "orange", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...rest } =
      props;
    void _v; void _s; void _c; void _ch;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { variant: _v, size: _s, className: _c, children: _ch, href: _h, ...rest } =
    props;
  void _v; void _s; void _c; void _ch; void _h;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
