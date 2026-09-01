import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrate = useGame((s) => s.hydrate);
  const hydrated = useGame((s) => s.hydrated);
  const started = useGame((s) => s.started);
  const gameOver = useGame((s) => s.gameOver);
  const dispatch = useGame((s) => s.dispatch);
  const navigate = useNavigate();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <TitleScreen
      hasSave={hydrated && started && !gameOver}
      onStart={(name, house, stats) => {
        dispatch({ type: "start", name, house, stats });
        void navigate({ to: "/estate" });
      }}
      onContinue={() => {
        void navigate({ to: "/estate" });
      }}
    />
  );
}
