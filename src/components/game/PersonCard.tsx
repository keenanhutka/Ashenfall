import { Link } from "@tanstack/react-router";
import { beautyLabel, isHand, jobLabel, portraitSrc, raceLabel, statusLabel } from "@/lib/game/people";
import type { Person } from "@/lib/game/types";
import { useGame } from "@/lib/game/store";

export function PersonCard({ person, kicker }: { person: Person; kicker?: string }) {
  const game = useGame();
  const line = [
    person.guest ? "Guest" : statusLabel(person.status),
    person.race !== "human" ? raceLabel(person.race) : person.role,
    person.hurt > 3 ? "Badly hurt" : person.hurt > 0 ? `Hurt ${person.hurt}d` : null,
    isHand(person.id) && person.loyalty <= 3 && person.status === "free" ? "Restless" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to="/estate/household/$personId"
      params={{ personId: person.id }}
      className="flex min-h-11 gap-3 rounded-md border border-border bg-raised p-2 outline outline-1 -outline-offset-1 outline-fg/10 transition-colors hover:border-muted"
    >
      <img
        src={portraitSrc(person.portrait)}
        alt=""
        className="h-16 w-12 shrink-0 rounded-sm object-cover object-top outline outline-1 -outline-offset-1 outline-fg/15"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg leading-tight">{person.name}</p>
        <p className="truncate text-xs text-muted">{kicker ?? line}</p>
        <p className="text-xs text-subtle">
          {person.id === "player" ? "Heir" : person.guest ? "Lodging" : jobLabel(person.job, game)}
          {person.status === "slave" ? ` · ${beautyLabel(person.beauty)}` : ""}
        </p>
      </div>
    </Link>
  );
}
