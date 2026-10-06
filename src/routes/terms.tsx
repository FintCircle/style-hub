import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "@/components/lebeho/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — LeBeHo" },
      {
        name: "description",
        content: "The terms for using LeBeHo and participating in its fashion community.",
      },
      { property: "og:title", content: "Terms — LeBeHo" },
      { property: "og:description", content: "The terms for using LeBeHo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <InfoPage eyebrow="The essentials" title="Terms">
      <p className="text-muted-foreground">
        This is starter copy for the LeBeHo MVP and should be reviewed before public launch.
      </p>
      <InfoSection title="Using LeBeHo">
        <p>
          Use LeBeHo for lawful fashion and style conversations. You are responsible for what you
          post and for having the right to share it.
        </p>
      </InfoSection>
      <InfoSection title="Your content">
        <p>
          You keep ownership of your content. By posting it, you allow LeBeHo to display and
          distribute it as needed to operate the platform.
        </p>
      </InfoSection>
      <InfoSection title="Community safety">
        <p>
          We may remove content or restrict accounts that break our Guidelines, infringe rights,
          threaten safety, or misuse the service.
        </p>
      </InfoSection>
      <InfoSection title="Service changes">
        <p>
          Features may change as LeBeHo develops. These terms may also be updated, with the current
          version shown on this page.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
