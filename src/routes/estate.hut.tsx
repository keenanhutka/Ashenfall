import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonCard } from "@/components/game/PersonCard";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { escapeLine, watchName } from "@/lib/game/engine";
import { captiveSlots, hasBuilding, slaveJobLine, slaves } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/hut")({
  component: HutPage,
});

function HutPage() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const canAct = game.ap >= 1 && !game.choices && !game.partyRoute;
  const held = slaves(game);
  const slots = captiveSlots(game);
  const proper = hasBuilding(game, "thrallhut");
  const here = proper ? [] : held;
  const cageLot = game.lots.find((l) => l.building === "thrallhut");

  if (!game.hut) {
    return (
      <PlaceFrame
        kicker="First shed"
        title="No bar here"
        lead="The first store still holds meal. A bar waits on a captive and a choice."
      >
        <Button asChild>
          <Link to="/estate/yard">Back to the yard</Link>
        </Button>
      </PlaceFrame>
    );
  }

  return (
    <PlaceFrame
      kicker="First shed"
      title={proper ? "The first store" : "The barred store"}
      lead={
        proper
          ? "The first store. They left the larder. The proper cage stands in the ring."
          : "The first store, barred. Not a lot. Holds two at a crush. A proper cage would hold better."
      }
    >
      {proper ? (
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          <Stat label="Meal" value={game.food} />
          <Stat label="Smoked" value={game.smoked} />
          <Stat label="Wood" value={game.wood} />
          <Stat label="Hide" value={game.hide} />
          <Stat label="Iron" value={game.iron} />
          <Stat label="Nails" value={game.nails} />
        </dl>
      ) : null}

      <p className="text-sm text-muted">
        {here.length
          ? `${here.length}/${slots} held. Watch is ${watchName(game)}.${escapeLine(game) ? ` ${escapeLine(game)}` : ""} ${here.map((p) => slaveJobLine(p, game)).join(" ")}`
          : proper
            ? `Empty of them. They sleep under the proper bars. Watch is ${watchName(game)}.`
            : `Empty. Watch is ${watchName(game)}. The bar is for the next one.`}
      </p>

      {here.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {here.map((p) => (
            <li key={p.id} className="flex flex-col gap-2">
              <PersonCard person={p} kicker={`${p.collar ? "collared" : "loose"}${p.cuffs ? " · cuffed" : ""}`} />
              <div className="flex flex-wrap gap-2">
                {!p.collar ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canAct || game.hide < 1}
                    onClick={() => dispatch({ type: "restrain", id: p.id, kind: "collar" })}
                  >
                    Collar · 1 hide
                  </Button>
                ) : null}
                {!p.cuffs ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canAct || game.hide < 1}
                    onClick={() => dispatch({ type: "restrain", id: p.id, kind: "cuffs" })}
                  >
                    Cuffs · 1 hide
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted">
          {proper
            ? "The larder is a store again. Assign Guard cage if you still want a door-man on the bars."
            : "Empty. Assign Guard hut at dawn if you mean to keep a door-man. Night watch is named on Household."}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "shed" })}>
          Look around
        </Button>
        {proper && cageLot ? (
          <Button asChild variant="secondary">
            <Link to="/estate/lot/$lotId" params={{ lotId: cageLot.id }}>
              The proper cage
            </Link>
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link to="/estate/household">Set the watch</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/estate/yard">Yard</Link>
        </Button>
      </div>
    </PlaceFrame>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="font-display text-2xl tabular-nums">{value}</dd>
    </div>
  );
}
