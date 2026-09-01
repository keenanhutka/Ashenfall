import type {
  CoreStats,
  Escaped,
  GameState,
  Job,
  LotBuildingId,
  Person,
  Race,
  Sex,
  Status,
} from "./types";

export const DEFAULT_STATS: CoreStats = { str: 6, agi: 6, int: 6, cha: 7, end: 6 };

export const STAT_LABELS: { key: keyof CoreStats; name: string }[] = [
  { key: "str", name: "Strength" },
  { key: "agi", name: "Agility" },
  { key: "int", name: "Intelligence" },
  { key: "cha", name: "Charisma" },
  { key: "end", name: "Endurance" },
];

const BEAUTY = ["Ugly", "Homely", "Plain", "Fair", "Comely", "Fine", "Striking"] as const;
const BODY = [
  "Very petite",
  "Petite",
  "Small",
  "Slight",
  "Average",
  "Solid",
  "Sturdy",
  "Large",
  "Huge",
  "Giant",
] as const;

export function beautyLabel(n: number): string {
  return BEAUTY[Math.max(0, Math.min(6, n - 1))] ?? "Plain";
}

export function bodyLabel(n: number): string {
  return BODY[Math.max(0, Math.min(9, n - 1))] ?? "Average";
}

export function statusLabel(s: Status): string {
  if (s === "slave") return "Thrall";
  if (s === "indentured") return "Indentured";
  return "Free";
}

export function raceLabel(r: Race): string {
  return r[0].toUpperCase() + r.slice(1);
}

export function portraitSrc(slug: string): string {
  return `/people/${slug}.jpg`;
}

function basePerson(partial: Partial<Person> & Pick<Person, "id" | "name">): Person {
  return {
    job: "idle",
    alive: true,
    hurt: 0,
    fish: 2,
    wood: 1,
    race: "human",
    sex: "m",
    age: 20,
    status: "free",
    role: "companion",
    str: 6,
    agi: 6,
    int: 6,
    cha: 5,
    end: 6,
    beauty: 4,
    body: 5,
    loyalty: 7,
    portrait: partial.id,
    collar: false,
    cuffs: false,
    tired: false,
    guest: false,
    ...partial,
  };
}

export function startingHousehold(playerName: string, stats: CoreStats): Person[] {
  return [
    basePerson({
      id: "player",
      name: playerName,
      role: "heir",
      age: 18,
      fish: 2,
      wood: 2,
      loyalty: 10,
      beauty: 5,
      body: 5,
      cha: stats.cha,
      str: stats.str,
      agi: stats.agi,
      int: stats.int,
      end: stats.end,
      portrait: "player",
    }),
    basePerson({
      id: "eadgyth",
      name: "Eadgyth",
      job: "hall",
      role: "mother",
      sex: "f",
      age: 45,
      fish: 1,
      wood: 0,
      str: 4,
      agi: 4,
      int: 7,
      cha: 6,
      end: 5,
      loyalty: 9,
      beauty: 4,
      body: 4,
    }),
    basePerson({
      id: "eadric",
      name: "Eadric",
      role: "brother",
      age: 17,
      fish: 2,
      wood: 2,
      str: 6,
      agi: 6,
      int: 5,
      cha: 5,
      end: 6,
      loyalty: 8,
      beauty: 5,
      body: 5,
    }),
    basePerson({
      id: "godric",
      name: "Godric",
      role: "companion",
      age: 20,
      fish: 3,
      wood: 1,
      str: 5,
      agi: 6,
      int: 6,
      cha: 7,
      end: 5,
      loyalty: 8,
      beauty: 5,
      body: 5,
    }),
    basePerson({
      id: "wulfric",
      name: "Wulfric",
      role: "companion",
      age: 20,
      fish: 2,
      wood: 1,
      str: 6,
      agi: 6,
      int: 4,
      cha: 6,
      end: 6,
      loyalty: 8,
      beauty: 4,
      body: 6,
    }),
    basePerson({
      id: "osric",
      name: "Osric",
      job: "fish",
      role: "companion",
      age: 21,
      fish: 4,
      wood: 2,
      str: 7,
      agi: 5,
      int: 5,
      cha: 4,
      end: 8,
      loyalty: 9,
      beauty: 3,
      body: 7,
    }),
  ];
}

