import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";

/** Centered eyebrow + heading + optional subcopy for section intros. */
export function SectionHead({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Container className={cn("max-w-[640px] text-center", className)}>
      {eyebrow && (
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display mt-2.5 text-[34px] font-bold text-navy sm:text-[42px]">
        {title}
      </h2>
      {children && (
        <p className="mt-3 text-[17px] text-muted">{children}</p>
      )}
    </Container>
  );
}
