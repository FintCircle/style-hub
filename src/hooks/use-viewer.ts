import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { goToSignIn } from "@/lib/account";
import { getViewer } from "@/lib/lebeho.functions";

/** Clerk session + the matching D1 profile (created on first sign-in). */
export function useViewer() {
  const { isLoaded, isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: ["viewer", isSignedIn],
    queryFn: () => getViewer(),
    enabled: isLoaded && Boolean(isSignedIn),
    staleTime: 60_000,
  });
  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
    profile: query.data?.profile ?? null,
    live: query.data?.live ?? false,
    isAdmin: query.data?.isAdmin ?? false,
    restricted: query.data?.restricted ?? false,
    isLoadingProfile: query.isLoading,
  };
}

/** Returns a guard: true when signed in, otherwise sends the user to the portal. */
export function useRequireAccount() {
  const { isSignedIn } = useAuth();
  return useCallback(() => {
    if (isSignedIn) return true;
    goToSignIn();
    return false;
  }, [isSignedIn]);
}
