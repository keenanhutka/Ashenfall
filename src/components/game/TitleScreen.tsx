import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_STATS, STAT_LABELS } from "@/lib/game/people";
import type { CoreStats } from "@/lib/game/types";

type Props = {
  hasSave: boolean;
  onStart: (name: string, house: string, stats: CoreStats) => void;
  onContinue: () => void;
};

export function TitleScreen({ hasSave, onStart, onContinue }: Props) {
  const [step, setStep] = useState<"name" | "stats">("name");
  const [name, setName] = useState("Eadward");
  const [house, setHouse] = useState("Ashenfall");
  const [stats, setStats] = useState<CoreStats>({ ...DEFAULT_STATS });

  const raised =
    Math.max(0, stats.str - DEFAULT_STATS.str) +
    Math.max(0, stats.agi - DEFAULT_STATS.agi) +
    Math.max(0, stats.int - DEFAULT_STATS.int) +
    Math.max(0, stats.cha - DEFAULT_STATS.cha) +
    Math.max(0, stats.end - DEFAULT_STATS.end);
  const lowered =
    Math.max(0, DEFAULT_STATS.str - stats.str) +
    Math.max(0, DEFAULT_STATS.agi - stats.agi) +
    Math.max(0, DEFAULT_STATS.int - stats.int) +
    Math.max(0, DEFAULT_STATS.cha - stats.cha) +
    Math.max(0, DEFAULT_STATS.end - stats.end);

  const bump = (key: keyof CoreStats, dir: 1 | -1) => {
    setStats((cur) => {
      const next = cur[key] + dir;
      if (next < 4 || next > 8) return cur;
      if (dir === 1 && raised >= 2) return cur;
      if (dir === -1 && lowered >= 2) return cur;
      return { ...cur, [key]: next };
    });
  };

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <img
        src="/maps/wave0.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[40%_45%] opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/20" />
      <div className="relative z-10 flex min-h-dvh max-w-xl flex-col justify-end gap-6 px-6 py-10 md:justify-center md:px-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted">Æleric exile · v0.82</p>
        <h1 className="font-display text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
          Ashenfall
        </h1>
        <p className="max-w-md text-base text-muted">
          {step === "name"
            ? "One hall. One dock. A wild shore already held by folk who share no tongue with you."
            : "The heir is young. Move two points among the five. None above eight, none below four."}
        </p>

        {step === "name" ? (
          <form
            className="flex max-w-md flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setStep("stats");
            }}
          >
            <label className="text-xs uppercase tracking-[0.14em] text-muted">
              Given name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block h-11 w-full rounded-sm border border-border bg-surface px-3 text-base text-fg"
                autoComplete="nickname"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.14em] text-muted">
              House
              <input
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                className="mt-1 block h-11 w-full rounded-sm border border-border bg-surface px-3 text-base text-fg"
              />
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" size="lg">
                The heir
              </Button>
              {hasSave ? (
                <Button type="button" variant="secondary" size="lg" onClick={onContinue}>
                  Continue
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="flex max-w-md flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">Points left · {2 - raised}</p>
            <ul className="divide-y divide-border rounded-md border border-border bg-surface/90">
              {STAT_LABELS.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="font-display text-lg">{row.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="size-11"
                      onClick={() => bump(row.key, -1)}
                      disabled={stats[row.key] <= 4 || lowered >= 2}
                      aria-label={`Lower ${row.name}`}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center font-display text-xl tabular-nums">{stats[row.key]}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="size-11"
                      onClick={() => bump(row.key, 1)}
                      disabled={stats[row.key] >= 8 || raised >= 2}
                      aria-label={`Raise ${row.name}`}
                    >
                      +
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="lg" onClick={() => onStart(name, house, stats)}>
                Take the hall
              </Button>
              <Button type="button" variant="ghost" size="lg" onClick={() => setStep("name")}>
                Back
              </Button>
            </div>
            <p className="text-sm text-muted">
              A poor hall. A poor dock. The rest is earned. Continue a save, or take the hall from the beginning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
