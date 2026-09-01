import { Button } from "@/components/ui/button";
import { speakerPortrait } from "@/lib/game/scene";
import type { Choice, Person, SceneLine } from "@/lib/game/types";

export function ChoicePanel({
  scene,
  choices,
  people,
  onChoose,
}: {
  scene: SceneLine[];
  choices: Choice[];
  people: Person[];
  onChoose: (id: string) => void;
}) {
  return (
    <section className="border-b border-border bg-raised">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 md:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Word</p>
        <div className="flex flex-col gap-3">
          {scene.map((line, i) => {
            const src = speakerPortrait(line.speaker, people);
            return (
              <div key={`${line.speaker ?? "n"}-${i}`} className="flex gap-3">
                {src ? (
                  <img
                    src={src}
                    alt=""
                    className="size-11 shrink-0 rounded-sm object-cover object-top outline outline-1 -outline-offset-1 outline-fg/10"
                  />
                ) : null}
                <div className="min-w-0 pt-0.5">
                  {line.speaker ? (
                    <p className="font-display text-lg leading-tight text-fg">{line.speaker}</p>
                  ) : null}
                  <p className={line.speaker ? "text-sm text-muted" : "text-sm text-fg"}>{line.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {choices.map((c) => (
            <Button key={c.id} variant="secondary" onClick={() => onChoose(c.id)}>
              {c.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
