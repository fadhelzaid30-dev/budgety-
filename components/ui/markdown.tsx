import * as React from "react";

/**
 * Minimal Markdown renderer for AI chat responses.
 *
 * The model is prompted to use bold for figures and bullets for actions, and
 * the chat previously rendered that into a `whitespace-pre-wrap` div — so users
 * saw literal **asterisks** around every number.
 *
 * Hand-rolled rather than pulling in react-markdown + the remark ecosystem: the
 * input is a constrained subset we ask for ourselves, and building React
 * elements directly means there is no HTML parsing and no dangerouslySetInnerHTML
 * anywhere, so model output can never inject markup. Anything unrecognised
 * falls through as plain text rather than breaking.
 *
 * Supports: paragraphs, # headings, - and * bullets, 1. numbered lists,
 * **bold**, *italic*, `code`. Deliberately not tables or links — the model
 * isn't asked for them, and a half-working table is worse than a paragraph.
 */
export function Markdown({ children }: { children: string }) {
  return <div className="space-y-2.5">{renderBlocks(children)}</div>;
}

function renderBlocks(src: string): React.ReactNode[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Heading
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      out.push(
        <p key={key++} className="text-sm font-semibold text-foreground">
          {renderInline(heading[2])}
        </p>,
      );
      i++;
      continue;
    }

    // Bullet list — consume consecutive bullet lines
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      out.push(
        <ul key={key++} className="ml-1 list-outside list-disc space-y-1 pl-4 marker:text-muted">
          {items.map((t, n) => (
            <li key={n}>{renderInline(t)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      out.push(
        <ol key={key++} className="ml-1 list-outside list-decimal space-y-1 pl-4 marker:text-muted">
          {items.map((t, n) => (
            <li key={n}>{renderInline(t)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph — consume until a blank line or the start of another block
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i]) &&
      !/^#{1,4}\s+/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(<p key={key++}>{renderInline(para.join(" "))}</p>);
  }

  return out;
}

/**
 * Inline formatting. Tokenised in one pass so the delimiters can't nest
 * incorrectly — a stray asterisk renders as an asterisk rather than swallowing
 * the rest of the message.
 */
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];

    if (token.startsWith("**")) {
      out.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      out.push(
        <code key={key++} className="rounded-sm bg-surface-sunken px-1 py-0.5 font-mono text-[0.9em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}
