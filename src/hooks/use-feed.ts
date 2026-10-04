import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { listFeed, listReels } from "@/lib/lebeho.functions";

/** Database-backed feed. An unavailable database is empty, never seeded content. */
export function useFeed(options: { rushOnly?: boolean } = {}) {
  const { isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: ["feed", options.rushOnly ?? false, isSignedIn ?? false],
    queryFn: () => listFeed({ data: options.rushOnly ? { rushOnly: true } : {} }),
  });
  const live = query.data?.live ?? false;
  return {
    posts: query.data?.posts ?? [],
    live,
    isLoading: query.isLoading,
  };
}

export function useReels() {
  const { isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: ["reels", isSignedIn ?? false],
    queryFn: () => listReels(),
  });
  const live = query.data?.live ?? false;
  return { reels: query.data?.reels ?? [], live, isLoading: query.isLoading };
}
