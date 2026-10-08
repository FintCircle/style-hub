import React from "react";
import { HashtagLink } from "./HashtagLink";

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex to tokenize bold (**text**), italic (*text*), hashtags (#tag), and URLs
  const tokenRegex = /(\*\*.*?\*\*|\*.*?\*|#[a-zA-Z0-9_]+|https?:\/\/[^\s]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("#") && part.length > 1 && /^#[a-zA-Z0-9_]+$/.test(part)) {
      const slug = part.slice(1).toLowerCase();
      return <HashtagLink key={i} hashtag={slug} className="inline-flex" />;
    }
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function FormattedText({
  text,
  className = "",
  maxChars,
  onReadMore,
}: {
  text: string;
  className?: string;
  maxChars?: number;
  onReadMore?: () => void;
}) {
  if (!text) return null;

  let isTruncated = false;
  let rawText = text;
  if (maxChars && text.length > maxChars) {
    rawText = text.slice(0, maxChars).trim();
    isTruncated = true;
  }

  // Split text into paragraph blocks separated by double newlines
  const paragraphs = rawText.split(/\n\n+/);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split("\n");

        // Check for bullet list
        const isList = lines.length > 0 && lines.every((line) => /^\s*[-*•]\s+/.test(line));
        if (isList) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1.5 my-2 pl-1">
              {lines.map((line, lIdx) => {
                const itemText = line.replace(/^\s*[-*•]\s+/, "");
                return (
                  <li key={lIdx} className="leading-relaxed">
                    {parseInlineFormatting(itemText)}
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check for blockquote
        const isQuote = lines.length > 0 && lines.every((line) => /^\s*>\s*/.test(line));
        if (isQuote) {
          return (
            <blockquote
              key={pIdx}
              className="border-l-2 border-primary/60 pl-3.5 my-2.5 text-muted-foreground italic space-y-1"
            >
              {lines.map((line, lIdx) => {
                const quoteText = line.replace(/^\s*>\s*/, "");
                return (
                  <p key={lIdx} className="leading-relaxed">
                    {parseInlineFormatting(quoteText)}
                  </p>
                );
              })}
            </blockquote>
          );
        }

        // Standard paragraph
        return (
          <p key={pIdx} className="leading-relaxed break-words text-[16px] sm:text-[17px]">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {parseInlineFormatting(line)}
              </React.Fragment>
            ))}
            {pIdx === paragraphs.length - 1 && isTruncated && (
              <span
                onClick={onReadMore}
                className="ml-1.5 font-medium text-muted-foreground hover:text-foreground underline underline-offset-2 cursor-pointer"
              >
                … read more
              </span>
            )}
          </p>
        );
      })}
    </div>
  );
}
