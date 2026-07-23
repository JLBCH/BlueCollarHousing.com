import { Container } from "@/components/ui/container";

/**
 * Renders an attorney-authored legal document (Terms of Use / Privacy Policy)
 * from the structured copy in @/lib/legal. Numbered subsection headings are
 * kept visible because the documents cross-reference them ("see Section 5.3").
 */
export function LegalDoc({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  /** Lead paragraphs; the document's own title/date lines are dropped. */
  intro: string[];
  sections: { heading: string; items: { title: string; text: string[] }[] }[];
}) {
  // The source documents open with the company name, the document title and a
  // "Last updated" line — the page header already shows those, so skip them.
  const lead = intro.filter(
    (p) => !/^BLUE COLLAR HOUSING$/i.test(p) && !/^Last updated:/i.test(p) && p !== title.toUpperCase(),
  );

  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-[800px]">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Legal
          </p>
          <h1 className="font-display mt-3 text-[36px] font-bold text-navy sm:text-[44px]">
            {title}
          </h1>
          <p className="mt-3 text-[14px] text-muted">Last updated: {lastUpdated}</p>
        </div>

        {lead.length > 0 && (
          <div className="mt-8 space-y-3 border-b border-line pb-8">
            {lead.map((p, i) => (
              <p key={i} className="text-[15.5px] leading-relaxed text-[#3a4a5a]">
                {p}
              </p>
            ))}
          </div>
        )}

        <div className="mt-10 space-y-10">
          {sections.map(({ heading, items }) => (
            <section key={heading}>
              <h2 className="font-display text-[19px] font-bold text-navy sm:text-[21px]">
                {heading}
              </h2>
              <div className="mt-4 space-y-5">
                {items.map((item, i) => (
                  <div key={i}>
                    {item.title && (
                      <h3 className="text-[15.5px] font-bold text-navy">{item.title}</h3>
                    )}
                    <div className="mt-1.5 space-y-3">
                      {item.text.map((p, j) => (
                        <p key={j} className="text-[15px] leading-relaxed text-[#3a4a5a]">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </section>
  );
}
