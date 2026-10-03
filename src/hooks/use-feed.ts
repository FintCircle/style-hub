import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { posts as samplePosts, reels as sampleReels } from "@/lib/lebeho-data";
import { listFeed, listReels } from "@/lib/lebeho.functions";

/** Live D1 posts on Cloudflare; sample posts where no database is attached (preview). */
export function useFeed(options: { rushOnly?: boolean } = {}) {
  const { isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: ["feed", options.rushOnly ?? false, isSignedIn ?? false],
    queryFn: () => listFeed({ data: options.rushOnly ? { rushOnly: true } : {} }),
  });
  const live = query.data?.live ?? false;
  const fallback = options.rushOnly ? samplePosts.filter((p) => p.rushEndsAt) : samplePosts;
  return {
    posts: live ? query.data!.posts : query.isLoading ? [] : fallback,
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
  return { reels: live ? query.data!.reels : query.isLoading ? [] : sampleReels, live };
}
