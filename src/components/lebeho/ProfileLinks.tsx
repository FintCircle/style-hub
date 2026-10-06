import type { ReactNode, SVGProps } from "react";
import { Globe } from "lucide-react";

type ProfileLinksProps = {
  website?: string | undefined;
  instagram?: string | undefined;
  tiktok?: string | undefined;
  x?: string | undefined;
};

type LinkItem = { label: string; href: string; icon: ReactNode };

const iconClass = "size-[18px]";

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const isUrl = (value: string) => /^https?:\/\//i.test(value);
const cleanHandle = (value: string) => value.trim().replace(/^@/, "");

function socialHref(value: string, base: string, prefix = "") {
  const trimmed = value.trim();
  if (isUrl(trimmed)) return trimmed;
  return `${base}${prefix}${encodeURIComponent(cleanHandle(trimmed))}`;
}

function websiteHref(value: string) {
  const trimmed = value.trim();
  return isUrl(trimmed) ? trimmed : `https://${trimmed}`;
}

export function ProfileLinks({ website, instagram, tiktok, x }: ProfileLinksProps) {
  const items: LinkItem[] = [];
  if (website?.trim())
    items.push({
      label: "Website",
      href: websiteHref(website),
      icon: <Globe className={iconClass} />,
    });
  if (instagram?.trim())
    items.push({
      label: "Instagram",
      href: socialHref(instagram, "https://instagram.com/"),
      icon: <InstagramIcon className={iconClass} />,
    });
  if (tiktok?.trim())
    items.push({
      label: "TikTok",
      href: socialHref(tiktok, "https://www.tiktok.com/", "@"),
      icon: <TikTokIcon className={iconClass} />,
    });
  if (x?.trim())
    items.push({
      label: "X",
      href: socialHref(x, "https://x.com/"),
      icon: <XIcon className="size-4" />,
    });

  if (!items.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Links">
      {items.map((item) => (
        <li key={item.label}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={item.label}
            className="flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {item.icon}
            <span className="sr-only">{item.label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
