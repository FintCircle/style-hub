import type { ReactNode } from "react";
import { ACCOUNTS_URL, signInUrl, signUpUrl } from "@/lib/account";

/** Link to the Clerk portal that returns the visitor to `returnPath` (or the current page). */
export function PortalLink({
  mode,
  returnPath,
  className,
  children,
}: {
  mode: "sign-in" | "sign-up";
  returnPath?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={`${ACCOUNTS_URL}/${mode}`}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(mode === "sign-up" ? signUpUrl(returnPath) : signInUrl(returnPath));
      }}
    >
      {children}
    </a>
  );
}
