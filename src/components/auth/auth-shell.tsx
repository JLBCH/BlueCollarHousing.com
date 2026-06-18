import { Logo } from "@/components/brand/logo";

/** Centered card layout shared by the login / register / password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-92px)] flex-col items-center justify-center bg-bg-soft px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex justify-center">
          <Logo className="h-[52px]" />
        </div>
        <div className="rounded-card border border-line bg-white p-7 shadow-[0_8px_24px_rgba(16,32,48,0.08)]">
          <h1 className="font-display text-[26px] font-bold text-navy">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[14.5px] text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <p className="mt-5 text-center text-[14px] text-muted">{footer}</p>
        )}
      </div>
    </div>
  );
}

export const authInputCls =
  "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-navy/40 placeholder:text-[#9aa6b3]";

export const authLabelCls =
  "mb-1.5 block text-[13.5px] font-semibold text-navy";

export const authSubmitCls =
  "inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-orange px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-orange-dark disabled:opacity-60";
