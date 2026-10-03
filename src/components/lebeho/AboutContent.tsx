import { Fragment, useRef, type ReactNode } from "react";
import { Bold, Heading2, Italic, Link2, List, Quote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_PATTERN).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="underline underline-offset-4 hover:text-muted-foreground"
        >
          {link[1]}
        </a>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function renderLines(lines: string[]) {
  return lines.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {renderInline(line)}
    </Fragment>
  ));
}

export function AboutContent({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 text-pretty text-[15px] leading-relaxed sm:text-base">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        if (lines.length === 1 && /^#{1,3}\s/.test(block)) {
          return (
            <h3 key={index} className="pt-2 font-editorial text-xl leading-snug">
              {renderInline(block.replace(/^#{1,3}\s+/, ""))}
            </h3>
          );
        }
        if (lines.every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={index} className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
              {lines.map((line, i) => (
                <li key={i}>{renderInline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (lines.every((line) => line.startsWith(">"))) {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-foreground/30 pl-4 font-editorial text-lg italic leading-snug"
            >
              {renderLines(lines.map((line) => line.replace(/^>\s?/, "")))}
            </blockquote>
          );
        }
        return <p key={index}>{renderLines(lines)}</p>;
      })}
    </div>
  );
}

type FormatAction = { label: string; icon: typeof Bold; wrap?: [string, string]; prefix?: string };

const FORMAT_ACTIONS: FormatAction[] = [
  { label: "Bold", icon: Bold, wrap: ["**", "**"] },
  { label: "Italic", icon: Italic, wrap: ["*", "*"] },
  { label: "Heading", icon: Heading2, prefix: "## " },
  { label: "Bulleted list", icon: List, prefix: "- " },
  { label: "Quote", icon: Quote, prefix: "> " },
  { label: "Link", icon: Link2, wrap: ["[", "](https://)"] },
];

export function AboutEditor({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (action: FormatAction) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    let next: string;
    let cursorStart: number;
    let cursorEnd: number;

    if (action.wrap) {
      const [before, after] = action.wrap;
      const selected = value.slice(start, end) || action.label.toLowerCase();
      next = value.slice(0, start) + before + selected + after + value.slice(end);
      cursorStart = start + before.length;
      cursorEnd = cursorStart + selected.length;
    } else {
      const prefix = action.prefix ?? "";
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const segment = value.slice(lineStart, end);
      const prefixed = segment
        .split("\n")
        .map((line) => (line.startsWith(prefix) ? line : prefix + line))
        .join("\n");
      next = value.slice(0, lineStart) + prefixed + value.slice(end);
      cursorStart = lineStart;
      cursorEnd = lineStart + prefixed.length;
    }

    if (next.length > maxLength) return;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div className="overflow-hidden rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex items-center gap-0.5 overflow-x-auto border-b border-input bg-muted/40 px-1.5 py-1"
      >
        {FORMAT_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            aria-label={action.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyFormat(action)}
            className="flex size-9 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <action.icon className="size-4" aria-hidden="true" />
          </button>
        ))}
      </div>
      <Textarea
        ref={ref}
        aria-label="About"
        className="min-h-56 resize-y rounded-none border-0 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0"
        maxLength={maxLength}
        placeholder="Share your story, your style, and what people should know about you..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex items-center justify-between gap-3 border-t border-input px-3 py-1.5 text-xs text-muted-foreground">
        <span>Leave a blank line between paragraphs.</span>
        <span className="tabular-nums">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
