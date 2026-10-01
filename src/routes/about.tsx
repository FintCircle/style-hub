import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, InfoSection } from "@/components/lebeho/InfoPage";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About LeBeHo — Let’s Be Honest About Fashion" },
    { name: "description", content: "LeBeHo brings fashion conversations, time-sensitive advice, and short style videos into one place." },
    { property: "og:title", content: "About LeBeHo — Let’s Be Honest About Fashion" },
    { property: "og:description", content: "A social platform for fashion, style, and the decisions that come with them." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <InfoPage eyebrow="About LeBeHo" title="Let’s Be Honest About Fashion.">
      <div className="space-y-4">
        <p>LeBeHo is a social platform for fashion, style, and the decisions that come with them.</p>
        <p>Some days you want to show what you're wearing. Some days you have something to say about fashion. And sometimes you just need someone to tell you which outfit works before you walk out the door.</p>
        <p>LeBeHo brings all of that into one place.</p>
      </div>

      <InfoSection title="Talk fashion.">
        <p>The Feed is where fashion conversations happen.</p>
        <p>Post a thought. Share a photo. Ask for advice. Talk about a trend. Show your outfit. Or add a vote when you want people to help you choose.</p>
        <p>No need to fit your post into a particular format. If it's about fashion or style, it belongs in the conversation.</p>
      </InfoSection>

      <InfoSection title="When you need an answer now.">
        <p>That's Rush Hour.</p>
        <p>Add a countdown to your Feed post when your decision can't wait. Maybe you're getting dressed for dinner, choosing between two pairs of shoes, shopping and need a second opinion, or you're about to leave home.</p>
        <p>People can enter Rush Hour specifically to find those time-sensitive posts and help while their votes and thoughts still matter.</p>
        <p>When the clock is ticking, fashion gets interesting.</p>
      </InfoSection>

      <InfoSection title="Watch fashion.">
        <p>Reels are the fun side of LeBeHo.</p>
        <p>Up to 60 seconds. Outfits, styling, ideas, discoveries, transformations, opinions or simply something worth showing.</p>
        <p>No complicated interactions. Watch. Like. Keep moving.</p>
      </InfoSection>

      <InfoSection title="Three sides. One community.">
        <p>Feed is calm and conversational.</p>
        <p>Rush Hour moves fast.</p>
        <p>Reels are made for discovery and fun.</p>
        <p>What connects all three is fashion—and the people who actually wear it.</p>
        <p>You don't need to be a stylist, designer, model or fashion expert to belong here. You can know exactly what you're doing, have absolutely no idea what to wear, or be somewhere in between.</p>
        <p className="font-editorial text-3xl">LeBeHo. Let’s Be Honest.</p>
      </InfoSection>
    </InfoPage>
  );
}
