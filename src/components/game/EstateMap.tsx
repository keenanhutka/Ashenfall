import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { LOT_PIN, escapeLine, escapeWarns, lotIsDone, lotReading, mixedFlavor, namePairReady, wallReady } from "@/lib/game/engine";
import { crowding, hasBuilding, isHand, mapSleepLine, needSecondStore, shedPinLabel } from "@/lib/game/people";
import type { GameState, Lot, LotId } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type PinTo =
  | "/estate/hall"
  | "/estate/dock"
  | "/estate/yard"
  | "/estate/hut"
  | "/estate/wall"
  | "/estate/explore/$routeId"
  | "/estate/lot/$lotId";

function Pin({
  label,
  left,
  top,
  locked,
  to,
  params,
  tone = "default",
}: {
  label: string;
  left: string;
  top: string;
  locked?: boolean;
  to: PinTo;
  params?: { routeId: string } | { lotId: string };
  tone?: "default" | "water" | "warn";
}) {
  return (
    <Link
      to={to}
      params={params}
      style={{ left, top }}
      className={cn(
        "absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-sm border px-2.5 py-1.5 shadow-md",
        "backdrop-blur-[2px] transition-colors duration-150",
        tone === "water" && "border-sea bg-sea/85 text-fg",
        tone === "warn" && "border-danger/50 bg-raised/90 text-fg",
        tone === "default" && "border-border bg-surface/90 text-fg",
        locked && "opacity-80",
      )}
    >
      <span className="font-display text-sm font-semibold tracking-wide">{label}</span>
      {locked ? <Lock className="size-3.5 text-muted" aria-hidden /> : null}
    </Link>
  );
}

function lotLabel(lot: Lot): string {
  if (!lot.building) return `Lot ${lot.id.toUpperCase()}`;
  return LOT_PIN[lot.building];
}

const LOT_POS: Record<LotId, { left: string; top: string }> = {
  a: { left: "42%", top: "34%" },
  b: { left: "58%", top: "40%" },
  c: { left: "32%", top: "38%" },
  d: { left: "68%", top: "46%" },
};

