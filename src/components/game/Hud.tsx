import { Link } from "@tanstack/react-router";
import { mouths } from "@/lib/game/engine";
import { slaves } from "@/lib/game/people";
import type { GameState } from "@/lib/game/types";

function Chip({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="flex min-w-16 flex-col rounded-sm border border-border bg-raised px-2.5 py-1.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className={`font-display text-lg tabular-nums leading-tight ${warn ? "text-danger" : "text-fg"}`}>
        {value}
      </span>
    </div>
  );
}

export function Hud({ state }: { state: GameState }) {
  const held = slaves(state).length;
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border bg-surface px-4 py-3 md:px-6">
      <div>
        <Link
          to="/estate"
          className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted hover:text-fg"
        >
          Ashenfall
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-fg md:text-3xl">
          {state.name} of {state.house}
        </h1>
      </div>
      <div className="flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-0.5">
        <Chip label="Day" value={state.day} />
        <Chip label="AP" value={`${state.ap}${state.tired ? " tired" : ""}`} warn={state.ap === 0} />
        {(() => {
          const you = state.people.find((p) => p.id === "player");
          if (!you || you.hurt < 1) return null;
          return <Chip label="Hurt" value={you.hurt > 3 ? "bad" : `${you.hurt}d`} warn />;
        })()}
        <Chip label="Food" value={state.food} warn={state.food + state.smoked <= mouths(state)} />
        {state.smoked > 0 ? <Chip label="Smoked" value={state.smoked} /> : null}
        <Chip label="Wood" value={state.wood} />
        {state.hide > 0 || state.exploreOpen ? <Chip label="Hide" value={state.hide} /> : null}
        {state.iron > 0 || state.workshop ? <Chip label="Iron" value={state.iron} /> : null}
        <Chip label="Silver" value={state.silver} />
        <Chip label="Renown" value={state.renown} />
        {held > 0 ? <Chip label="Held" value={held} warn /> : null}
      </div>
    </header>
  );
}