const HANGERS: Record<string, Person> = {
  cuthwin: basePerson({
    id: "cuthwin",
    name: "Cuthwin",
    job: "wood",
    role: "laborer",
    age: 28,
    fish: 2,
    wood: 3,
    str: 7,
    agi: 5,
    int: 4,
    cha: 3,
    end: 7,
    loyalty: 5,
    beauty: 3,
    body: 7,
  }),
  hilda: basePerson({
    id: "hilda",
    name: "Hilda",
    job: "hall",
    role: "laborer",
    sex: "f",
    age: 24,
    fish: 2,
    wood: 2,
    str: 5,
    agi: 5,
    int: 5,
    cha: 4,
    end: 6,
    loyalty: 5,
    beauty: 4,
    body: 4,
  }),
  aldred: basePerson({
    id: "aldred",
    name: "Aldred",
    job: "wood",
    role: "adventurer",
    age: 26,
    fish: 1,
    wood: 1,
    str: 6,
    agi: 7,
    int: 5,
    cha: 6,
    end: 6,
    loyalty: 4,
    beauty: 5,
    body: 5,
  }),
  saewyn: basePerson({
    id: "saewyn",
    name: "Saewyn",
    role: "buyer",
    sex: "f",
    age: 38,
    fish: 0,
    wood: 0,
    str: 3,
    agi: 4,
    int: 7,
    cha: 7,
    end: 4,
    loyalty: 3,
    beauty: 5,
    body: 4,
    guest: true,
  }),
  leofric: basePerson({
    id: "leofric",
    name: "Leofric",
    job: "wood",
    role: "laborer",
    age: 32,
    fish: 2,
    wood: 3,
    str: 7,
    agi: 5,
    int: 4,
    cha: 3,
    end: 7,
    loyalty: 4,
    beauty: 3,
    body: 7,
  }),
  aethel: basePerson({
    id: "aethel",
    name: "Æthel",
    job: "hall",
    role: "laborer",
    sex: "f",
    age: 22,
    fish: 1,
    wood: 1,
    str: 4,
    agi: 5,
    int: 5,
    cha: 5,
    end: 5,
    loyalty: 4,
    beauty: 4,
    body: 4,
  }),
  dunstan: basePerson({
    id: "dunstan",
    name: "Dunstan",
    job: "fish",
    role: "laborer",
    age: 44,
    fish: 3,
    wood: 1,
    str: 6,
    agi: 4,
    int: 5,
    cha: 4,
    end: 7,
    loyalty: 4,
    beauty: 3,
    body: 6,
  }),
};

export function hangerOf(id: string): Person | undefined {
  const h = HANGERS[id];
  return h ? { ...h } : undefined;
}

const KIN = new Set(["player", "eadgyth", "eadric", "godric", "wulfric", "osric"]);

export function isKin(id: string): boolean {
  return KIN.has(id);
}

export function isHand(id: string): boolean {
  return Boolean(HANGERS[id]) && id !== "saewyn";
}

