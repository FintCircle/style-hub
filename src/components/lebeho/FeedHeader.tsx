import { Link } from "@tanstack/react-router";
import { useClerk } from "@clerk/clerk-react";
import { PortalLink } from "./PortalLink";
import { useViewer } from "@/hooks/use-viewer";
import { Menu, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const menuItems = [
  { to: "/about", label: "About" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/guidelines", label: "Guidelines" },
] as const;

export function FeedHeader() {
  const { isSignedIn, profile, isAdmin } = useViewer();
  const { signOut } = useClerk();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-5 py-3 backdrop-blur-xl">
      <div className="relative mx-auto grid max-w-xl grid-cols-[2.5rem_1fr_2.5rem] items-center">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="rounded-full text-rush"
          title="Rush Hour"
        >
          <Link to="/rush" aria-label="Open Rush Hour">
            <span
              className="absolute size-7 rounded-full border border-rush/30 rush-pulse"
              aria-hidden="true"
            />
            <Timer className="relative size-5" strokeWidth={1.75} />
          </Link>
        </Button>

        <Link
          to="/"
          className="justify-self-center font-editorial text-2xl"
          aria-label="LeBeHo Feed"
        >
          LeBeHo
        </Link>

        {isAdmin && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="absolute right-10 rounded-full"
            title="Admin"
          >
            <Link to="/admin" aria-label="Open admin area">
              <ShieldCheck className="size-5" strokeWidth={1.5} />
            </Link>
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="justify-self-end rounded-full"
              aria-label="Open menu"
            >
              <Menu className="size-5" strokeWidth={1.5} />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex w-[86vw] max-w-sm flex-col border-border bg-background p-0">
            <SheetHeader className="border-b border-border px-7 py-8 text-left">
              <SheetTitle className="font-editorial text-3xl font-normal">LeBeHo</SheetTitle>
              <SheetDescription>Let’s Be Honest About Fashion.</SheetDescription>
            </SheetHeader>
            <nav aria-label="Information" className="flex flex-1 flex-col px-7 py-5">
              {menuItems.map((item, index) => (
                <SheetClose asChild key={item.to}>
                  <Link
                    to={item.to}
                    className="flex items-baseline justify-between border-b border-border py-5 text-left transition-colors hover:text-rush"
                  >
                    <span className="font-editorial text-2xl">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground">0{index + 1}</span>
                  </Link>
                </SheetClose>
              ))}
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="flex items-baseline justify-between border-b border-border py-5 text-left transition-colors hover:text-rush"
                >
                  <span className="font-editorial text-2xl">Sign out</span>
                  <span className="text-[10px] text-muted-foreground">{profile?.handle ?? ""}</span>
                </button>
              ) : (
                <PortalLink
                  mode="sign-up"
                  returnPath="/"
                  className="flex items-baseline justify-between border-b border-border py-5 text-left transition-colors hover:text-rush"
                >
                  <span className="font-editorial text-2xl">Join LeBeHo</span>
                  <span className="text-[10px] text-muted-foreground">0{menuItems.length + 1}</span>
                </PortalLink>
              )}
            </nav>
            <p className="px-7 pb-8 text-xs uppercase text-muted-foreground">
              Fashion is the conversation.
            </p>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
