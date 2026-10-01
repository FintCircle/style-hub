import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImagePlus, Timer, X } from "lucide-react";
import { BottomNav } from "@/components/lebeho/BottomNav";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create — LeBeHo" },
      {
        name: "description",
        content: "Post a look, start a fashion conversation, add a vote, or go Rush Hour.",
      },
      { property: "og:title", content: "Create — LeBeHo" },
      {
        property: "og:description",
        content: "Text, photos, votes and Rush Hour countdowns — or a 60-second reel.",
      },
    ],
  }),
  component: Create;
});

function Create() {
  return null;
}
