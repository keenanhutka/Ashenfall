import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonCard } from "@/components/game/PersonCard";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { LOT_BUILDINGS, escapeLine, lotIsDone, namePairReady } from "@/lib/game/engine";
import { captiveSlots, freeFolk, hasBuilding, lotBuildingsOpen, slaves } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";
import { isLotId } from "@/lib/game/types";
import type { LotBuildingId } from "@/lib/game/types";

export const Route = createFileRoute("/estate/lot/$lotId")({
  component: LotPage,
});

const COPY: Record<
  LotBuildingId,
  { kicker: string; title: string; lead: string }
> = {
  store: {
    kicker: "Dry timber",
    title: "The store",
    lead: "Meal off the sleeping-floor. Flour and fish belong here.",
  },
  smokehouse: {
    kicker: "Racks and fire",
    title: "The smokehouse",
    lead: "Fish and meat keep if you feed the smoke.",
  },
  thrallhut: {
    kicker: "Barred timber",
    title: "The cage",
    lead: "The cage is proper. The free look at it and know your mind.",
  },
  bunkhouse: {
    kicker: "Four pallets",
    title: "The bunk-house",
    lead: "Hangers leave the hall. Sleep knits a wound.",
  },
  workshop: {
    kicker: "Bench and iron",
    title: "The workshop",
    lead: "Later work goes faster. Nails from a bar. An edge that bites wood.",
  },
  hearthhouse: {
    kicker: "Fire apart",
    title: "The hearth-house",
    lead: "A fire away from sleep. Tend it and the house wastes less.",
  },
};