const NAMES: Record<Race, { m: string[]; f: string[] }> = {
  human: { m: ["Cuthred"], f: ["Ælfgifu"] },
  goblin: { m: ["Skit", "Nib", "Grik", "Rusk", "Tek"], f: ["Vesh", "Niri", "Grikka"] },
  orc: { m: ["Grash", "Urdu", "Thok", "Brug"], f: ["Makka", "Usha", "Draga"] },
  elf: { m: ["Ash-hair", "Grey-cloak", "Long-watch"], f: ["Pale-hand", "Fern-eye", "Still-voice"] },
  dwarf: { m: ["Karn", "Brokk", "Heddin"], f: ["Helda", "Bryn", "Kara"] },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function jitter(base: number, spread: number, lo: number, hi: number): number {
  return clamp(base + Math.floor(Math.random() * (spread * 2 + 1)) - spread, lo, hi);
}

export function generateCaptive(race: Race): Person {
  const sex: Sex = Math.random() > 0.45 ? "m" : "f";
  const name = pick(NAMES[race][sex]);
  const id = `thrall-${race}-${Date.now().toString(36)}-${Math.floor(Math.random() * 99)}`;
  const byRace: Record<Race, Partial<Person>> = {
    human: { str: 6, agi: 6, int: 5, cha: 5, end: 6, beauty: 4, body: 5, age: 22, fish: 2, wood: 2 },
    goblin: { str: 3, agi: 8, int: 5, cha: 3, end: 4, beauty: 2, body: 2, age: 16, fish: 1, wood: 1 },
    orc: { str: 8, agi: 5, int: 4, cha: 3, end: 8, beauty: 3, body: 8, age: 24, fish: 1, wood: 3 },
    elf: { str: 5, agi: 8, int: 7, cha: 6, end: 5, beauty: 6, body: 4, age: 40, fish: 1, wood: 1 },
    dwarf: { str: 7, agi: 4, int: 6, cha: 4, end: 8, beauty: 3, body: 6, age: 50, fish: 1, wood: 3 },
  };
  const seed = byRace[race];
  return basePerson({
    id,
    name,
    race,
    sex,
    status: "slave",
    role: "thrall",
    job: "idle",
    portrait: race,
    loyalty: 1,
    str: jitter(seed.str ?? 5, 1, 2, 10),
    agi: jitter(seed.agi ?? 5, 1, 2, 10),
    int: jitter(seed.int ?? 5, 1, 2, 10),
    cha: jitter(seed.cha ?? 4, 1, 1, 8),
    end: jitter(seed.end ?? 5, 1, 2, 10),
    beauty: jitter(seed.beauty ?? 4, 1, 1, 7),
    body: jitter(seed.body ?? 5, 1, 1, 10),
    age: seed.age ?? 20,
    fish: seed.fish ?? 1,
    wood: seed.wood ?? 1,
  });
}

export function namedThrall(name: string, race: Race, sex: Sex): Person {
  const seed = generateCaptive(race);
  seed.id = `thrall-${race}-${name.toLowerCase()}`;
  seed.name = name;
  seed.sex = sex;
  seed.job = "hall";
  seed.portrait = race;
  if (race === "goblin") {
    seed.beauty = sex === "f" ? 3 : 2;
    seed.body = 2;
    seed.age = 16;
  }
  return seed;
}

export function recapture(escaped: Escaped): Person {
  return basePerson({
    id: escaped.id,
    name: escaped.name,
    race: escaped.race,
    sex: escaped.sex,
    status: "slave",
    role: "thrall",
    portrait: escaped.portrait,
    beauty: escaped.beauty,
    body: escaped.body,
    str: escaped.str,
    agi: escaped.agi,
    end: escaped.end,
    int: escaped.int,
    cha: escaped.cha,
    loyalty: 1,
  });
}

export function slaves(state: GameState): Person[] {
  return state.people.filter((p) => p.alive && p.status === "slave");
}

export function freeFolk(state: GameState): Person[] {
  return state.people.filter((p) => p.alive && p.status !== "slave" && !p.guest && p.id !== "player");
}

export function guests(state: GameState): Person[] {
  return state.people.filter((p) => p.alive && p.guest);
}

export function captiveSlots(state: GameState): number {
  if (hasBuilding(state, "thrallhut")) return 3;
  if (state.hut) return 2;
  return 1;
}

export function captiveHome(state: GameState): "cage" | "hut" | "hall" {
  if (hasBuilding(state, "thrallhut")) return "cage";
  if (state.hut) return "hut";
  return "hall";
}

export function mapSleepLine(state: GameState): string | null {
  if (!slaves(state).length) return null;
  const home = captiveHome(state);
  if (home === "cage") return "They sleep the bars. Not among the free.";
  if (home === "hut") return null;
  return state.hutAsk ? "A prisoner under the roof. Dawn will name it." : "A prisoner among the free.";
}

export function yardSleepLine(state: GameState): string | null {
  if (captiveHome(state) !== "cage") return null;
  if (!slaves(state).length) return "The proper cage stands inland. This mud is for timber.";
  return "They sleep inland of this mud, under the proper bars. The yard is not a cage.";
}

export function yardFourLotsLine(state: GameState): string {
  if (hasBuilding(state, "thrallhut")) {
    return leftTheLarder(state)
      ? "Four lots in the ring. The first store is a larder again."
      : "Four lots in the ring.";
  }
  if (state.hut) return "Four lots in the ring. The barred store is the first shed, not a lettered lot.";
  return "Four lots in the ring.";
}

export function shedPinLabel(state: GameState): "Larder" | "Hut" | "Store" | "Yard" {
  if (state.hut && hasBuilding(state, "thrallhut")) return "Larder";
  if (state.hut) return "Hut";
  if (state.sheds > 0) return "Store";
  return "Yard";
}

export function leftTheLarder(state: GameState): boolean {
  return Boolean(state.hut && hasBuilding(state, "thrallhut"));
}

export function saewynLookLine(state: GameState): string | null {
  if (state.saewynDays <= 0 || state.saewynBought) return null;
  const home = captiveHome(state);
  if (home === "cage") return "Saewyn will look at the bars";
  if (home === "hut") return "Saewyn will look at the first store";
  return "Saewyn will look";
}

export function saewynDockLine(state: GameState): string {
  const home = captiveHome(state);
  if (home === "cage") return "Saewyn will price stock from the bars, not at this plank.";
  if (home === "hut") return "Saewyn will price stock from the first store, not at this plank.";
  return "Saewyn will price stock under the roof, not at this plank.";
}

export function watchEmptyLine(state: GameState): string {
  const home = captiveHome(state);
  if (home === "cage") return "even if the bars are empty";
  if (home === "hut") return "even if the bar is empty";
  return "even if no one is held";
}

export function nightWatchEmptyLine(state: GameState): string {
  const home = captiveHome(state);
  if (home === "cage") return "The bars are empty. Night-sign still comes. Name a watch.";
  if (home === "hut") return "The bar is empty. Night-sign still comes. Name a watch.";
  return "No watch. Night-sign will try the dock and the door.";
}

export function bloodHoldLine(state: GameState): string {
  const home = captiveHome(state);
  if (home === "cage") return "Blood on the bars.";
  if (home === "hut") return "Blood on the bar.";
  return "Blood on the door.";
}

export function hallSleepers(state: GameState): Person[] {
  const home = captiveHome(state);
  return state.people.filter((p) => p.alive && !(p.status === "slave" && home !== "hall"));
}

export function hallCapacity(state: GameState): number {
  if (hasBuilding(state, "bunkhouse")) return 14;
  if (state.palisade) return 12;
  return 8;
}

export function crowding(state: GameState): number {
  return Math.max(0, hallSleepers(state).length - hallCapacity(state));
}

export function hasBuilding(state: GameState, id: string): boolean {
  return state.lots.some((l) => l.building === id && lotIsDone(l));
}

export function lotBuildingsOpen(state: GameState): LotBuildingId[] {
  const taken = new Set(state.lots.map((l) => l.building).filter((b): b is LotBuildingId => Boolean(b)));
  const ids: LotBuildingId[] = ["store", "smokehouse", "thrallhut", "bunkhouse", "workshop", "hearthhouse"];
  return ids.filter((id) => id === "store" || !taken.has(id));
}

const LOT_LABOR: Record<string, number> = {
  store: 2,
  smokehouse: 3,
  thrallhut: 3,
  bunkhouse: 4,
  workshop: 5,
  hearthhouse: 3,
};

export function lotIsDone(lot: { building: string | null; prog: number }): boolean {
  if (!lot.building) return false;
  return lot.prog >= (LOT_LABOR[lot.building] ?? 99);
}

export function slavePrice(p: Person): number {
  let base = 0;
  if (p.sex === "f") {
    if (p.beauty <= 2) base = 6;
    else if (p.beauty <= 4) base = 13;
    else if (p.beauty === 5) base = 24;
    else if (p.beauty === 6) base = 36;
    else base = 52;
  } else if (p.beauty <= 2) base = 4;
  else if (p.beauty <= 4) base = 10;
  else if (p.beauty === 5) base = 17;
  else base = 26;
  if (p.race === "goblin") base -= 3;
  if (p.race === "orc") base -= 6;
  if (p.race === "elf") base += 12;
  if (p.race === "dwarf") base += 6;
  if (p.hurt > 0) base = Math.floor(base / 2);
  if (p.collar && p.cuffs) base += 2;
  if (p.race === "orc" && p.beauty <= 2) return 0;
  return Math.max(2, base);
}

export function needSecondStore(state: GameState): boolean {
  return Boolean(state.hut && state.sheds < 2 && !hasBuilding(state, "store") && !hasBuilding(state, "thrallhut"));
}

export function fishGuard(state: GameState): Person | undefined {
  return state.people.find(
    (p) => p.alive && p.status === "free" && !p.guest && p.job === "fish" && p.id !== "player" && p.hurt <= 3,
  );
}

export function slaveJobLine(p: Person, state: GameState): string {
  if (p.job === "water") return `${p.name} carries water.`;
  if (p.job === "hall") return `${p.name} does the dirty hall work.`;
  if (p.job === "wood") return `${p.name} hauls timber.`;
  if (p.job === "smoke") return `${p.name} tends the smoke-racks.`;
  if (p.job === "fish") {
    const g = fishGuard(state);
    return g
      ? `${p.name} works the lines under ${g.name}.`
      : `${p.name} is on the dock. No free hand on the lines.`;
  }
  if (p.job === "idle") return `${p.name} sits idle.`;
  return `${p.name} is at ${p.job}.`;
}

export function needsLeather(state: GameState): boolean {
  return slaves(state).some((p) => !p.collar || !p.cuffs);
}

export function jobsFor(p: Person, state: GameState): Job[] {
  if (p.guest || p.id === "player") return [];
  if (p.status === "slave") {
    const jobs: Job[] = ["idle", "hall", "wood", "water", "fish"];
    if (hasBuilding(state, "smokehouse")) jobs.push("smoke");
    return jobs;
  }
  const jobs: Job[] = ["idle", "hall", "fish", "wood"];
  if (p.job === "explore") jobs.push("explore");
  if (!state.exploreOpen || state.sheds === 0 || (state.hut && state.sheds < 2)) jobs.push("shed");
  if (slaves(state).length > 0 || state.hut || hasBuilding(state, "thrallhut")) jobs.push("hut");
  const storeOk = state.hut ? state.sheds >= 2 : state.sheds >= 1;
  if (!state.palisade && storeOk && state.oswin >= 1) jobs.push("wall");
  else if (state.palisade && !state.watchPost) jobs.push("wall");
  if (state.lots.some((l) => l.building && !lotIsDone(l))) jobs.push("lot");
  if (hasBuilding(state, "smokehouse")) jobs.push("smoke");
  if (hasBuilding(state, "workshop")) jobs.push("craft");
  if (hasBuilding(state, "hearthhouse")) jobs.push("hearth");
  if (state.exploreOpen) jobs.push("hunt");
  if (p.id === "aldred" && state.exploreOpen && !jobs.includes("explore")) jobs.push("explore");
  if (p.id === "osric" && (p.job === "leather" || (needsLeather(state) && state.hide >= 1))) jobs.push("leather");
  if (!jobs.includes(p.job) && p.job !== "idle") jobs.push(p.job);
  return jobs;
}

export const JOBS: { id: Job; label: string }[] = [
  { id: "idle", label: "Idle" },
  { id: "hall", label: "Hall" },
  { id: "fish", label: "Fish" },
  { id: "wood", label: "Wood" },
  { id: "shed", label: "Store" },
  { id: "hut", label: "Guard hut" },
  { id: "explore", label: "Ranging" },
  { id: "wall", label: "Wall" },
  { id: "lot", label: "Lot" },
  { id: "water", label: "Water" },
  { id: "leather", label: "Leather" },
  { id: "smoke", label: "Smoke" },
  { id: "craft", label: "Craft" },
  { id: "hearth", label: "Hearth" },
  { id: "hunt", label: "Hunt" },
];

export function jobLabel(id: Job, state: GameState): string {
  if (id === "hut" && captiveHome(state) === "cage") return "Guard cage";
  return JOBS.find((j) => j.id === id)?.label ?? id;
}

export const SHOP: { id: "food" | "wood" | "hide" | "iron" | "nails"; name: string; cost: number; note: string }[] = [
  { id: "food", name: "Cask of meal", cost: 4, note: "+10 food" },
  { id: "wood", name: "Cut timber", cost: 3, note: "+2 wood" },
  { id: "hide", name: "Hide", cost: 4, note: "+1 hide" },
  { id: "iron", name: "Bar of iron", cost: 6, note: "+1 iron" },
  { id: "nails", name: "Nails", cost: 5, note: "−1 labor on a build" },
];

export const SELL: { id: "smoked" | "hide" | "wood" | "iron"; name: string; qty: number; pay: number; note: string }[] = [
  { id: "smoked", name: "Smoked sides", qty: 4, pay: 3, note: "4 smoked for 3 silver" },
  { id: "hide", name: "Hide", qty: 1, pay: 2, note: "1 hide for 2 silver" },
  { id: "wood", name: "Cut timber", qty: 2, pay: 1, note: "2 wood for 1 silver" },
  { id: "iron", name: "Bar of iron", qty: 1, pay: 3, note: "1 iron for 3 silver" },
];

export function hydratePerson(raw: Partial<Person> & Pick<Person, "id" | "name">): Person {
  const fromStart = startingHousehold("You", DEFAULT_STATS).find((p) => p.id === raw.id);
  const fromHanger = hangerOf(raw.id);
  return basePerson({ ...(fromStart ?? fromHanger ?? {}), ...raw, id: raw.id, name: raw.name });
}

export function validateStats(stats: CoreStats): CoreStats {
  const keys: (keyof CoreStats)[] = ["str", "agi", "int", "cha", "end"];
  const next: CoreStats = { ...DEFAULT_STATS };
  keys.forEach((k) => {
    next[k] = clamp(Math.round(stats[k] ?? DEFAULT_STATS[k]), 4, 8);
  });
  return next;
}
