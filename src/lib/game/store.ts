import { create } from "zustand";
import { initialState, reduce } from "./engine";
import { generateCaptive, hydratePerson } from "./people";
import type { GameAction, GameState, Lot, LotId, Person, Race } from "./types";
import { isLotId } from "./types";

const KEY = "ashenfall-v082";
const OLD_KEYS = ["ashenfall-v081", "ashenfall-v080", "ashenfall-v079", "ashenfall-v078", "ashenfall-v077", "ashenfall-v076", "ashenfall-v075", "ashenfall-v074", "ashenfall-v073", "ashenfall-v072", "ashenfall-v071", "ashenfall-v070", "ashenfall-v069", "ashenfall-v068", "ashenfall-v067", "ashenfall-v066", "ashenfall-v065", "ashenfall-v064", "ashenfall-v063", "ashenfall-v062", "ashenfall-v061", "ashenfall-v060", "ashenfall-v059", "ashenfall-v058", "ashenfall-v057", "ashenfall-v056", "ashenfall-v055", "ashenfall-v054", "ashenfall-v053", "ashenfall-v052", "ashenfall-v051", "ashenfall-v050", "ashenfall-v049", "ashenfall-v048", "ashenfall-v047", "ashenfall-v046", "ashenfall-v045", "ashenfall-v044", "ashenfall-v043", "ashenfall-v042", "ashenfall-v041", "ashenfall-v040", "ashenfall-v039", "ashenfall-v038", "ashenfall-v037", "ashenfall-v036", "ashenfall-v035", "ashenfall-v034", "ashenfall-v033", "ashenfall-v032", "ashenfall-v031", "ashenfall-v030", "ashenfall-v029", "ashenfall-v028", "ashenfall-v027", "ashenfall-v026", "ashenfall-v025", "ashenfall-v024", "ashenfall-v023", "ashenfall-v022", "ashenfall-v021", "ashenfall-v020", "ashenfall-v019", "ashenfall-v018", "ashenfall-v017", "ashenfall-v016", "ashenfall-v015", "ashenfall-v014", "ashenfall-v013", "ashenfall-v012", "ashenfall-v011", "ashenfall-v010", "ashenfall-v009", "ashenfall-v008", "ashenfall-v007", "ashenfall-v006", "ashenfall-v005", "ashenfall-v004", "ashenfall-v003", "ashenfall-v002", "ashenfall-v001"];

function asGame(s: GameState): GameState {
  return reduce(s, { type: "hydrate", state: s });
}

function isRace(v: unknown): v is Race {
  return v === "goblin" || v === "orc" || v === "elf" || v === "dwarf";
}

function isPendingFight(v: unknown): v is GameState["pendingFight"] {
  if (!v || typeof v !== "object") return false;
  const f = v as { race?: unknown; weight?: unknown };
  const raceOk = isRace(f.race) || f.race === "troll";
  const weightOk = f.weight === "light" || f.weight === "even" || f.weight === "heavy";
  return raceOk && weightOk;
}

function normalizeLots(raw: unknown, second: boolean): Lot[] {
  const empty = (id: LotId): Lot => ({ id, building: null, prog: 0 });
  const found = new Map<LotId, Lot>();
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== "object") continue;
      const r = row as { id?: unknown; building?: unknown; prog?: unknown };
      if (typeof r.id !== "string" || !isLotId(r.id)) continue;
      found.set(r.id, {
        id: r.id,
        building: typeof r.building === "string" ? (r.building as Lot["building"]) : null,
        prog: typeof r.prog === "number" ? r.prog : 0,
      });
    }
  }
  const ids: LotId[] = second || found.has("c") || found.has("d") ? ["a", "b", "c", "d"] : ["a", "b"];
  return ids.map((id) => found.get(id) ?? empty(id));
}