function LotPage() {
  const { lotId } = Route.useParams();
  const id = isLotId(lotId) ? lotId : null;
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const canAct = game.ap >= 1 && !game.choices && !game.partyRoute;
  const lot = game.lots.find((l) => l.id === id);

  if (!id || !lot || !game.palisade) {
    return (
      <PlaceFrame kicker="The ring" title="No lot here">
        <Button asChild>
          <Link to="/estate">Back to the map</Link>
        </Button>
      </PlaceFrame>
    );
  }

  const spec = LOT_BUILDINGS.find((b) => b.id === lot.building);
  const done = lotIsDone(lot);
  const copy = spec && done ? COPY[spec.id] : null;

  if (!lot.building) {
    const nameReady = namePairReady(game);
    return (
      <PlaceFrame
        kicker={`Lot ${id}`}
        title="Empty ground"
        lead="Stakes wait. Name the pair, or name the ground yourself."
      >
        {nameReady ? (
          <Button onClick={() => dispatch({ type: "askName" })}>
            {nameReady === "next" ? "Name the next pair" : "Name the first pair"}
          </Button>
        ) : null}
        <div className="flex flex-col gap-2">
          {LOT_BUILDINGS.filter((b) => lotBuildingsOpen(game).includes(b.id)).map((b) => (
            <Button key={b.id} variant="secondary" onClick={() => dispatch({ type: "startLot", lotId: id, building: b.id })}>
              {b.name} · wood {b.wood} / labor {b.labor}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted">
          {game.lots.some((l) => l.id === "c")
            ? "Second pair: house, hands, or hold — or name the ground yourself."
            : "First pair: hearth and store, bunks and workshop, or a proper hut and store."}
        </p>
      </PlaceFrame>
    );
  }

  if (!done && spec) {
    return (
      <PlaceFrame
        kicker={`Lot ${id}`}
        title={spec.name}
        lead={`${spec.note} Frame rising. Wood ${spec.wood} on the first labor.`}
      >
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          <Stat label="Labor" value={`${lot.prog}/${spec.labor}`} />
          <Stat label="Wood" value={game.wood} />
          <Stat label="Nails" value={game.nails} />
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canAct} onClick={() => dispatch({ type: "workLot", lotId: id })}>
            Set timber · 1 AP
          </Button>
          <Button asChild variant="secondary">
            <Link to="/estate/household">Assign Lot</Link>
          </Button>
        </div>
        {game.workshop ? <p className="text-sm text-muted">The workshop counts your hands double.</p> : null}
        <p className="text-sm text-muted">Assign Lot at dusk. Extra labor goes to the next frame. Hands stop when it stands.</p>
      </PlaceFrame>
    );
  }

  if (!copy || !spec) {
    return (
      <PlaceFrame kicker={`Lot ${id}`} title="The lot">
        <Button asChild>
          <Link to="/estate">Back to the map</Link>
        </Button>
      </PlaceFrame>
    );
  }

  const held = slaves(game);
  const slots = captiveSlots(game);
  const sleepers = freeFolk(game);

  return (
    <PlaceFrame kicker={copy.kicker} title={copy.title} lead={copy.lead}>
      {spec.id === "store" ? (
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          <Stat label="Meal" value={game.food} />
          <Stat label="Smoked" value={game.smoked} />
          <Stat label="Wood" value={game.wood} />
          <Stat label="Hide" value={game.hide} />
          <Stat label="Iron" value={game.iron} />
          <Stat label="Nails" value={game.nails} />
        </dl>
      ) : null}

      {spec.id === "smokehouse" ? (
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          <Stat label="Smoked" value={game.smoked} />
          <Stat label="Meal" value={game.food} />
          <Stat label="Wood" value={game.wood} />
        </dl>
      ) : null}

      {spec.id === "workshop" ? (
        <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
          <Stat label="Iron" value={game.iron} />
          <Stat label="Nails" value={game.nails} />
          <Stat label="Edge" value={game.toolsDays > 0 ? `${game.toolsDays}d` : "dull"} />
        </dl>
      ) : null}

      {spec.id === "hearthhouse" && game.hearthTended ? (
        <p className="text-sm text-muted">The fire is fed. Meal will waste less tonight.</p>
      ) : null}

      {spec.id === "thrallhut" ? (
        <section className="rounded-md border border-danger/40 bg-surface p-4">
          <p className="text-sm text-muted">
            {held.length}/{slots} held. Collar and cuffs are hide, not a watch.
            {game.hut ? " They left the first store." : ""}
            {held.length && escapeLine(game) ? ` ${escapeLine(game)}` : ""}
          </p>
          {held.length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {held.map((p) => (
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
            <p className="mt-3 text-sm text-muted">Empty. The bars are for the next one.</p>
          )}
        </section>
      ) : null}

      {spec.id === "bunkhouse" ? (
        <section className="rounded-md border border-border bg-surface p-4">
          <p className="text-sm text-muted">
            {hasBuilding(game, "hearthhouse")
              ? "Free pallets. The hall is for fire and talk."
              : "Free pallets. Meal and fire are still in the sleeping-room."}
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {sleepers.slice(0, 6).map((p) => (
              <li key={p.id}>
                <PersonCard person={p} kicker="sleeps here" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: "lotAct", lotId: id, act: "inspect" })}>
          Look around
        </Button>
        {spec.id === "smokehouse" ? (
          <Button disabled={!canAct || game.wood < 1 || game.food < 1} onClick={() => dispatch({ type: "lotAct", lotId: id, act: "smoke" })}>
            Tend the smoke · 1 wood
          </Button>
        ) : null}
        {spec.id === "workshop" ? (
          <>
            <Button disabled={!canAct || game.iron < 1} onClick={() => dispatch({ type: "lotAct", lotId: id, act: "nails" })}>
              Cut nails · 1 iron
            </Button>
            <Button disabled={!canAct || game.iron < 1 || game.toolsDays > 3} onClick={() => dispatch({ type: "lotAct", lotId: id, act: "tools" })}>
              Sharpen tools · 1 iron
            </Button>
          </>
        ) : null}
        {spec.id === "hearthhouse" ? (
          <>
            <Button disabled={!canAct || game.wood < 1} onClick={() => dispatch({ type: "lotAct", lotId: id, act: "hearth" })}>
              Tend the fire · 1 wood
            </Button>
            <Button variant="secondary" onClick={() => dispatch({ type: "lotAct", lotId: id, act: "rest" })}>
              Sit the fire
            </Button>
          </>
        ) : null}
        {spec.id === "bunkhouse" ? (
          <Button variant="secondary" onClick={() => dispatch({ type: "lotAct", lotId: id, act: "rest" })}>
            Take a pallet
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link to="/estate">The map</Link>
        </Button>
      </div>
      {spec.id === "smokehouse" ? (
        <p className="text-sm text-muted">Assign Smoke at dusk. One load of wood hangs a day's catch.</p>
      ) : null}
      {spec.id === "workshop" ? (
        <p className="text-sm text-muted">Assign Craft at dusk. Iron becomes nails, or an edge that lasts.</p>
      ) : null}
      {spec.id === "hearthhouse" ? (
        <p className="text-sm text-muted">Assign Hearth at dusk. The hall fire lives here now.</p>
      ) : null}
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
