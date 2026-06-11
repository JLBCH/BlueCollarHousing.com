import { cn } from "@/lib/cn";

/** Centered page-width wrapper. Max ~1180px with consistent gutters. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1180px] px-5 sm:px-6", className)}>
      {children}
    </div>
  );
}
