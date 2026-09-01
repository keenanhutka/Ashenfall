import type { GameState, SceneLine } from "./types";

export function partyVoice(s: GameState, table: Record<string, string>): SceneLine[] {
  const lines: SceneLine[] = [];
  for (const id of s.party) {
    const text = table[id];
    const p = s.people.find((x) => x.id === id && x.alive);
    if (text && p) lines.push({ speaker: p.name, text });
  }
  if (s.party.length === 0 && table.alone) lines.push({ text: table.alone });
  return lines;
}

export const VOICE_GOBLIN: Record<string, string> = {
  eadric: "Hold. They have stones in those rags.",
  godric: "Thieves. Look at the wreckage.",
  wulfric: "We can take them now.",
  osric: "Watch their hands. And the rocks behind.",
  alone: "Eadgyth said not alone. Too late for that.",
};

export const VOICE_ORC: Record<string, string> = {
  eadric: "Do not give the trail.",
  godric: "They already have a kill. They are measuring us.",
  wulfric: "I can match that size.",
  osric: "Alone is how you get hurt.",
  alone: "Too many, and no one at your shoulder.",
};

export const VOICE_ELF: Record<string, string> = {
  eadric: "They saw us first.",
  godric: "A border, not a welcome.",
  wulfric: "If we push they will answer.",
  osric: "Leave a gift, or leave the trees.",
  alone: "You were watched. Turning back is sense.",
};

export const VOICE_DWARF: Record<string, string> = {
  eadric: "Stay off their cut.",
  godric: "A workplace. Not a camp.",
  wulfric: "Stone-dust. They make things here.",
  osric: "Offer and step back. This is not ours.",
  alone: "You walked into a working. Leave it.",
};

export const VOICE_TROLL: Record<string, string> = {
  eadric: "That is not a people.",
  godric: "We could not.",
  wulfric: "We could—",
  osric: "Back. Slow.",
  alone: "No one will drag you home if it turns.",
};

export const VOICE_STREAM_CAGE: Record<string, string> = {
  eadric: "That is not a people. The bars will not hold it.",
  godric: "We could not. Not to a cage.",
  osric: "Back. Slow. The cage was timbered for smaller throats.",
  wulfric: "We could—",
  aldred: "Spear-work against that is a story you do not finish.",
};

export const VOICE_TROLL_NIGHT: Record<string, string> = {
  osric: "The stink is on our water. Not goblins.",
  eadric: "That is not a people. Hold the plank or give it.",
  godric: "We could not. Throw meal and live.",
  wulfric: "We could—",
  eadgyth: "Inside. The dock is timber. Timber breaks.",
  aldred: "Spear-work against that is a story you do not finish.",
  cuthwin: "I have an axe. It will not be enough.",
  leofric: "Give the water or stand. There is no third.",
  hilda: "The fish-rot is at the pilings.",
  dunstan: "I fish this water. Not beside that.",
  aethel: "Throw food. Do not make a door of the dock.",
};

export const VOICE_COAST_THIEF: Record<string, string> = {
  eadric: "Again. Drive them or take one.",
  godric: "The same little thieves.",
  osric: "Hands first. Then the path home.",
  wulfric: "I have them.",
};

export const VOICE_COAST_BARS: Record<string, string> = {
  eadric: "The cage was timbered for this.",
  godric: "Still breathing. Small.",
  osric: "Rope on the path home. The bars will hold.",
  wulfric: "I can carry them.",
  aldred: "The wrack already did the work.",
};

export const VOICE_TRAIL_MOSS: Record<string, string> = {
  eadric: "Not this. Goblins are one thing.",
  godric: "A hunter. The bars were cut for smaller throats.",
  osric: "The bars will hold a goblin. This will try them.",
  wulfric: "I can drag them.",
  aldred: "A story if you live to tell it.",
};

export const VOICE_WOOD_BIND: Record<string, string> = {
  eadric: "Leave them. The wood will remember steel.",
  godric: "A watcher, bound. Not thieves.",
  osric: "The bars were cut for goblins. This will bring arrows home.",
  wulfric: "I can drag them.",
  aldred: "The trees have a long memory.",
};

export const VOICE_CUT_BIND: Record<string, string> = {
  eadric: "Stay off their cut. This will bring hammers home.",
  godric: "A workplace. Not a camp. Not a taking.",
  osric: "The bars were cut for goblins. Stone-watchers keep a longer count.",
  wulfric: "I can drag them.",
  aldred: "Short men. Long memory.",
};

