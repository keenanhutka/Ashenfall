import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function Chronicle({ state }: { state: GameState }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [state.logSeq]);

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-md border border-border bg-surface">
      <h2 className="border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        Chronicle
      </h2>
      <div className="min-h-40 flex-1 overflow-y-auto px-3 py-3 text-sm leading-relaxed">
        {state.log.length === 0 ? (
          <p className="text-muted">The hall is quiet.</p>
        ) : (
          state.log.map((line) => (
            <p
              key={line.id}
              className={cn(
                "mb-2.5 last:mb-0",
                line.kind === "warn" && "text-danger",
                line.kind === "ok" && "text-ok",
              )}
            >
              {line.text}
            </p>
          ))
        )}
        <div ref={end} />
      </div>
    </section>
  );
}
