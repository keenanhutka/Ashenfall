import { PersonCard } from "@/components/game/PersonCard";
import { Button } from "@/components/ui/button";
import { watchName } from "@/lib/game/engine";
import { captiveHome, jobsFor, JOBS, jobLabel, nightWatchEmptyLine, slaves } from "@/lib/game/people";
import type { GameState, Job } from "@/lib/game/types";

type Props = {
  state: GameState;
  onJob: (id: string, job: Job) => void;
  onWatch: (id: string) => void;
};

export function Roster({ state, onJob, onWatch }: Props) {
  const folk = state.people.filter((p) => p.alive && !p.guest && p.id !== "player");
  const you = state.people.find((p) => p.id === "player");
  const youHurt = (you?.hurt ?? 0) > 3;
  const held = slaves(state).length;
  const home = captiveHome(state);
  const watchLabel = watchName(state);

  return (
    <section className="rounded-md border border-border bg-surface p-3">
      <div className="mb-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Night watch</h2>
        <p className="mt-1 text-sm text-muted">
          {state.watch === "none"
            ? home !== "hall" && !held
              ? nightWatchEmptyLine(state)
              : "No watch. Night-sign will try the dock and the door."
            : `${watchLabel === "you" ? "You have" : `${watchLabel} has`} the night. Tired at dawn.`}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={state.watch === "none" ? "default" : "secondary"}
            onClick={() => onWatch("none")}
          >
            No one
          </Button>
          <Button
            type="button"
            size="sm"
            variant={state.watch === "player" ? "default" : "secondary"}
            disabled={youHurt && state.watch !== "player"}
            onClick={() => onWatch("player")}
          >
            You
          </Button>
          {folk
            .filter((p) => p.status === "free")
            .map((p) => {
              const bad = p.hurt > 3;
              return (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={state.watch === p.id ? "default" : "secondary"}
                  disabled={bad && state.watch !== p.id}
                  onClick={() => onWatch(p.id)}
                >
                  {bad ? `${p.name} · hurt` : p.name}
                </Button>
              );
            })}
        </div>
      </div>
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Household</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {state.people
          .filter((p) => p.alive)
          .map((p) => {
            const jobs = jobsFor(p, state);
            return (
              <li key={p.id} className="flex flex-col gap-2">
                <PersonCard person={p} />
                {jobs.length > 0 ? (
                  <select
                    value={p.job}
                    onChange={(e) => onJob(p.id, e.target.value as Job)}
                    className="h-11 rounded-sm border border-border bg-raised px-2 text-sm text-fg"
                    aria-label={`${p.name} work`}
                  >
                    {JOBS.filter((j) => jobs.includes(j.id)).map((j) => (
                      <option key={j.id} value={j.id}>
                        {jobLabel(j.id, state)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </li>
            );
          })}
      </ul>
    </section>
  );
}
