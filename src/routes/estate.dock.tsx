import { createFileRoute, Link } from "@tanstack/react-router";
import { PersonCard } from "@/components/game/PersonCard";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { SHOP, SELL, mouths } from "@/lib/game/engine";
import { captiveHome, fishGuard, portraitSrc, saewynDockLine, slaveJobLine, slavePrice, slaves } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/dock")({
  component: DockPage,
});

function DockPage() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const canAct = game.ap >= 1 && !game.choices && !game.partyRoute;
  const held = slaves(game);

  return (
    <PlaceFrame
      kicker="The water"
      title="The dock"
      lead={
        game.trollSign
          ? "The stink is on the water. Something huge has come down the stream. Watch tonight."
          : game.nightSign
          ? "Prints on the pilings. They will come in the dark if no one watches."
          : game.settlersAsk
            ? game.oswinDays > 0
              ? "Oswin's stall is on the plank. A worn sail stands off it. Faces wait. Not his."
              : "A worn sail at the water-gate. Faces wait on the plank."
          : game.oswinDays > 0
            ? captiveHome(game) === "cage"
              ? "Oswin's stall is on the plank. He prices them from the bars. He will not winter."
              : captiveHome(game) === "hut"
                ? "Oswin's stall is on the plank. He prices them from the first store. He will not winter."
                : "Oswin's stall is on the plank. He buys what the hall makes. He will not winter."
          : game.people.some((p) => p.alive && p.id === "saewyn")
            ? game.saewynLeftOn > 0
              ? "A small sail took the water-gate. Saewyn lodges. She will not winter."
              : "Saewyn's cloth is at the plank. A buyer, not a sail that stays."
          : game.raidHits > 0
            ? "The pilings are scored. They have been here, and they know the path."
            : game.people.some((p) => p.alive && p.id === "leofric")
              ? "A worn sail has taken this water-gate. New hands work the rock, if you kept them."
              : "A poor run of timber on a hard shore. Osric's lines already wet if you sent him."
      }
    >
      {game.trollSign ? (
        <p className="rounded-md border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
          The stink is on the water. Watch the dock tonight.
        </p>
      ) : null}

      {game.nightSign ? (
        <p className="rounded-md border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
          Prints on the pilings. Watch the water tonight.
        </p>
      ) : null}

      {game.people.some((p) => p.alive && p.id === "saewyn") && game.saewynDays > 0 ? (
        <p className="text-sm text-muted">
          {game.saewynBought
            ? "Saewyn has stock for the home market. She still lodges."
            : held.length
              ? saewynDockLine(game)
              : "A buyer, not a stall. She will not winter."}
        </p>
      ) : null}

      {held.some((p) => p.job === "fish") ? (
        <p className={fishGuard(game) ? "text-sm text-muted" : "text-sm text-danger"}>
          {held.filter((p) => p.job === "fish").map((p) => slaveJobLine(p, game)).join(" ")}
        </p>
      ) : null}

      {game.settlersAsk ? (
        <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-fg">
          {game.oswinDays > 0
            ? "A second sail, worn, stands off the stall. Not Oswin's mouths."
            : "A worn sail at the water-gate. Faces wait on the plank."}
        </p>
      ) : null}

      {game.oswinDays > 0 ? (
        <section className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 flex gap-3">
            <img
              src={portraitSrc("oswin")}
              alt="Oswin"
              className="h-20 w-16 shrink-0 rounded-sm object-cover object-top outline outline-1 -outline-offset-1 outline-fg/15"
            />
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">The stall</p>
              <h2 className="font-display text-2xl leading-tight">Oswin</h2>
              <p className="text-sm text-muted">
                {game.oswinDays} day{game.oswinDays > 1 ? "s" : ""} at the plank. Silver talks. He buys piles. He will not
                winter.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {SHOP.map((item) => (
              <Button
                key={item.id}
                variant="secondary"
                disabled={game.silver < item.cost}
                onClick={() => dispatch({ type: "buy", item: item.id })}
              >
                {item.name} · {item.cost}s
              </Button>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">He buys</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SELL.map((item) => {
              const have =
                item.id === "smoked"
                  ? game.smoked
                  : item.id === "hide"
                    ? game.hide
                    : item.id === "wood"
                      ? game.wood
                      : game.iron;
              const lastMeal = item.id === "smoked" && game.food + (game.smoked - item.qty) < mouths(game);
              const full = game.oswinBuys >= 4;
              return (
                <Button
                  key={item.id}
                  variant="secondary"
                  disabled={have < item.qty || lastMeal || full}
                  onClick={() => dispatch({ type: "sell", item: item.id })}
                >
                  Sell {item.name.toLowerCase()} · {item.pay}s
                </Button>
              );
            })}
          </div>
          <p className="mt-2 text-sm text-muted">
            {game.oswinBuys >= 4
              ? "His bags are full enough this visit."
              : "Coin, not a name. He will not take the last meal."}
          </p>
          {held.length ? (
            <ul className="mt-4 grid gap-2">
              {held.map((p) => {
                const price = slavePrice(p);
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-48 flex-1">
                      <PersonCard person={p} />
                    </div>
                    <Button
                      variant="danger"
                      disabled={price < 1}
                      onClick={() => dispatch({ type: "sellPerson", id: p.id })}
                    >
                      {price < 1 ? "Refuses" : `Sell · ${price}s`}
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No stock for the home market.</p>
          )}
        </section>
      ) : game.oswin >= 3 ? (
        <p className="text-sm text-muted">Oswin has counted this ring. The stall will come again if the piles are worth the sail.</p>
      ) : game.oswin >= 1 ? (
        <p className="text-sm text-muted">Oswin's sail has taken this dock. It will come again. He buys piles when the hall is more than a rock.</p>
      ) : (
        <p className="text-sm text-muted">No ship yet. Only your own smoke on the wind.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "dock" })}>
          Look around
        </Button>
        <Button disabled={!canAct} onClick={() => dispatch({ type: "work", kind: "fish" })}>
          Help fish
        </Button>
        <Button
          variant="secondary"
          disabled={!canAct}
          onClick={() => dispatch({ type: "work", kind: "nearshore" })}
        >
          Walk the near shore
        </Button>
        <Button asChild variant="ghost">
          <Link to="/estate/household">Household</Link>
        </Button>
      </div>
      <p className="text-xs text-muted">Fishing costs 1 AP. Assigned hands bring their catch at dusk.</p>
    </PlaceFrame>
  );
}