function migrate(raw: Record<string, unknown>): GameState {
  const base = initialState();
  const peopleIn = Array.isArray(raw.people) ? (raw.people as Partial<Person>[]) : [];
  const people = peopleIn
    .filter((p) => p && typeof p.id === "string" && typeof p.name === "string")
    .map((p) => hydratePerson({ ...p, id: p.id as string, name: p.name as string }));

  const captive = raw.captive as { race?: unknown } | null | undefined;
  if (captive && isRace(captive.race) && !people.some((p) => p.status === "slave")) {
    const thrall = generateCaptive(captive.race);
    if (raw.leather) thrall.collar = true;
    people.push(thrall);
  }

  if (raw.wounded) {
    const you = people.find((p) => p.id === "player");
    if (you && you.hurt < 3) you.hurt = 3;
  }

  const settlersAsking =
    Boolean(raw.settlersAsk) ||
    (Array.isArray(raw.choices) &&
      (raw.choices as { id?: unknown }[]).some((c) => typeof c.id === "string" && c.id.startsWith("settlers_")));

  const merged: GameState = {
    ...base,
    ...raw,
    version: 82,
    people: people.length ? people : base.people,
    nails: typeof raw.nails === "number" ? raw.nails : 0,
    smoked: typeof raw.smoked === "number" ? raw.smoked : 0,
    toolsDays: typeof raw.toolsDays === "number" ? raw.toolsDays : 0,
    hearthTended: Boolean(raw.hearthTended),
    settlersAsk: settlersAsking,
    settlersLanded: settlersAsking ? false : Boolean(raw.settlersLanded),
    raidHits: typeof raw.raidHits === "number" ? raw.raidHits : 0,
    huntSign: Boolean(raw.huntSign),
    huntHits: typeof raw.huntHits === "number" ? raw.huntHits : 0,
    elfSign: Boolean(raw.elfSign),
    elfGrudge: typeof raw.elfGrudge === "number" ? raw.elfGrudge : 0,
    dwarfSign: Boolean(raw.dwarfSign),
    dwarfGrudge: typeof raw.dwarfGrudge === "number" ? raw.dwarfGrudge : 0,
    trollSign: Boolean(raw.trollSign),
    trollHits: typeof raw.trollHits === "number" ? raw.trollHits : 0,
    oswinDays: typeof raw.oswinDays === "number" ? raw.oswinDays : 0,
    oswinGoneOn: typeof raw.oswinGoneOn === "number" ? raw.oswinGoneOn : 0,
    oswinBuys: typeof raw.oswinBuys === "number" ? raw.oswinBuys : 0,
    leakyShed: Boolean(raw.leakyShed),
    saewynReturn: Boolean(raw.saewynReturn),
    saewynTalk: Boolean(raw.saewynTalk),
    saewynWarm: Boolean(raw.saewynWarm),
    saewynDays: typeof raw.saewynDays === "number" ? raw.saewynDays : 0,
    saewynLeftOn: typeof raw.saewynLeftOn === "number" ? raw.saewynLeftOn : 0,
    saewynBought: Boolean(raw.saewynBought),
    hutAsk: Boolean(raw.hutAsk),
    pairAsk: Boolean(raw.pairAsk),
    namedPair: raw.namedPair === "house" || raw.namedPair === "hands" || raw.namedPair === "hold" ? raw.namedPair : null,
    pairDone: Boolean(raw.pairDone),
    pair2Ask: Boolean(raw.pair2Ask) || (Boolean(raw.pairDone) && !Boolean(raw.pair2Done) && !Boolean(raw.pair2Ask) && !(Array.isArray(raw.lots) && (raw.lots as { id?: string }[]).some((l) => l.id === "c"))),
    namedPair2: raw.namedPair2 === "house" || raw.namedPair2 === "hands" || raw.namedPair2 === "hold" ? raw.namedPair2 : null,
    pair2Done: Boolean(raw.pair2Done),
    workshop: Boolean(raw.workshop),
    watchPostProg: typeof raw.watchPostProg === "number" ? raw.watchPostProg : 0,
    escaped: raw.escaped && typeof raw.escaped === "object" ? (raw.escaped as GameState["escaped"]) : null,
    pendingTake: isRace(raw.pendingTake) ? raw.pendingTake : null,
    pendingFight: isPendingFight(raw.pendingFight) ? raw.pendingFight : null,
    pendingLeave: typeof raw.pendingLeave === "string" ? raw.pendingLeave : null,
    pendingEscape: typeof raw.pendingEscape === "string" ? raw.pendingEscape : null,
    aldredWaiting:
      typeof raw.aldredWaiting === "boolean"
        ? raw.aldredWaiting
        : Number(raw.oswin) >= 2 &&
          people.some((p) => p.id === "cuthwin") &&
          people.some((p) => p.id === "hilda") &&
          !people.some((p) => p.id === "aldred"),
    aldredRange:
      Boolean(raw.aldredRange) ||
      people.some((p) => p.id === "aldred" && p.alive && p.job === "explore"),
    lots: normalizeLots(raw.lots, Boolean(raw.pairDone) || Boolean(raw.pair2Ask) || Boolean(raw.pair2Done)),
    contacts: raw.contacts && typeof raw.contacts === "object" ? (raw.contacts as Record<string, boolean>) : {},
    scene: Array.isArray(raw.scene) ? (raw.scene as GameState["scene"]) : null,
  };
  if (merged.choices?.length && !merged.scene?.length) {
    const last = merged.log[merged.log.length - 1];
    merged.scene = last ? [{ text: last.text }] : [{ text: "What now?" }];
  }
  return asGame(merged);
}

function load(): GameState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(KEY) ?? OLD_KEYS.reduce<string | null>((found, k) => found ?? localStorage.getItem(k), null);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return initialState();
    return migrate(parsed);
  } catch {
    return initialState();
  }
}

function persist(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

type Store = GameState & {
  hydrated: boolean;
  hydrate: () => void;
  dispatch: (action: GameAction) => void;
};

export const useGame = create<Store>((set, get) => ({
  ...initialState(),
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const loaded = load();
    set({ ...loaded, hydrated: true });
  },
  dispatch: (action) => {
    const cur = get();
    const base = initialState();
    const snapshot = { ...base } as GameState;
    (Object.keys(base) as (keyof GameState)[]).forEach((k) => {
      const v = cur[k];
      if (v !== undefined) (snapshot as unknown as Record<string, unknown>)[k as string] = v;
    });
    const next = reduce(snapshot, action);
    persist(next);
    set({ ...next, hydrated: true });
  },
}));
