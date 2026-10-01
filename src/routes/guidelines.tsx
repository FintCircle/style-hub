import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "@/components/lebeho/InfoPage";

export const Route = createFileRoute("/guidelines")({
  head: () => ({ meta: [
    { title: "Community Guidelines — LeBeHo" },
    { name: "description", content: "How to keep LeBeHo’s fashion conversations honest, useful, and welcoming." },
    { property: "og:title", content: "Community Guidelines — LeBeHo" },
    { property: "og:description", content: "Keep LeBeHo’s fashion conversations honest, useful, and welcoming." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuidelinesPage,
});

function GuidelinesPage() {
  return <InfoPage eyebrow="The community" title="Guidelines">
    <p className="text-muted-foreground">This is starter copy for the LeBeHo MVP and should be reviewed before public launch.</p>
    <InfoSection title="Keep it fashion"><p>Posts and Reels belong here when they are about fashion, personal style, clothing, accessories, beauty as it relates to a look, or the culture around them.</p></InfoSection>
    <InfoSection title="Be honest, not cruel"><p>Give useful opinions without harassment, humiliation, hate, threats, or attacks on someone’s body or identity.</p></InfoSection>
    <InfoSection title="Respect ownership"><p>Share content you made or have permission to use. Credit creators and never impersonate another person.</p></InfoSection>
    <InfoSection title="Protect the moment"><p>Rush Hour is for genuine time-sensitive fashion decisions. Do not use false urgency, spam, or manipulation to attract attention.</p></InfoSection>
  </InfoPage>;
}