export function EstateMap({ state }: { state: GameState }) {
  const second = state.hut;
  const doneLots = state.lots.filter((l) => lotIsDone(l)).length;
  const sleep = mapSleepLine(state);

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-sea">
      <img
        src={state.palisade ? "/maps/wave1.jpg" : "/maps/wave0.jpg"}
        alt={
          state.palisade
            ? "Palisaded coastal hall with dock, houses, and empty lots"
            : "Coastal hall and dock on a rocky pine shore"
        }
        className="block h-auto w-full select-none"
        draggable={false}
      />

      <Pin left="48%" top="44%" label="Hall" to="/estate/hall" />
      <Pin left="31%" top="58%" label="Dock" tone={state.nightSign || state.trollSign ? "warn" : "water"} to="/estate/dock" />
      <Pin
        left="56%"
        top="52%"
        label={shedPinLabel(state)}
        tone={state.hut && !hasBuilding(state, "thrallhut") ? "warn" : "default"}
        locked={state.sheds === 0}
        to={state.hut ? "/estate/hut" : "/estate/yard"}
      />
      {second ? (
        <Pin
          left="40%"
          top="49%"
          label={state.sheds >= 2 ? "Store" : "Raise store"}
          locked={false}
          to="/estate/yard"
        />
      ) : null}
      {state.palisade ? (
        <Pin
          left="62%"
          top="36%"
          label={state.watchPost ? "Post" : "Gate"}
          to="/estate/wall"
          tone={(state.nightSign || state.huntSign || state.elfSign || state.dwarfSign || state.trollSign) && state.watchPost ? "warn" : "default"}
        />
      ) : wallReady(state) ? (
        <Pin left="58%" top="38%" label="Wall" to="/estate/wall" />
      ) : null}

      {state.palisade
        ? state.lots.map((lot) => (
            <Pin
              key={lot.id}
              left={LOT_POS[lot.id].left}
              top={LOT_POS[lot.id].top}
              label={lotLabel(lot)}
              tone={lot.building === "thrallhut" && lotIsDone(lot) ? "warn" : "default"}
              to="/estate/lot/$lotId"
              params={{ lotId: lot.id }}
            />
          ))
        : null}

      <Pin
        left="80%"
        top="16%"
        label="Timber"
        locked={!state.exploreOpen}
        to="/estate/explore/$routeId"
        params={{ routeId: "timber" }}
        tone={state.elfSign || state.elfGrudge >= 1 ? "warn" : "default"}
      />
      <Pin
        left="82%"
        top="82%"
        label="Trails"
        locked={!state.exploreOpen}
        to="/estate/explore/$routeId"
        params={{ routeId: "trails" }}
        tone={state.huntSign ? "warn" : "default"}
      />
      <Pin
        left="12%"
        top="26%"
        label="Coast"
        locked={!state.exploreOpen}
        to="/estate/explore/$routeId"
        params={{ routeId: "coast" }}
      />
      <Pin
        left="44%"
        top="90%"
        label="Stream"
        locked={!state.exploreOpen}
        to="/estate/explore/$routeId"
        params={{ routeId: "stream" }}
        tone={state.trollSign || state.trollHits >= 1 ? "warn" : "default"}
      />
      <Pin
        left="90%"
        top="46%"
        label="Fold"
        locked={!state.exploreOpen}
        to="/estate/explore/$routeId"
        params={{ routeId: "fold" }}
        tone={state.dwarfSign || state.dwarfGrudge >= 1 ? "warn" : "default"}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-bg/70 to-transparent px-3 py-2">
        <p className="font-display text-lg leading-tight text-fg">House {state.house}</p>
        <p className="text-xs text-muted">
          {state.nightSign
            ? "Prints at the water-gate. Watch tonight."
            : state.trollSign
              ? "The stink has come down the water. Watch the dock tonight."
            : state.huntSign
              ? "Prints on the game-trail. Watch tonight."
            : state.elfSign
              ? "Marks on the old timber. Watch tonight."
            : state.dwarfSign
              ? "Stone-watchers at the tree-line. Watch tonight."
            : escapeWarns(state)
              ? (escapeLine(state) ?? "They will try the yard.")
            : state.people.some((p) => p.alive && isHand(p.id) && p.loyalty <= 2)
              ? "A pack is on the floor."
              : state.aldredWaiting
                ? "Aldred waits on a wall, or a pallet."
              : crowding(state) > 0
                ? "The roof is too small."
            : sleep
              ? sleep
            : state.settlersAsk
              ? "A worn sail at the water-gate. Not Oswin's."
            : state.people.some((p) => p.alive && p.id === "aldred" && p.job === "explore")
              ? "Aldred took a spear. Dusk will have him back."
            : state.people.some((p) => p.alive && p.id === "saewyn") && !state.saewynTalk
              ? "A buyer under the roof. Speak with her."
            : state.people.some((p) => p.alive && p.id === "saewyn") && state.saewynDays === 1 && state.saewynTalk
              ? "Saewyn's cloth is packed."
            : state.settlersLanded &&
                state.people.some((p) => p.alive && (p.id === "leofric" || p.id === "aethel" || p.id === "dunstan"))
              ? "New mouths under the roof."
            : state.settlersLanded
              ? "A worn sail left. Word goes elsewhere."
            : state.people.some((p) => p.alive && p.id === "saewyn")
              ? "A buyer under the roof. She will not winter."
            : state.palisade
            ? state.pair2Ask
              ? "Two more lots wait. Name the next pair."
            : state.pairAsk
              ? "Two lots wait. Name the first pair."
            : namePairReady(state)
              ? "Two lots wait. Name them when you know."
            : doneLots >= 4
              ? lotReading(state) === "mixed"
                ? mixedFlavor(state) === "beds"
                  ? "The four lots are mixed. Pallets and bars."
                  : mixedFlavor(state) === "both"
                    ? "The four lots are mixed. Fire, pallets, and bars."
                    : "The four lots are mixed. Fire and bars."
                : "The four lots are named."
            : doneLots >= 2 && state.lots.length >= 4
              ? "The ring has more ground."
            : doneLots >= 2
              ? "The two lots are named."
              : doneLots === 1
                ? "One lot stands. One waits."
                : "The yard is closed. Two lots wait."
            : needSecondStore(state)
              ? "The first store is a hut. Raise another."
              : state.exploreOpen
                ? "The five ways are open."
                : "Raise a store-shed before ranging far."}
        </p>
      </div>
    </div>
  );
}
