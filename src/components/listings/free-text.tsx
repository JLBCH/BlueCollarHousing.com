/** Renders owner-entered free text the way they meant it: consecutive
 *  "* item" / "- item" / "• item" lines become a real bullet list, everything
 *  else keeps its line breaks. Used for every long-text block on the public
 *  listing page (description, rates, house rules, nearby projects, commercial
 *  details, …) so pasted lists never show raw asterisks. */
export function FreeText({ value }: { value: string }) {
  const lines = value.split(/\r?\n/);
  const blocks: ({ kind: "text"; lines: string[] } | { kind: "list"; items: string[] })[] = [];
  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[*•-]\s+(.*)$/)?.[1];
    const last = blocks[blocks.length - 1];
    if (bullet !== undefined) {
      if (last?.kind === "list") last.items.push(bullet);
      else blocks.push({ kind: "list", items: [bullet] });
    } else if (last?.kind === "text") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "text", lines: [line] });
    }
  }
  return (
    <>
      {blocks.map((b, i) =>
        b.kind === "list" ? (
          <ul key={i} className="list-disc space-y-0.5 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b.lines.join("\n")}
          </p>
        ),
      )}
    </>
  );
}
