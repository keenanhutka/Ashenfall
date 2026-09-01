import { createFileRoute } from "@tanstack/react-router";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Roster } from "@/components/game/Roster";
import { Button } from "@/components/ui/button";
import { captiveHome, crowding, hallCapacity, hallSleepers, hasBuilding, isHand, leftTheLarder, needsLeather, slaveJobLine, slaves, watchEmptyLine } from "@/lib/game/people";
import { escapeLine, escapeWarns, lotIsDone, lotReading, mixedFlavor, namePairReady } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/household/")({
  component: HouseholdPage,
});

function HouseholdPage() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const saewyn = game.people.find((p) => p.id === "saewyn" && p.alive);
  const held = slaves(game);
  const cap = hallCapacity(game);
  const n = hallSleepers(game).length;
  const extra = crowding(game);
  const home = captiveHome(game);
  const restless = game.people.filter((p) => p.alive && isHand(p.id) && p.loyalty <= 3 && p.status === "free");
  const osric = game.people.find((p) => p.id === "osric" && p.alive);
  const nameReady = namePairReady(game);
  const reading = lotReading(game);
  const flavor = mixedFlavor(game);

  return (
    <PlaceFrame
      kicker="The free and the held"
      title="Household"
      lead={`Morning work has no AP cost. Night watch is an assignment — that person is tired tomorrow, ${watchEmptyLine(game)}. Hunt the near trails for hide. Aldred will take a spear without you, if you name it. Finished lots take Smoke, Craft, or Hearth at dusk. Bunks knit a wound. Open a face to see the sheet.`}
    >
      <p className="text-sm text-muted">
        Roof holds {cap} well. {n} under it now
        {held.length ? ` · ${held.length} held` : ""}.
        {extra > 0 ? " The press will sour them." : ""}
      </p>
      {held.length && home !== "hall" && extra === 0 ? (
        <p className="text-sm text-muted">
          {home === "cage"
            ? "They sleep the bars. The roof is not too small of them."
            : "They sleep the first store. The roof is not too small of them."}
        </p>
      ) : null}
      {reading === "mixed" ? (
        <p className="text-sm text-muted">
          {game.settlersAsk
            ? flavor === "both"
              ? "They see a fire and pallets, then bars. Dunstan looks twice."
              : flavor === "beds"
                ? "They see pallets, then a proper cage. Dunstan will stay."
                : "Dunstan looks at the fire, then the bars. He will step off anyway."
            : game.settlersLanded && game.people.some((p) => p.alive && p.id === "dunstan")
              ? flavor === "fire"
                ? "Dunstan took the plank. He sleeps on the hall-floor, in sight of the bars."
                : "Dunstan took a pallet. The cage is in the ring."
              : flavor === "beds"
                ? leftTheLarder(game)
                  ? "Pallets and a proper cage. The larder is empty of them."
                  : "Pallets and a proper cage."
                : flavor === "both"
                  ? "Fire, pallets, and bars. The ring reads as both."
                  : "Fire and bars. The ring reads as both."}
        </p>
      ) : hasBuilding(game, "thrallhut") && !hasBuilding(game, "bunkhouse") ? (
        <p className="text-sm text-muted">
          {game.settlersAsk
            ? "Dunstan looks at the cage. He will not leave the boat."
            : game.settlersLanded && !game.people.some((p) => p.alive && p.id === "dunstan")
              ? "Dunstan took the plank. He would not sleep in sight of the bars."
              : "The cage stands before the fire. The free saw it first."}
        </p>
      ) : hasBuilding(game, "hearthhouse") && !hasBuilding(game, "bunkhouse") ? (
        <p className="text-sm text-muted">
          {game.settlersAsk
            ? "Dunstan will take the floor. Eadric still wants men housed."
            : game.settlersLanded && game.people.some((p) => p.alive && p.id === "dunstan")
              ? "Dunstan took the plank. He sleeps on the hall-floor."
              : "Fire and meal are away from sleep. Men still take the hall-floor."}
        </p>
      ) : hasBuilding(game, "bunkhouse") && !hasBuilding(game, "hearthhouse") && !hasBuilding(game, "thrallhut") ? (
        <p className="text-sm text-muted">
          {game.settlersAsk
            ? "They see pallets through the gate. Dunstan will stay."
            : game.settlersLanded
              ? "They took pallets. The hall is for talk."
              : "Beds first. Meal and fire are still in the sleeping-room."}
        </p>
      ) : null}
      {held.length && hasBuilding(game, "bunkhouse") && !hasBuilding(game, "thrallhut") && game.hut ? (
        <p className="text-sm text-muted">A thrall in a larder, beside free bunks. The new hands see it.</p>
      ) : null}
      {game.pair2Ask ? (
        <p className="text-sm text-muted">Two lots wait. Name the next pair, or leave them unnamed.</p>
      ) : nameReady === "next" ? (
        <p className="text-sm text-muted">Two lots wait. Name them when you know.</p>
      ) : nameReady === "first" ? (
        <p className="text-sm text-muted">Two lots wait. Name them when you know.</p>
      ) : null}
      {nameReady ? (
        <Button onClick={() => dispatch({ type: "askName" })}>
          {nameReady === "next" ? "Name the next pair" : "Name the first pair"}
        </Button>
      ) : null}
      {game.workshop && game.lots.some((l) => l.building && !lotIsDone(l)) ? (
        <p className="text-sm text-muted">The bench is up. Later work goes faster.</p>
      ) : game.workshop && game.pair2Ask ? (
        <p className="text-sm text-muted">The bench is up. Later lots will rise faster.</p>
      ) : null}
      {game.aldredWaiting ? (
        <p className="text-sm text-muted">
          Aldred would not sleep on this floor. A wall — or bunks — would hold him.
        </p>
      ) : game.people.some((p) => p.alive && p.id === "aldred" && p.job === "explore") ? (
        <p className="text-sm text-muted">Aldred took a spear at dawn. Dusk will have him back.</p>
      ) : game.people.some((p) => p.alive && p.id === "aldred") && game.exploreOpen ? (
        <p className="text-sm text-muted">Aldred will take a spear without you, if you name it.</p>
      ) : null}
      {game.huntSign ? (
        <p className="text-sm text-danger">Orc-prints on the game-side. Name a watch.</p>
      ) : null}
      {game.elfSign ? (
        <p className="text-sm text-danger">Marks on the old timber. Name a watch.</p>
      ) : null}
      {game.dwarfSign ? (
        <p className="text-sm text-danger">Stone-watchers at the tree-line. Name a watch.</p>
      ) : null}
      {game.trollSign ? (
        <p className="text-sm text-danger">The stink is on the water. Name a watch.</p>
      ) : null}
      {held.length && escapeLine(game) ? (
        <p className={escapeWarns(game) ? "text-sm text-danger" : "text-sm text-muted"}>{escapeLine(game)}</p>
      ) : null}
      {restless.length ? (
        <p className="text-sm text-danger">
          {restless.map((p) => p.name).join(", ")} {restless.length === 1 ? "looks" : "look"} at the door.
        </p>
      ) : null}
      {held.length && home === "hall" ? (
        <p className="text-sm text-danger">
          {game.hutAsk
            ? "A prisoner among the free. Dawn will name a bar."
            : "A prisoner among the free."}
        </p>
      ) : null}
      {held.length ? (
        <p className="text-sm text-muted">
          No language. Carry, wood, water, dirty hall. Fish only with a guard.{" "}
          {held.map((p) => slaveJobLine(p, game)).join(" ")}
        </p>
      ) : null}
      {held.length && needsLeather(game) ? (
        <p className="text-sm text-muted">
          {osric
            ? home === "cage"
              ? "Osric or you. Hide and a day. Leather goes to the bars."
              : home === "hut"
                ? "Osric or you. Hide and a day. Leather goes to the first store."
                : "Osric or you. Hide and a day. Wulfric's hands will not sit the leather."
            : "Osric is gone. Your hands, or none."}
        </p>
      ) : null}
      {game.escaped ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/40 bg-surface px-4 py-3">
          <p className="text-sm text-danger">
            {game.escaped.name} ran. Hunt is a 3 AP walk, not certain. They may turn and fight.
          </p>
          <Button
            variant="danger"
            disabled={game.ap < 3 || Boolean(game.choices)}
            onClick={() => dispatch({ type: "hunt" })}
          >
            Hunt
          </Button>
        </div>
      ) : null}
      {saewyn ? (
        <p className="text-sm text-muted">
          Saewyn lodges. A buyer, not a hand.
          {!game.saewynTalk && game.saewynDays > 0 ? " Speak with her before she takes the weather." : ""}
          {game.saewynBought ? " She has stock for the home market." : held.length ? (home === "cage" ? " She will price them from the bars." : home === "hut" ? " She will price them from the first store." : " She will look at stock.") : ""}
          {game.saewynWarm ? " Eadric is sour at the buyer." : ""}
          {game.saewynDays === 1 && game.saewynTalk ? " She sails in the morning. A word, if you mean it." : ""}
        </p>
      ) : null}
      {saewyn && game.saewynDays > 0 && (!game.saewynTalk || (held.length > 0 && !game.saewynBought)) ? (
        <div className="flex flex-wrap gap-2">
          {!game.saewynTalk ? (
            <Button
              variant="secondary"
              disabled={Boolean(game.choices)}
              onClick={() => dispatch({ type: "saewyn", id: "saewyn_talk" })}
            >
              Talk with Saewyn
            </Button>
          ) : null}
          {held.length && !game.saewynBought ? (
            <Button
              variant="secondary"
              disabled={Boolean(game.choices)}
              onClick={() => dispatch({ type: "saewyn", id: "saewyn_stock" })}
            >
              Show her the stock
            </Button>
          ) : null}
        </div>
      ) : null}
      <Roster
        state={game}
        onJob={(id, job) => dispatch({ type: "setJob", id, job })}
        onWatch={(id) => dispatch({ type: "setWatch", id })}
      />
    </PlaceFrame>
  );
}
