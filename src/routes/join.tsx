import { createFileRoute, Link } from "@tanstack/react-router";
import { PortalLink } from "@/components/lebeho/PortalLink";
import { InfoPage, InfoSection } from "@/components/lebeho/InfoPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join LeBeHo" },
      {
        name: "description",
        content: "Join LeBeHo and take part in honest fashion conversations.",
      },
      { property: "og:title", content: "Join LeBeHo" },
      {
        property: "og:description",
        content: "Come for the fashion. Stay for the honest opinions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  return (
    <InfoPage eyebrow="Come as you are" title="Join LeBeHo">
      <p>
        Know exactly what you're doing, have absolutely no idea what to wear, or be somewhere in
        between. If fashion interests you, there is a place for you here.
      </p>
      <InfoSection title="Start with the conversation">
        <p>Explore what people are wearing, thinking, asking, and deciding right now.</p>
      </InfoSection>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg" className="rounded-full px-7">
          <PortalLink mode="sign-up" returnPath="/">
            Create your account
          </PortalLink>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-full px-7">
          <PortalLink mode="sign-in" returnPath="/">
            Sign in
          </PortalLink>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Or keep browsing —{" "}
        <Link to="/" className="underline underline-offset-4">
          explore the Feed
        </Link>
        . You'll need an account to post, vote, share Thoughts, or like Reels.
      </p>
    </InfoPage>
  );
}
