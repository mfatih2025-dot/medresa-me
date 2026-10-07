/*
 * The news body format: a small Markdown subset an editor (or a translation
 * draft) can write without ever touching design. It is parsed into blocks,
 * never injected as HTML, so nothing an editor types can break the template.
 *
 *   paragraph text           blank line between paragraphs
 *   ## Subheading
 *   - item / 1. item         lists
 *   > quotation              (consecutive lines form one quotation)
 *   ![](2)                   photograph 2 of the article, on its own line
 *   **strong**  *emphasis*  [link text](https://…)
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong"; v: Inline[] }
  | { t: "em"; v: Inline[] }
  | { t: "link"; v: Inline[]; href: string };

export type Block =
  | { type: "p"; content: Inline[] }
  | { type: "h"; content: Inline[] }
  | { type: "ul" | "ol"; items: Inline[][] }
  | { type: "quote"; content: Inline[] }
  | { type: "photo"; n: number };

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    const m = INLINE.exec(rest);
    if (!m) {
      out.push({ t: "text", v: rest });
      break;
    }
    if (m.index > 0) out.push({ t: "text", v: rest.slice(0, m.index) });
    if (m[1] !== undefined) out.push({ t: "strong", v: parseInline(m[1]) });
    else if (m[2] !== undefined) out.push({ t: "em", v: parseInline(m[2]) });
    else out.push({ t: "link", v: parseInline(m[3]), href: m[4] });
    rest = rest.slice(m.index + m[0].length);
  }
  return out;
}

const join = (lines: string[]) => lines.map((l) => l.trim()).join(" ");

export function parseBody(md: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of md.trim().split(/\n\s*\n/)) {
    const lines = chunk.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    const first = lines[0].trim();
    const photo = /^!\[[^\]]*\]\((\d+)\)$/.exec(first);
    if (photo && lines.length === 1) blocks.push({ type: "photo", n: Number(photo[1]) });
    else if (first.startsWith("## ") || first.startsWith("### "))
      blocks.push({ type: "h", content: parseInline(join(lines).replace(/^#+\s+/, "")) });
    else if (lines.every((l) => /^\s*-\s+/.test(l)))
      blocks.push({ type: "ul", items: lines.map((l) => parseInline(l.replace(/^\s*-\s+/, ""))) });
    else if (lines.every((l) => /^\s*\d+\.\s+/.test(l)))
      blocks.push({ type: "ol", items: lines.map((l) => parseInline(l.replace(/^\s*\d+\.\s+/, ""))) });
    else if (lines.every((l) => /^\s*>/.test(l)))
      blocks.push({ type: "quote", content: parseInline(join(lines.map((l) => l.replace(/^\s*>\s?/, "")))) });
    else blocks.push({ type: "p", content: parseInline(join(lines)) });
  }
  return blocks;
}

/** Photographs placed in the text with ![](n) (1-based). */
export const placedPhotos = (blocks: Block[]) =>
  new Set(blocks.flatMap((b) => (b.type === "photo" ? [b.n] : [])));