export const VOICE_RAID: Record<string, string> = {
  osric: "Small feet on wet wood. I have the line.",
  eadric: "Now. Before they have the meal.",
  godric: "The same little thieves. At our own plank.",
  wulfric: "I can take one.",
  eadgyth: "The meal is on the dock.",
  cuthwin: "I am here.",
  hilda: "They know this dock.",
  aldred: "Let them try a spear.",
  leofric: "Hold one if you mean to keep it.",
  dunstan: "I fish this water. Not them.",
  aethel: "They will come again if you let them.",
};

export const VOICE_HALL_RAID: Record<string, string> = {
  osric: "At the door. Not the dock this time.",
  eadric: "Inside. We hold this roof.",
  godric: "They learned the water-gate.",
  wulfric: "I have the bar.",
  eadgyth: "Inside. Now.",
  cuthwin: "The hall, not the plank.",
  aldred: "This is why a spear stays by the door.",
  leofric: "They want the house now.",
};

export const VOICE_FIGHT: Record<string, string> = {
  eadric: "Hold. Do not give them the first step.",
  godric: "We can take this if we keep our feet.",
  wulfric: "I will not run.",
  osric: "Watch who is already hurt. And the ground behind.",
  aldred: "Spear-work. Short and ugly.",
  leofric: "I have an axe. Say the word.",
  alone: "No one at your shoulder. Run is still a choice.",
};

export const VOICE_HUNT: Record<string, string> = {
  osric: "Heavy feet on the game-side. Not goblins.",
  eadric: "Hold the gate. They hunt us now.",
  godric: "The trails have followed us home.",
  wulfric: "I can match that size at a door.",
  eadgyth: "Inside. Bar it.",
  aldred: "Spear-work. This is why I stayed.",
  cuthwin: "I have an axe.",
  leofric: "They want the house, not the kill.",
  hilda: "The timber is not empty.",
  dunstan: "I have seen hunters at a door before.",
  aethel: "Name a watch or they walk in.",
};

export const VOICE_ELF_NIGHT: Record<string, string> = {
  osric: "Marks on the old timber. They followed the path we cut.",
  eadric: "A border, at our own trees now.",
  godric: "No thieves. A warning with a point.",
  wulfric: "I can take a tree-line.",
  eadgyth: "Leave their trees. We have a hall.",
  aldred: "Arrows, not spears. Do not stand in the open.",
  cuthwin: "The wood-cut is watched.",
  leofric: "I will not cut if they shoot.",
  hilda: "They know the hall.",
  dunstan: "Not a people you steal from twice.",
  aethel: "A gift, or the trees.",
};

export const VOICE_DWARF_NIGHT: Record<string, string> = {
  osric: "Stone-watchers at the tree-line. They followed us home.",
  eadric: "Stay off their cut. They did not stay off ours.",
  godric: "A workplace walking. They want iron, not meal.",
  wulfric: "Let them try the yard.",
  eadgyth: "Offer and step back. This is not a raid.",
  aldred: "Short men. Long memory.",
  cuthwin: "The workshop is in the open.",
  leofric: "They make things. They will take things.",
  hilda: "Do not start what the fold will finish.",
  dunstan: "I have seen a working close a path.",
  aethel: "Give them a gift. Keep the iron.",
};

export const VOICE_YARD: Record<string, string> = {
  osric: "In the yard. Not the trees yet.",
  eadric: "Hold them. The bar is behind.",
  godric: "They got past the bar. Not past us.",
  wulfric: "I have them.",
  eadgyth: "The bar or the trees. Choose.",
  aldred: "Spear-work in a yard is still spear-work.",
  cuthwin: "I have an axe. Put them back.",
  leofric: "Hold one if you mean to keep it.",
  hilda: "The timber is not empty.",
  dunstan: "I have seen a yard at night.",
  aethel: "Back to the bar, or they are gone.",
  player: "They are in the yard, not yet the trees.",
};

export function yardWatchLine(id: string, home: "cage" | "hut" | "hall"): string | undefined {
  if (id === "eadgyth" || id === "godric") return undefined;
  if (id === "eadric") {
    return home === "cage"
      ? "Hold them. The bars are behind."
      : home === "hut"
        ? "Hold them. The bar is behind."
        : "Hold them. The roof is behind.";
  }
  if (id === "aethel") {
    return home === "cage"
      ? "Back to the bars, or they are gone."
      : home === "hut"
        ? "Back to the bar, or they are gone."
        : "Back to the hall, or they are gone.";
  }
  return VOICE_YARD[id];
}

export function speakerPortrait(speaker: string | undefined, people: GameState["people"]): string | null {
  if (!speaker) return null;
  if (speaker === "Oswin") return "/people/oswin.jpg";
  if (speaker === "Saewyn") return "/people/saewyn.jpg";
  const p = people.find((x) => x.name === speaker);
  if (p) return `/people/${p.portrait}.jpg`;
  return null;
}
