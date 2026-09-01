import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonCard } from "@/components/game/PersonCard";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { LOT_BUILDINGS, BUILD_NEED, escapeLine, lotIsDone, lotReading, mixedFlavor, namePairReady } from "@/lib/game/engine";
import { captiveSlots, hasBuilding, leftTheLarder, lotBuildingsOpen, needSecondStore, slaveJobLine, slaves, yardFourLotsLine, yardSleepLine } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";
import type { LotBuildingId, LotId } from "@/lib/game/types";

export const Route = createFileRoute("/estate/yard")({
  component: YardPage,
});

function YardPage() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const canAct = game.ap >= 1 && !game.choices && !game.partyRoute;
  const held = slaves(game);
  const slots = captiveSlots(game);
  const second = needSecondStore(game);
  const nameReady = namePairReady(game);
  const cageLine = yardSleepLine(game);

  return (
    <PlaceFrame
      kicker="Beside the hall"
      title={game.hut ? "Yard" : game.sheds > 0 ? "The store-shed" : "The yard"}
      lead={
        game.sheds === 0
          ? "Stakes in the mud. Assign two hands to Store and end the day, or spend your own AP on timber."
          : second
            ? "The first store is a barred hut. Meal is back underfoot until a second store stands."
            : leftTheLarder(game)
              ? "The first store is a larder again. Flour and fish have a dry roof."
              : game.hut
                ? "Hut and store both stand. Flour and fish have a dry roof again."
                : "Dry enough. Flour and fish belong here, not underfoot."
      }
    >
      {game.hut ? (
        <section className="rounded-md border border-danger/40 bg-surface p-4">
          <h2 className="font-display text-xl">Thrall-hut</h2>
          {hasBuilding(game, "thrallhut") ? (
            <>
              <p className="mt-1 text-sm text-muted">
                The first store. Empty of them. They sleep under the proper bars.
              </p>
              <Button asChild className="mt-3" variant="secondary">
                <Link to="/estate/hut">Enter the larder</Link>
              </Button>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">
                The first store, barred. {held.length}/{slots} held.
                {held.length && escapeLine(game) ? ` ${escapeLine(game)}` : ""}
                {held.length ? ` ${held.map((p) => slaveJobLine(p, game)).join(" ")}` : ""}
              </p>
              {held.length ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {held.map((p) => (
                    <li key={p.id}>
                      <PersonCard person={p} kicker={`${p.collar ? "collared" : "loose"}${p.cuffs ? " · cuffed" : ""}`} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted">Empty. The bar is for the next one.</p>
              )}
            </>
          )}
        </section>
      ) : cageLine ? (
        <p className="text-sm text-muted">{cageLine}</p>
      ) : held.length ? (
        <>
          {game.sheds > 0 ? (
            <p className="text-sm text-danger">
              {game.hutAsk
                ? "Dawn will have to name it. They sleep among the free tonight."
                : "A prisoner among the free. The stores still have a roof."}
            </p>
          ) : null}
          {escapeLine(game) ? <p className="text-sm text-danger">{escapeLine(game)}</p> : null}
          <p className="text-sm text-muted">{held.map((p) => slaveJobLine(p, game)).join(" ")}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {held.map((p) => (
              <li key={p.id}>
                <PersonCard person={p} kicker={`${p.collar ? "collared" : "loose"}${p.cuffs ? " · cuffed" : ""}`} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted">No one is held here.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "yard" })}>
          Look around
        </Button>
      </div>

      {game.escaped ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-danger/40 bg-surface px-4 py-3">
          <p className="text-sm text-danger">{game.escaped.name} ran for the trees.</p>
          <Button
            variant="danger"
            disabled={game.ap < 3 || Boolean(game.choices)}
            onClick={() => dispatch({ type: "hunt" })}
          >
            Hunt · 3 AP
          </Button>
        </div>
      ) : null}

      <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
        <Stat label="Wood" value={game.wood} />
        <Stat label="Hide" value={game.hide} />
        <Stat label="Iron" value={game.iron} />
        <Stat label="Rope" value={game.rope} />
        <Stat label="Nails" value={game.nails} />
        {game.smoked > 0 ? <Stat label="Smoked" value={game.smoked} /> : null}
        {game.sheds === 0 || second ? <Stat label="Frame" value={`${game.shedProg}/${BUILD_NEED.shed}`} /> : null}
      </dl>

      {second ? (
        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="font-display text-xl">Second store</h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            Wood 2, labor 2. Assign hands to Store, or set timber yourself. A pin is on the map.
          </p>
          <Button disabled={!canAct || game.shedProg >= BUILD_NEED.shed} onClick={() => dispatch({ type: "work", kind: "shed" })}>
            Raise the second store
          </Button>
          {game.shedProg >= BUILD_NEED.shed ? (
            <p className="mt-3 text-sm text-muted">The frame is enough. Dusk will raise it if the wood is there.</p>
          ) : null}
        </section>
      ) : (
        <div className="flex flex-wrap gap-2">
          {game.sheds === 0 ? (
            <Button disabled={!canAct || game.shedProg >= BUILD_NEED.shed} onClick={() => dispatch({ type: "work", kind: "shed" })}>
              Work the shed
            </Button>
          ) : null}
          {game.sheds === 0 && game.shedProg >= BUILD_NEED.shed ? (
            <p className="w-full text-sm text-muted">The frame is enough. Dusk will raise it if the wood is there.</p>
          ) : null}
          <Button variant="secondary" disabled={!canAct} onClick={() => dispatch({ type: "work", kind: "wood" })}>
            Cut wood
          </Button>
          {game.exploreOpen ? (
            <Button variant="secondary" disabled={!canAct} onClick={() => dispatch({ type: "work", kind: "game" })}>
              Hunt near trails
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link to="/estate/household">Set the watch</Link>
          </Button>
        </div>
      )}

      {second ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!canAct} onClick={() => dispatch({ type: "work", kind: "wood" })}>
            Cut wood
          </Button>
          {game.exploreOpen ? (
            <Button variant="secondary" disabled={!canAct} onClick={() => dispatch({ type: "work", kind: "game" })}>
              Hunt near trails
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link to="/estate/household">Set the watch</Link>
          </Button>
        </div>
      ) : null}

      {(game.palisade || game.hut) ? (
        <section className="rounded-md border border-border bg-surface p-4">
          <h2 className="font-display text-xl">
            {game.palisade
              ? game.lots.every((l) => lotIsDone(l))
                ? "Named lots"
                : game.lots.some((l) => l.id === "c")
                  ? "The ring"
                  : "Empty lots"
              : "Yard buildings"}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            {game.hut && !game.palisade
              ? "The first store is barred. It is not a lot. Meal wants a second roof."
              : game.pair2Ask
              ? "Two more lots. House, hands, or hold — or leave the ground until you know."
              : game.pairAsk
              ? "Two lots. House first, hands first, or hold first. Or leave the ground until you know."
              : nameReady
              ? "The lots wait. Name the pair, or stake the ground yourself."
              : game.lots.every((l) => lotIsDone(l)) && lotReading(game) === "mixed"
                ? `${
                    mixedFlavor(game) === "beds"
                      ? "Four lots in the ring. Pallets and bars."
                      : mixedFlavor(game) === "both"
                        ? "Four lots in the ring. Fire, pallets, and bars."
                        : "Four lots in the ring. Fire and bars."
                  }${leftTheLarder(game) ? " The first store is a larder again." : ""}`
              : game.lots.some((l) => l.id === "c")
                ? yardFourLotsLine(game)
                : "Two houses already stand. The empty lots are pins on the map. Name them here, or walk in."}
          </p>
          {nameReady ? (
            <Button className="mb-4" onClick={() => dispatch({ type: "askName" })}>
              {nameReady === "next" ? "Name the next pair" : "Name the first pair"}
            </Button>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            {game.hut ? (
              <div className={hasBuilding(game, "thrallhut") ? "rounded-sm border border-border bg-raised p-3" : "rounded-sm border border-danger/40 bg-raised p-3"}>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">First shed</p>
                <p className="font-display text-lg">
                  {hasBuilding(game, "thrallhut") ? (
                    <>
                      First store <span className="text-sm text-muted">stands</span>
                    </>
                  ) : (
                    <>
                      Barred store <span className="text-sm text-muted">stands</span>
                    </>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {hasBuilding(game, "thrallhut")
                    ? "Not a lot. Empty of them. A larder."
                    : `Not a lot. Holds ${slaves(game).length}/${captiveSlots(game)}.`}
                </p>
                <Button asChild className="mt-3" variant="default">
                  <Link to="/estate/hut">{hasBuilding(game, "thrallhut") ? "Enter the larder" : "Enter"}</Link>
                </Button>
              </div>
            ) : null}
            {game.palisade
              ? game.lots.map((lot) => (
                  <LotCard
                    key={lot.id}
                    lotId={lot.id}
                    building={lot.building}
                    prog={lot.prog}
                    open={lotBuildingsOpen(game)}
                    onStart={(building) => dispatch({ type: "startLot", lotId: lot.id, building })}
                  />
                ))
              : null}
          </div>
        </section>
      ) : null}
    </PlaceFrame>
  );
}

function LotCard({
  lotId,
  building,
  prog,
  open,
  onStart,
}: {
  lotId: LotId;
  building: LotBuildingId | null;
  prog: number;
  open: LotBuildingId[];
  onStart: (b: LotBuildingId) => void;
}) {
  const spec = LOT_BUILDINGS.find((b) => b.id === building);
  const done = spec ? lotIsDone({ building, prog }) : false;
  return (
    <div className="rounded-sm border border-border bg-raised p-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Lot {lotId}</p>
      {spec ? (
        <>
          <p className="font-display text-lg">
            {spec.name}{" "}
            <span className="text-sm text-muted">{done ? "stands" : `${prog}/${spec.labor}`}</span>
          </p>
          <Button asChild className="mt-3" variant={done ? "default" : "secondary"}>
            <Link to="/estate/lot/$lotId" params={{ lotId }}>
              {done ? "Enter" : "See the lot"}
            </Link>
          </Button>
        </>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {LOT_BUILDINGS.filter((b) => open.includes(b.id)).map((b) => (
            <Button key={b.id} variant="secondary" size="sm" onClick={() => onStart(b.id)}>
              {b.name} · wood {b.wood} / labor {b.labor}
            </Button>
          ))}
          <Button asChild variant="ghost" size="sm">
            <Link to="/estate/lot/$lotId" params={{ lotId }}>
              Open the lot
            </Link>
          </Button>
        </div>
      )}
    </div>
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
