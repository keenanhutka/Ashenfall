import { createFileRoute, Link } from "@tanstack/react-router";
import { PlaceFrame } from "@/components/game/PlaceFrame";
import { Button } from "@/components/ui/button";
import { BUILD_NEED, wallReady } from "@/lib/game/engine";
import { useGame } from "@/lib/game/store";

export const Route = createFileRoute("/estate/wall")({
  component: WallPage,
});

function WallPage() {
  const game = useGame();
  const dispatch = useGame((s) => s.dispatch);
  const canAct = game.ap >= 1 && !game.choices && !game.partyRoute;
  const ready = wallReady(game);

  return (
    <PlaceFrame
      kicker="The ring"
      title={game.palisade ? "The palisade" : "The wall"}
      lead={
        game.palisade
          ? game.pairAsk
            ? "The ring is closed. Two lots wait. Name the first pair."
          : game.watchPost
            ? game.nightSign
              ? "The post saw small shapes at the water-gate. Name a watch or they will come in."
              : game.huntSign
                ? "The post saw heavy prints on the game-side. Name a watch or the hunters come in."
              : game.elfSign
                ? "The post saw marks on the old timber. Name a watch or they shoot the wood-cut."
              : game.dwarfSign
                ? "The post saw stone-watchers at the tree-line. Name a watch or they walk the yard."
              : game.trollSign
                ? "The post saw the stink on the water. Name a watch or it tries the dock."
              : "Timber closes a yard. The post looks over the water-gate and the dock beyond."
            : "Timber closes a yard. Raise a watch-post — wood 2, labor 2 — so night sees farther."
          : ready
            ? game.aldredWaiting
              ? "Word is out and the house is too small. Aldred waits on this timber. Wood 8, labor 8."
              : "Word is out and the house is too small. Wood 8, labor 8. Keep the dock working or you starve mid-wall."
            : "A palisade waits on a store, Oswin's visit, Renown 8, and pressure — crowding, raid-sign, or sails turned away."
      }
    >
      <dl className="grid grid-cols-2 gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">{game.palisade ? "Post" : "Wall"}</dt>
          <dd className="font-display text-2xl tabular-nums">
            {game.palisade ? `${game.watchPostProg}/${BUILD_NEED.post}` : `${game.wallProg}/${BUILD_NEED.wall}`}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Wood</dt>
          <dd className="font-display text-2xl tabular-nums">{game.wood}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted">Renown</dt>
          <dd className="font-display text-2xl tabular-nums">{game.renown}</dd>
        </div>
      </dl>
      {!game.palisade ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canAct || !ready || game.wood < 1 || game.wallProg >= BUILD_NEED.wall} onClick={() => dispatch({ type: "work", kind: "wall" })}>
            Raise stakes
          </Button>
          <Button asChild variant="secondary">
            <Link to="/estate/household">Assign Wall</Link>
          </Button>
        </div>
      ) : !game.watchPost ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canAct || game.wood < 1 || game.watchPostProg >= BUILD_NEED.post} onClick={() => dispatch({ type: "work", kind: "post" })}>
            Raise a watch-post
          </Button>
          <Button asChild variant="secondary">
            <Link to="/estate/household">Assign Wall</Link>
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">
          {game.nightSign
            ? "Night-sign is on the water. The post is only as good as the name you set on Household."
            : game.huntSign
              ? "Prints on the game-side. The post is only as good as the name you set on Household."
            : game.elfSign
              ? "Marks on the old timber. The post is only as good as the name you set on Household."
            : game.dwarfSign
              ? "Stone-watchers at the tree-line. The post is only as good as the name you set on Household."
            : "The post is manned from the household page. Named lots are on the map."}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => dispatch({ type: "inspect", place: "wall" })}>
          Look around
        </Button>
      </div>
    </PlaceFrame>
  );
}
