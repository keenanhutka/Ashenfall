import { createFileRoute } from "@tanstack/react-router";
import { EstateMap } from "@/components/game/EstateMap";
import { Button } from "@/components/ui/button";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/estate/")({
  component: EstateHub,
});

function EstateHub() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const last = game.log[game.log.length - 1];

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-3 p-3 md:p-4">
      <EstateMap state={game} />
      {game.choices && game.choices.length > 0 ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3">
          <p
            className={cn(
              "min-w-0 flex-1 text-sm",
              last?.kind === "warn" && "text-danger",
              last?.kind === "ok" && "text-ok",
            )}
          >
            {last?.text ?? "The yard is quiet."}
          </p>
          <div className="flex flex-wrap gap-2">
            {game.escaped ? (
              <Button
                variant="danger"
                disabled={game.ap < 3 || Boolean(game.choices)}
                onClick={() => dispatch({ type: "hunt" })}
              >
                Hunt {game.escaped.name}
              </Button>
            ) : null}
            <Button
              onClick={() => dispatch({ type: "endDay" })}
              disabled={Boolean(game.choices || game.partyRoute)}
            >
              End the day
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
