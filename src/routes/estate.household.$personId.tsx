import { createFileRoute, Link } from "@tanstack/react-router";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { STAT_LABELS, beautyLabel, bodyLabel, captiveHome, isHand, jobLabel, portraitSrc, raceLabel, saewynLookLine, slaveJobLine, slavePrice, slaves, statusLabel } from "@/lib/game/people";
import { escapeLineFor } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/household/$personId")({
  component: PersonPage,
});

function PersonPage() {
  const { personId } = Route.useParams();
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const person = game.people.find((p) => p.id === personId && p.alive);
  const canAct = game.ap >= 1 && !game.choices && !game.partyRoute;
  const slavesExist = slaves(game).length > 0;
  const osric = game.people.find((p) => p.id === "osric" && p.alive);
  const home = captiveHome(game);
  const saewynLook = saewynLookLine(game);

  if (!person) {
    return (
      <PlaceFrame kicker="Gone" title="No one here">
        <Button asChild>
          <Link to="/estate/household">The household</Link>
        </Button>
      </PlaceFrame>
    );
  }

  const price = person.status === "slave" ? slavePrice(person) : 0;

  return (
    <PlaceFrame kicker={person.role} title={person.name} hideRecent>
      <div className="flex flex-col gap-4 sm:flex-row">
        <img
          src={portraitSrc(person.portrait)}
          alt={person.name}
          className="h-64 w-48 shrink-0 rounded-md object-cover object-top outline outline-1 -outline-offset-1 outline-fg/15"
        />
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            {statusLabel(person.status)} · {raceLabel(person.race)} · {person.sex === "f" ? "Woman" : "Man"} · age{" "}
            {person.age}
          </p>
          <p className="text-sm">
            {beautyLabel(person.beauty)} · {bodyLabel(person.body)}
            {person.hurt > 3 ? " · badly hurt" : person.hurt > 0 ? ` · hurt ${person.hurt}d` : ""}
            {person.guest ? " · lodging" : person.status === "slave" ? "" : ` · at ${jobLabel(person.job, game)}`}
          </p>
          {person.status === "slave" ? <p className="text-sm text-muted">{slaveJobLine(person, game)}</p> : null}
          {person.status === "slave" ? (
            <>
              <p className="text-sm text-muted">
                {person.collar ? "Collared" : "No collar"}
                {person.cuffs ? " · cuffed" : ""}
                {game.oswinDays > 0 ? ` · Oswin offers ${price || "nothing"}` : ""}
                {saewynLook ? ` · ${saewynLook}` : ""}
              </p>
              <p className={game.watch === "none" ? "text-sm text-danger" : "text-sm text-muted"}>{escapeLineFor(game, person)}</p>
              {home === "cage" ? (
                <p className="text-sm text-muted">Sleeps under the proper bars, not among the free.</p>
              ) : home === "hut" ? (
                <p className="text-sm text-muted">Sleeps barred in the first store, not among the free.</p>
              ) : (
                <p className="text-sm text-danger">
                  {game.hutAsk ? "Among the free until dawn names a bar." : "Among the free."}
                </p>
              )}
            </>
          ) : person.id !== "player" ? (
            <p className="text-sm text-muted">Loyalty {person.loyalty}/10</p>
          ) : (
            <p className="text-sm text-muted">The house stands or falls on you.</p>
          )}
          {isHand(person.id) && person.status === "free" && person.loyalty <= 3 ? (
            <p className="text-sm text-danger">
              {person.loyalty <= 2 ? "A pack is on the floor." : "They look at the door."}
            </p>
          ) : null}
          {person.id === "aldred" && person.status === "free" ? (
            <p className="text-sm text-muted">
              {person.job === "explore"
                ? "He took a spear at dawn. Dusk will have him back."
                : game.exploreOpen
                  ? "He will range without you, if you name it."
                  : "He waits on a store before he will take a spear far."}
            </p>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-5 gap-2 rounded-md border border-border bg-surface p-3">
        {STAT_LABELS.map((row) => (
          <div key={row.key} className="text-center">
            <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">{row.name.slice(0, 3)}</dt>
            <dd className="font-display text-2xl tabular-nums">{person[row.key]}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        {person.status === "slave" && !person.collar ? (
          <Button
            variant="secondary"
            disabled={!canAct || game.hide < 1}
            onClick={() => dispatch({ type: "restrain", id: person.id, kind: "collar" })}
          >
            Collar · 1 hide
          </Button>
        ) : null}
        {person.status === "slave" && !person.cuffs ? (
          <Button
            variant="secondary"
            disabled={!canAct || game.hide < 1}
            onClick={() => dispatch({ type: "restrain", id: person.id, kind: "cuffs" })}
          >
            Cuffs · 1 hide
          </Button>
        ) : null}
        {person.status === "slave" && (!person.collar || !person.cuffs) ? (
          <p className="w-full text-sm text-muted">
            {osric
              ? home === "cage"
                ? "Osric or you. Hide and a day. Leather goes to the bars."
                : home === "hut"
                  ? "Osric or you. Hide and a day. Leather goes to the first store."
                  : "Osric or you. Hide and a day. They still sleep this roof."
              : "Osric is gone. Your hands, or none."}
          </p>
        ) : null}
        {person.status === "slave" && game.oswinDays > 0 && price > 0 ? (
          <Button variant="danger" onClick={() => dispatch({ type: "sellPerson", id: person.id })}>
            Sell to Oswin · {price} silver
          </Button>
        ) : null}
        {person.id === "saewyn" && game.saewynTalk ? (
          <p className="w-full text-sm text-muted">
            {game.saewynWarm ? "A warmer word than a buyer needs. Eadric hates it." : "She has the hall's measure."}
          </p>
        ) : null}
        {person.id === "saewyn" && game.saewynBought ? (
          <p className="w-full text-sm text-muted">She has stock for the home market. She still lodges.</p>
        ) : null}
        {person.id === "saewyn" && game.saewynDays > 0 && !game.saewynTalk ? (
          <Button
            variant="secondary"
            disabled={Boolean(game.choices) || Boolean(game.partyRoute)}
            onClick={() => dispatch({ type: "saewyn", id: "saewyn_talk" })}
          >
            Talk
          </Button>
        ) : null}
        {person.id === "saewyn" && game.saewynDays > 0 && slavesExist && !game.saewynBought ? (
          <Button
            variant="secondary"
            disabled={Boolean(game.choices) || Boolean(game.partyRoute)}
            onClick={() => dispatch({ type: "saewyn", id: "saewyn_stock" })}
          >
            Show her the stock
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link to="/estate/household">All faces</Link>
        </Button>
      </div>
    </PlaceFrame>
  );
}
