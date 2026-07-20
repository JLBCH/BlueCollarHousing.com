import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Blog markdown renderer, styled to match the site (terms page typography:
 * navy display headings, orange links, 15px body). Used by the public post
 * page (server) and the admin editor's live preview (client).
 *
 * Raw HTML in the markdown is NOT rendered — react-markdown escapes it by
 * default (no rehype-raw). Posts are admin-authored, but keep it that way as
 * defense in depth: pasted AI/third-party markdown can't inject script tags.
 */

const components: Components = {
  // Posts may start with a # h1, but the page already renders the title as the
  // h1 — step every heading down one visual level and keep the hierarchy tidy.
  h1: ({ children }) => (
    <h2 className="font-display mt-8 text-[24px] font-bold text-navy sm:text-[26px]">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="font-display mt-8 text-[20px] font-bold text-navy sm:text-[22px]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display mt-6 text-[17px] font-bold text-navy sm:text-[18px]">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-5 text-[15.5px] font-bold text-navy">{children}</h4>
  ),
  p: ({ children }) => <p className="mt-3 text-[15px] leading-relaxed text-[#3a4a5a]">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-orange underline underline-offset-2 hover:text-orange-dark"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#3a4a5a]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-[#3a4a5a]">
      {children}
    </ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-[3px] border-orange bg-bg-soft py-1 pl-4 pr-3 text-[15px] italic text-[#3a4a5a] [&>p]:mt-1.5">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) =>
    className ? (
      // Fenced block (react-markdown passes language-* on block code).
      <code className="block text-[13.5px] leading-relaxed">{children}</code>
    ) : (
      <code className="rounded bg-bg-soft px-1.5 py-0.5 font-mono text-[13.5px] text-navy">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="mt-4 overflow-x-auto rounded-lg bg-navy p-4 font-mono text-white">{children}</pre>
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-left text-[14px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-3 py-2 text-[12.5px] font-bold uppercase tracking-wide text-muted">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line px-3 py-2 text-[#3a4a5a]">{children}</td>
  ),
  hr: () => <hr className="mt-8 border-line" />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="mt-4 max-w-full rounded-card border border-line"
    />
  ),
  strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="[&>:first-child]:mt-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
