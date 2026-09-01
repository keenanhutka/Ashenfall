import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGame } from "@/lib/game/store";
import { cn } from "@/lib/utils";

export function PlaceFrame({
  kicker,
  title,
  lead,
  hideRecent,
  children,
}: {
  kicker: string;
  title: string;
  lead?: string;
  hideRecent?: boolean;
  children: ReactNode;
}) {
  const log = useGame((s) => s.log);
  const choices = useGame((s) => s.choices);
  const recent = log.slice(-3);
  const showRecent = !hideRecent && recent.length > 0 && !(choices && choices.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5 md:px-6">
      <div>
        <Link
          to="/estate"
          className="text-xs font-medium uppercase tracking-[0.16em] text-muted hover:text-fg"
        >
          Back to the yard
        </Link>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{kicker}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{title}</h1>
        {lead ? <p className="mt-2 max-w-prose text-muted">{lead}</p> : null}
      </div>
      {showRecent ? (
        <div className="rounded-md border border-border bg-surface px-4 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Last word</p>
          {recent.map((line) => (
            <p
              key={line.id}
              className={cn(
                "mb-1.5 text-sm last:mb-0",
                line.kind === "warn" && "text-danger",
                line.kind === "ok" && "text-ok",
              )}
            >
              {line.text}
            </p>
          ))}
        </div>
      ) : null}
      {children}
    </div>
  );
}
