import { createFileRoute } from "@tanstack/react-router";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Chronicle } from "@/components/game/Chronicle";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/chronicle")({
  component: ChroniclePage,
});

function ChroniclePage() {
  const game = useGame();
  return (
    <PlaceFrame kicker="The telling" title="Chronicle" lead="What was done, and what was seen." hideRecent>
      <div className="min-h-[50vh]">
        <Chronicle state={game} />
      </div>
    </PlaceFrame>
  );
}
