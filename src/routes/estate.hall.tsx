import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonCard } from "@/components/game/PersonCard";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { escapeLine } from "@/lib/game/engine";
import { captiveHome, hallCapacity, hallSleepers, hasBuilding, slaveJobLine, slaves } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/hall")({
  component: HallPage,
});

function HallPage() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const underRoof = hallSleepers(game);
  const held = slaves(game);
  const cap = hallCapacity(game);
  const here = underRoof.length;
  const home = captiveHome(game);

  return (
    <PlaceFrame
      kicker="The house"
      title="The hall"
      lead={`One roof. ${here} sleep here of ${cap} the timber will hold well. Meal is ${game.food}. ${hasBuilding(game, "hearthhouse") ? "The fire lives in the hearth-house now." : "Eadgyth keeps the fire."}${held.length && home === "hall" ? " A prisoner among the free." : held.length && home === "cage" ? " They sleep under the proper bars, not this timber." : held.length && home === "hut" ? " They sleep barred in the first store, not among the free." : ""}${held.length && home === "hall" && game.hutAsk ? " Dawn will name a bar." : ""}${here > cap ? " The press sours the new hands." : ""}${held.length && escapeLine(game) ? ` ${escapeLine(game)}` : ""}${underRoof.some((p) => p.id === "saewyn") ? " Saewyn lodges. A buyer, not a hand." : ""}${game.huntHits >= 1 ? " Hunters have tried this timber." : ""}${game.elfGrudge >= 1 ? " The wood remembers this hall." : ""}${game.dwarfGrudge >= 1 ? " The fold knows this roof." : ""}${game.trollHits >= 1 ? " The stream has tried this roof." : ""}${game.raidHits >= 2 ? " The last raid tried this door." : ""}`}
    >
      {held.some((p) => p.job === "hall") ? (
        <p className="text-sm text-muted">
          {held.filter((p) => p.job === "hall").map((p) => slaveJobLine(p, game)).join(" ")}
        </p>
      ) : null}
      <ul className="grid gap-2 sm:grid-cols-2">
        {underRoof.map((p) => (
          <li key={p.id}>
            <PersonCard person={p} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "hall" })}>
          Look around
        </Button>
        <Button asChild variant="secondary">
          <Link to="/estate/household">Assign the household</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/estate/yard">See the yard</Link>
        </Button>
      </div>
    </PlaceFrame>
  );
}