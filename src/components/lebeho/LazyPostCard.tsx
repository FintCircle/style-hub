import { useEffect, useRef, useState } from "react";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

type LazyPostCardProps = {
  post: Post;
  priority?: boolean;
};

/**
 * Lazy loads a PostCard when it approaches or enters the viewport using IntersectionObserver.
 * Keeps rendered post cards mounted once visible to avoid layout shifts.
 */
export function LazyPostCard({ post, priority = false }: LazyPostCardProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isVisible) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );

    const current = containerRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) observer.unobserve(current);
      observer.disconnect();
    };
  }, [priority, isVisible]);

  return (
    <div ref={containerRef}>
      {isVisible ? (
        <PostCard post={post} />
      ) : (
        <article
          className="border-b border-border px-5 py-8"
          aria-busy="true"
          aria-label="Loading post"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          </div>
          <div className="mt-4 h-12 w-3/4 rounded bg-muted/60 animate-pulse" />
        </article>
      )}
    </div>
  );
}
