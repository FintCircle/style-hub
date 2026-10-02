import { useEffect, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { goToSignIn, signInUrl, signUpUrl } from "@/lib/account";
import { Button } from "@/components/ui/button";

/** Pages that need an account: signed-out visitors are sent to the Clerk portal. */
export function AccountGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && !isSignedIn) goToSignIn();
  }, [isLoaded, isSignedIn]);

  if (isLoaded && isSignedIn) return <>{children}</>;

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-editorial text-3xl">Join the conversation</p>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">
        {isLoaded ? "Taking you to sign in…" : "Checking your account…"}
      </p>
      {isLoaded && (
        <div className="mt-6 flex gap-3">
          <Button asChild className="rounded-full">
            <a href={signUpUrl()}>Join LeBeHo</a>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a href={signInUrl()}>Sign in</a>
          </Button>
        </div>
      )}
    </div>
  );
}
