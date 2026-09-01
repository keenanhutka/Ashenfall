import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/game/engine";
import { captiveHome, captiveSlots, freeFolk, slaves } from "@/lib/game/people";
import { useGame } from "@/lib/game/store";
import type { RouteId } from "@/lib/game/types";

export const Route = createFileRoute("/estate/explore/$routeId")({
  component: ExplorePage,
});

function ExplorePage() {
  const { routeId } = Route.useParams();
  const route = ROUTES.find((r) => r.id === routeId);
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>([]);

  if (!route) {
    return (
      <PlaceFrame kicker="The wild" title="No path">
        <Button asChild>
          <Link to="/estate">Return</Link>
        </Button>
      </PlaceFrame>
    );
  }

  const able = freeFolk(game).filter((p) => p.hurt < 7 && !(p.id === "aldred" && p.job === "explore"));
  const aldredOut = game.people.some((p) => p.alive && p.id === "aldred" && p.job === "explore");
  const you = game.people.find((p) => p.id === "player");
  const badly = (you?.hurt ?? 0) > 3;
  const canRange = game.exploreOpen && game.ap >= 3 && !game.choices && !game.partyRoute && !badly;
  const first = !game.contacts[route.first];
  const lead =
    route.id === "coast" && captiveHome(game) === "cage" && slaves(game).length < captiveSlots(game) && !game.contacts.bars_room
      ? "The wrack is not empty. The cage has room."
      : route.id === "trails" &&
          captiveHome(game) === "cage" &&
          slaves(game).length < captiveSlots(game) &&
          !game.contacts.trail_room &&
          !slaves(game).some((p) => p.race === "orc")
        ? "A wounded hunter on the moss. Not small. The cage has room if you mean it."
      : route.id === "timber" &&
          captiveHome(game) === "cage" &&
          slaves(game).length < captiveSlots(game) &&
          !game.contacts.wood_room &&
          !slaves(game).some((p) => p.race === "elf")
        ? "A watcher bound against the bark. Tall. The cage has room. The wood will remember."
      : route.id === "fold" &&
          captiveHome(game) === "cage" &&
          slaves(game).length < captiveSlots(game) &&
          !game.contacts.cut_room &&
          !slaves(game).some((p) => p.race === "dwarf")
        ? "A straggler on the spoil-heap. Short. The cage has room. The cut will remember."
      : route.id === "stream" &&
          captiveHome(game) === "cage" &&
          slaves(game).length < captiveSlots(game) &&
          !game.contacts.stream_room
        ? "The stink is feeding. The cage has room. This is not a people."
      : route.id === "timber" && (game.elfSign || game.elfGrudge >= 1)
      ? game.elfSign
        ? "Marks on the trees. They followed the path you cut. Watch tonight."
        : "The wood remembers steel. Capture poisoned this path."
      : route.id === "fold" && (game.dwarfSign || game.dwarfGrudge >= 1)
        ? game.dwarfSign
          ? "Stone-dust at the tree-line. They followed you home."
          : "The cut remembers you. Capture poisoned this path."
        : route.id === "stream" && (game.trollSign || game.trollHits >= 1 || game.contacts.troll_dead)
          ? game.contacts.troll_dead
            ? "Empty water. The big thing is gone. The stink is not."
            : game.trollSign
              ? "The stink has come down the water. Watch the dock tonight."
              : "It has tried the water-gate. The stream still knows the hall."
        : route.hint;

  const toggle = (id: string) => {
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return cur;
      return [...cur, id];
    });
  };

  const setOut = (ids: string[]) => {
    dispatch({ type: "beginExplore", routeId: route.id as RouteId });
    dispatch({ type: "confirmParty", ids });
  };

  return (
    <PlaceFrame kicker="Beyond the estate" title={route.name} lead={lead}>
      {!game.exploreOpen ? (
        <div className="rounded-md border border-border bg-surface p-4">
          <p className="text-sm text-muted">
            Eadgyth will not have you ranging until a store stands. Cut timber in the yard, or walk the rocks from the
            dock.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "woods" })}>
              Look around
            </Button>
            <Button asChild variant="secondary">
              <Link to="/estate/yard">The yard</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/estate/dock">The dock</Link>
            </Button>
          </div>
        </div>
      ) : game.choices ? (
        <p className="text-sm text-muted">Answer above. The land is waiting on your word.</p>
      ) : badly ? (
        <p className="text-sm text-danger">The wound will not carry you into the trees. Rest until it closes.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {first ? "You have not stood this ground before." : "You have walked this way."} Costs 3 AP. Take one or two
            free hands — capture needs them. Hurt hands still range; the fight will be worse. Thralls do not range.
            {aldredOut ? " Aldred already took a spear this morning. He walks his own path." : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {able.map((p) => (
              <Button
                key={p.id}
                variant={picked.includes(p.id) ? "default" : "secondary"}
                onClick={() => toggle(p.id)}
              >
                {p.hurt > 0 ? `${p.name} · hurt` : p.name}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "woods" })}>
              Look around
            </Button>
            <Button disabled={!canRange || picked.length === 0} onClick={() => setOut(picked)}>
              Set out
            </Button>
            <Button variant="ghost" disabled={!canRange} onClick={() => setOut([])}>
              Go alone
            </Button>
            {route.id === "trails" ? (
              <Button
                variant="secondary"
                disabled={game.ap < 1 || Boolean(game.choices) || Boolean(game.partyRoute) || badly}
                onClick={() => dispatch({ type: "work", kind: "game" })}
              >
                Hunt the near trails · 1 AP
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => void navigate({ to: "/estate" })}>
              Stay
            </Button>
          </div>
        </>
      )}
    </PlaceFrame>
  );
}
