import { createFileRoute } from "@tanstack/react-router";
import { PlayLayout } from "@/components/game/PlayLayout";

export const Route = createFileRoute("/estate")({
  component: PlayLayout,
});
