import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "@/components/lebeho/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — LeBeHo" },
      { name: "description", content: "How LeBeHo approaches personal information and privacy." },
      { property: "og:title", content: "Privacy — LeBeHo" },
      {
        property: "og:description",
        content: "How LeBeHo approaches personal information and privacy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <InfoPage eyebrow="Your information" title="Privacy">
      <p className="text-muted-foreground">
        This is starter copy for the LeBeHo MVP and should be reviewed before public launch.
      </p>
      <InfoSection title="What we collect">
        <p>
          LeBeHo may collect account details, content you post, interactions such as votes and
          likes, and basic technical information needed to run the service.
        </p>
      </InfoSection>
      <InfoSection title="How it is used">
        <p>
          We use information to provide the Feed, Rush Hour, Reels, profiles, safety features, and
          to understand and improve the experience.
        </p>
      </InfoSection>
      <InfoSection title="What you control">
        <p>
          You can choose what to post and may request access to, correction of, or deletion of your
          personal information where applicable.
        </p>
      </InfoSection>
      <InfoSection title="Keeping it safe">
        <p>
          We use reasonable safeguards and limit access to personal information, while recognizing
          that no online service can guarantee absolute security.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
