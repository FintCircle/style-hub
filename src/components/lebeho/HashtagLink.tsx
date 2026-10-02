import { Link } from "@tanstack/react-router";
import { getHashtagLabel, normalizeHashtag } from "@/lib/lebeho-data";

export function HashtagLink({ hashtag, className = "" }: { hashtag: string; className?: string }) {
  const slug = normalizeHashtag(hashtag);

  return (
    <Link
      to="/hashtags/$hashtag"
      params={{ hashtag: slug }}
      className={`inline-flex rounded-full border border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      #{getHashtagLabel(slug)}
    </Link>
  );
}
