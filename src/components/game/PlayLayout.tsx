import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChoicePanel } from "@/components/game/ChoicePanel";
import { Hud } from "@/components/game/Hud";
import { Button } from "@/components/ui/button";
import { wallReady } from "@/lib/game/engine";
import { hasBuilding } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";

export function PlayLayout() {
  const hydrate = useGame((s) => s.hydrate);
  const hydrated = useGame((s) => s.hydrated);
  const started = useGame((s) => s.started);
  const gameOver = useGame((s) => s.gameOver);
  const endMessage = useGame((s) => s.endMessage);
  const choices = useGame((s) => s.choices);
  const scene = useGame((s) => s.scene);
  const dispatch = useGame((s) => s.dispatch);
  const game = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (hydrated && !started) {
      void navigate({ to: "/" });
    }
  }, [hydrated, started, navigate]);

  if (!hydrated || !started) {
    return <div className="min-h-dvh bg-bg" />;
  }

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <Hud state={game} />
      <nav className="flex flex-wrap gap-1 border-b border-border bg-surface px-3 py-2 md:px-6">
        <NavLink to="/estate" label="Map" />
        <NavLink to="/estate/hall" label="Hall" />
        <NavLink to="/estate/dock" label="Dock" />
        <NavLink to="/estate/yard" label="Yard" />
        {game.hut ? <NavLink to="/estate/hut" label={hasBuilding(game, "thrallhut") ? "Larder" : "Hut"} /> : null}
        {game.palisade || wallReady(game) ? (
          <NavLink to="/estate/wall" label={game.watchPost ? "Post" : "Wall"} />
        ) : null}
        <NavLink to="/estate/household" label="Household" />
        <NavLink to="/estate/chronicle" label="Chronicle" />
      </nav>

      {gameOver ? (
        <div className="mx-auto max-w-xl px-4 py-10 text-center">
          <h2 className="font-display text-3xl text-danger">The hall is ended</h2>
          <p className="mt-3 text-muted">{endMessage}</p>
          <Button
            className="mt-6"
            onClick={() => {
              dispatch({ type: "reset" });
              void navigate({ to: "/" });
            }}
          >
            Begin again
          </Button>
        </div>
      ) : (
        <>
          {choices && choices.length > 0 ? (
            <ChoicePanel
              scene={scene ?? [{ text: "What now?" }]}
              choices={choices}
              people={game.people}
              onChoose={(id) => dispatch({ type: "choose", id })}
            />
          ) : null}
          <Outlet />
        </>
      )}
    </div>
  );
}

function NavLink({
  to,
  label,
}: {
  to: "/estate" | "/estate/hall" | "/estate/dock" | "/estate/yard" | "/estate/hut" | "/estate/wall" | "/estate/household" | "/estate/chronicle";
  label: string;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/estate" }}
      className="rounded-sm px-3 py-2 text-sm text-muted hover:bg-raised hover:text-fg"
      activeProps={{ className: "rounded-sm bg-raised px-3 py-2 text-sm text-fg" }}
    >
      {label}
    </Link>
  );
}
