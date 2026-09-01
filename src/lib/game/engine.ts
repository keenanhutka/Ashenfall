import {
  bloodHoldLine,
  captiveHome,
  captiveSlots,
  crowding,
  fishGuard,
  generateCaptive,
  hangerOf,
  hasBuilding,
  hallSleepers,
  isHand,
  isKin,
  lotIsDone,
  recapture,
  SHOP,
  SELL,
  slavePrice,
  slaves,
  startingHousehold,
  validateStats,
} from "./people";
import {
  partyVoice,
  VOICE_COAST_THIEF,
  VOICE_COAST_BARS,
  VOICE_TRAIL_MOSS,
  VOICE_WOOD_BIND,
  VOICE_CUT_BIND,
  VOICE_STREAM_CAGE,
  VOICE_DWARF,
  VOICE_DWARF_NIGHT,
  VOICE_ELF,
  VOICE_ELF_NIGHT,
  VOICE_FIGHT,
  VOICE_GOBLIN,
  VOICE_HALL_RAID,
  VOICE_HUNT,
  VOICE_ORC,
  VOICE_RAID,
  VOICE_TROLL,
  VOICE_TROLL_NIGHT,
  VOICE_YARD,
  yardWatchLine,
} from "./scene";
import type {
  Choice,
  CoreStats,
  GameAction,
  GameState,
  Job,
  Lot,
  LotAct,
  LotBuildingId,
  LotId,
  NamedPair,
  Person,
  Race,
  RouteId,
  SceneLine,
  ShopItem,
  ShopSell,
  WorkKind,
} from "./types";

export { hasBuilding, JOBS, SHOP, SELL, lotIsDone } from "./people";

export const BUILD_NEED = { shed: 2, wall: 8, post: 2 } as const;

function toward(prog: number, cap: number, raw: number): number {
  return Math.max(0, Math.min(raw, cap - prog));
}

export const ROUTES: { id: RouteId; name: string; first: Race | "troll"; hint: string }[] = [
  {
    id: "coast",
    name: "Follow the coast",
    first: "goblin",
    hint: "Scraps and small tracks"
  },
  {
    id: "trails",
    name: "Take the game trails",
    first: "orc",
    hint: "Hunters' ground"
  },
  {
    id: "timber",
    name: "Push into the old timber",
    first: "elf",
    hint: "You are watched first"
  },
  {
    id: "fold",
    name: "Climb the rocky fold",
    first: "dwarf",
    hint: "Fresh chips of stone"
  },
  {
    id: "stream",
    name: "Follow the stream to the sea",
    first: "troll",
    hint: "Fish-rot on the wind"
  }
];
export function living(state: GameState): Person[] {
  return state.people.filter((p) => p.alive && p.id !== "player" && !p.guest);
}
export function mouths(state: GameState): number {
  return state.people.filter((p) => p.alive).length;
}
export function findPerson(state: GameState, id: string): Person | undefined {
  return state.people.find((p) => p.id === id);
}

export type EscapeBand = "low" | "mid" | "high" | "near";

export function hutIsGuarded(s: GameState): boolean {
  return s.people.some((p) => p.alive && p.status === "free" && p.job === "hut");
}

export function escapeRisk(s: GameState, p: Person, hutGuard = hutIsGuarded(s)): number {
  let risk = 0.2;
  if (!s.hut) risk = 0.45;
  if (hasBuilding(s, "thrallhut")) risk = 0.12;
  if (s.watch === "none") risk += 0.35;
  const w = s.watch === "player" ? findPerson(s, "player") : findPerson(s, s.watch);
  if (s.watch === "wulfric") risk += 0.15;
  if (w && w.hurt > 0) risk += 0.12;
  if (w && w.hurt > 3) risk += 0.2;
  if (s.watch === "osric" || s.watch === "player") risk -= 0.15;
  if (w && w.end >= 7) risk -= 0.05;
  if (w && w.int <= 4 && s.watch !== "osric") risk += 0.05;
  const leather = (p.collar ? 0.12 : 0) + (p.cuffs ? 0.08 : 0) + (p.collar && p.cuffs ? 0.04 : 0);
  risk -= s.watch === "none" ? leather * 0.25 : leather;
  if (s.hut) risk -= 0.08;
  if (s.palisade) risk -= 0.1;
  if (s.watchPost) risk -= 0.08;
  if (hasBuilding(s, "thrallhut")) risk -= 0.08;
  if (hutGuard) risk -= 0.06;
  if (p.job === "wood" || p.job === "water" || p.job === "hall") risk -= 0.04;
  risk += crowding(s) * 0.04;
  return Math.max(0.02, Math.min(0.92, risk));
}

export function escapeBand(risk: number): EscapeBand {
  if (risk < 0.15) return "low";
  if (risk < 0.3) return "mid";
  if (risk < 0.5) return "high";
  return "near";
}

function bandLine(band: EscapeBand, watched: boolean, home: "cage" | "hut" | "hall" = "hut"): string {
  const hold = home === "cage" ? "cage" : home === "hall" ? "hall" : "hut";
  const bar = home === "cage" ? "bars" : home === "hall" ? "door" : "bar";
  if (!watched) {
    if (band === "low") return home === "hall" ? "No watch. Luck is the roof." : `No watch. Luck is the ${bar}.`;
    if (band === "mid") return "No watch. They will try the yard.";
    return `No watch. The ${hold} will not hold.`;
  }
  if (band === "low") return home === "hall" ? "This roof will hold tonight." : `The ${bar} will hold tonight.`;
  if (band === "mid") return `They will try the ${bar} tonight.`;
  if (band === "high") return `The ${hold} is a hope.`;
  return `The ${hold} will not hold.`;
}

export function escapeLineFor(s: GameState, p: Person): string {
  return bandLine(escapeBand(escapeRisk(s, p)), s.watch !== "none", captiveHome(s));
}

export function escapeLine(s: GameState): string | null {
  const held = slaves(s);
  if (!held.length) return null;
  const worst = Math.max(...held.map((p) => escapeRisk(s, p)));
  return bandLine(escapeBand(worst), s.watch !== "none", captiveHome(s));
}

export function escapeWarns(s: GameState): boolean {
  const held = slaves(s);
  if (!held.length) return false;
  const worst = Math.max(...held.map((p) => escapeRisk(s, p)));
  const band = escapeBand(worst);
  return s.watch === "none" || band === "high" || band === "near";
}

function holdCopy(s: GameState) {
  const home = captiveHome(s);
  if (home === "cage") {
    return {
      back: "Drive them back to the bars",
      holds: "The bars still hold.",
      open: "Dawn: the cage is open",
      remember: "The cage will remember the last time.",
      path: "the bars",
      hunt: "The bars will have to hold",
      dusk: "the bars",
      ifWill: "cage",
      oswinShock: "He is not shocked by a proper cage. He offers the home market, and stores for silver.",
      godric: "They got past the bars. Not past us.",
      eadgyth: "The bars or the trees. Choose.",
    };
  }
  if (home === "hut") {
    return {
      back: "Drive them back to the barred store",
      holds: "The bar still holds.",
      open: "Dawn: the hut is open",
      remember: "The hut will remember the last time.",
      path: "the barred store",
      hunt: "The hut will have to hold",
      dusk: "the hut",
      ifWill: "hut",
      oswinShock: "He is not shocked by a barred hut. He offers the home market, and stores for silver.",
      godric: "They got past the bar. Not past us.",
      eadgyth: "The bar or the trees. Choose.",
    };
  }
  return {
    back: "Drive them back to the hall",
    holds: "This roof still holds.",
    open: "Dawn: the hall is open",
    remember: "This roof will remember the last time.",
    path: "the hall",
    hunt: "This roof will have to hold",
    dusk: "the hall",
    ifWill: "roof",
    oswinShock: "He is not shocked by a prisoner among the free. He offers the home market, and stores for silver.",
    godric: "They got past the door. Not past us.",
    eadgyth: "The hall or the trees. Choose.",
  };
}

export function takeHomeLabel(s: GameState, name?: string): string {
  const home = captiveHome(s);
  if (home === "cage") return name ? `Take ${name} to the bars` : "Take them to the bars";
  if (home === "hut") return name ? `Take ${name} to the barred store` : "Take them to the barred store";
  return name ? `Take ${name}` : "Take them home";
}

export function driveBackLabel(s: GameState): string {
  return holdCopy(s).back;
}

export function catchGodricLine(s: GameState): string {
  return holdCopy(s).godric;
}

export function catchEadgythLine(s: GameState): string {
  return holdCopy(s).eadgyth;
}

export function stillHoldsLine(s: GameState): string {
  return holdCopy(s).holds;
}

export function takePathLine(s: GameState): string {
  return holdCopy(s).path;
}

export function initialState(): GameState {
  return {
    version: 82,
    started: false,
    name: "Eadward",
    house: "Ashenfall",
    day: 1,
    ap: 6,
    tired: false,
    food: 48,
    wood: 4,
    hide: 2,
    iron: 1,
    silver: 12,
    rope: 2,
    nails: 0,
    smoked: 0,
    toolsDays: 0,
    hearthTended: false,
    renown: 0,
    sheds: 0,
    hut: false,
    leakyShed: false,
    palisade: false,
    exploreOpen: false,
    explores: 0,
    contacts: {},
    oswin: 0,
    oswinDays: 0,
    oswinGoneOn: 0,
    oswinBuys: 0,
    wordOut: false,
    nightSign: false,
    raidOnce: false,
    raidHits: 0,
    huntSign: false,
    huntHits: 0,
    elfSign: false,
    elfGrudge: 0,
    dwarfSign: false,
    dwarfGrudge: 0,
    trollSign: false,
    trollHits: 0,
    gameOver: false,
    endMessage: "",
    people: startingHousehold("You", {
      str: 6,
      agi: 6,
      int: 6,
      cha: 7,
      end: 6
    }),
    watch: "osric",
    party: [],
    log: [],
    logSeq: 0,
    choices: null,
    scene: null,
    partyRoute: null,
    shedProg: 0,
    wallProg: 0,
    watchPost: false,
    watchPostProg: 0,
    lots: [{
      id: "a",
      building: null,
      prog: 0
    }, {
      id: "b",
      building: null,
      prog: 0
    }],
    starve: 0,
    settlersHint: false,
    settlersLanded: false,
    settlersAsk: false,
    pendingTake: null,
    pendingFight: null,
    pendingLeave: null,
    pendingEscape: null,
    aldredWaiting: false,
    aldredRange: false,
    saewynDays: 0,
    saewynTalk: false,
    saewynReturn: false,
    saewynWarm: false,
    saewynLeftOn: 0,
    saewynBought: false,
    hutAsk: false,
    pairAsk: false,
    namedPair: null,
    pairDone: false,
    pair2Ask: false,
    namedPair2: null,
    pair2Done: false,
    escaped: null,
    workshop: false
  };
}
function clone(state: GameState): GameState {
  return {
    ...state,
    people: state.people.map((p) => ({ ...p })),
    contacts: { ...state.contacts },
    log: [...state.log],
    choices: state.choices ? state.choices.map((c) => ({ ...c })) : null,
    scene: state.scene ? state.scene.map((l) => ({ ...l })) : null,
    party: [...state.party],
    lots: state.lots.map((l) => ({ ...l })),
    escaped: state.escaped ? { ...state.escaped } : null,
    pendingFight: state.pendingFight ? { ...state.pendingFight } : null,
  };
}
function log(state: GameState, text: string, kind: "normal" | "warn" | "ok" = "normal") {
  state.logSeq += 1;
  state.log.push({
    id: state.logSeq,
    text,
    kind
  });
  if (state.log.length > 90) state.log = state.log.slice(-90);
}
function namesOf(list: string[]): string {
  if (list.length <= 2) return list.join(" and ");
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}
function setChoices(state: GameState, choices: Choice[], extra: SceneLine[] = []) {
  state.choices = choices;
  const last = state.log[state.log.length - 1];
  const lines: SceneLine[] = [];
  if (last) lines.push({ text: last.text });
  lines.push(...extra);
  state.scene = lines.length ? lines : [{ text: "What now?" }];
}
function clearChoices(state: GameState) {
  state.choices = null;
  state.scene = null;
}
export function reduce(state: GameState, action: GameAction): GameState {
  if (action.type === "hydrate") return clone(action.state);
  if (action.type === "reset") return initialState();
  const s = clone(state);
  if (s.gameOver && action.type !== "start") return s;
  switch (action.type) {
    case "start": return begin(action.name, action.house, action.stats);
    case "setJob": {
      const p = findPerson(s, action.id);
      if (p && p.id !== "player" && !p.guest) {
        const prev = p.job;
        p.job = action.job;
        if (p.id === "aldred") {
          s.aldredRange = action.job === "explore";
          if (s.aldredRange && prev !== "explore") {
            log(
              s,
              p.hurt > 3
                ? "Aldred takes the order. The wound will not carry a spear until it closes."
                : "Aldred takes a spear at dawn. He will walk his own path until dusk.",
            );
          } else if (prev === "explore" && action.job !== "explore") {
            log(s, "Aldred puts the spear down. He will stay in the yard.");
          }
        }
      }
      return s;
    }
    case "setWatch": {
      if (action.id === "player") {
        const you = findPerson(s, "player");
        if ((you?.hurt ?? 0) > 3) return s;
      } else if (action.id !== "none") {
        const w = findPerson(s, action.id);
        if (!w || !w.alive || w.hurt > 3 || w.status !== "free") return s;
      }
      s.watch = action.id;
      return s;
    }
    case "work": return doWork(s, action.kind);
    case "inspect": return inspect(s, action.place);
    case "endDay":
      if (s.choices || s.partyRoute) return s;
      return endDay(s);
    case "beginExplore": return beginExplore(s, action.routeId);
    case "confirmParty": return confirmParty(s, action.ids);
    case "cancelParty":
      s.partyRoute = null;
      return s;
    case "choose": return resolveChoice(s, action.id);
    case "startLot": return startLot(s, action.lotId, action.building);
    case "askName": return askName(s);
    case "workLot": return workLot(s, action.lotId);
    case "lotAct": return lotAct(s, action.lotId, action.act);
    case "saewyn":
      return action.id === "saewyn_stock" ? openSaewynStock(s) : openSaewynTalk(s);
    case "hunt": return huntRunaway(s);
    case "buy": return buyGoods(s, action.item);
    case "sell": return sellGoods(s, action.item);
    case "sellPerson": return sellThrall(s, action.id);
    case "restrain": return restrain(s, action.id, action.kind);
    default: return s;
  }
}
function begin(name: string, house: string, stats: CoreStats): GameState {
  const s = initialState();
  s.started = true;
  s.name = name.trim() || "Eadward";
  s.house = house.trim() || "Ashenfall";
  const st = validateStats(stats);
  s.people = startingHousehold(s.name, st);
  log(s, `You are ${s.name} of house ${s.house}, heir of a deposed king. The crossing is done. One hall. One dock. Six free Æleric and a thin store.`);
  log(s, "Eadgyth: meal in the sleeping-room is a fool's store. Cut a shed. Then you may wander.");
  return s;
}
function spendAp(s: GameState, n: number): boolean {
  if (s.ap < n || s.choices || s.partyRoute) return false;
  s.ap -= n;
  return true;
}
function doWork(s: GameState, kind: WorkKind): GameState {
  if (kind === "collar" || kind === "cuffs") {
    const held = slaves(s)[0];
    if (!held || s.hide < 1) return s;
    return restrain(s, held.id, kind);
  }
  if (kind === "wall") {
    if (!wallReady(s) || s.palisade || s.wallProg >= BUILD_NEED.wall) return s;
    if (s.wood < 1) {
      log(s, "No wood for stakes.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    s.wood -= 1;
    const need = BUILD_NEED.wall - s.wallProg;
    let gain = 1;
    if (need > 1) gain += spendNail(s);
    s.wallProg += toward(s.wallProg, BUILD_NEED.wall, gain);
    log(s, `You raise palisade stakes. Wall ${s.wallProg}/${BUILD_NEED.wall}.`);
    if (s.wallProg >= BUILD_NEED.wall) {
      completePalisade(s);
      maybePairAsk(s);
    }
    return s;
  }
  if (kind === "post") {
    if (!s.palisade || s.watchPost || s.watchPostProg >= BUILD_NEED.post) return s;
    if (s.wood < 1) {
      log(s, "No wood for a watch-post.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    s.wood -= 1;
    const need = BUILD_NEED.post - s.watchPostProg;
    let gain = 1;
    if (need > 1) gain += spendNail(s);
    s.watchPostProg += toward(s.watchPostProg, BUILD_NEED.post, gain);
    log(s, `You raise a watch-post. ${s.watchPostProg}/${BUILD_NEED.post}.`);
    if (s.watchPostProg >= BUILD_NEED.post) {
      s.watchPost = true;
      log(s, "The post stands on the wall-walk. Night will see farther.", "ok");
    }
    return s;
  }
  if (kind === "shed") {
    if (s.shedProg >= BUILD_NEED.shed) {
      log(s, "The frame is enough. Keep the rest of the day.");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    const need = BUILD_NEED.shed - s.shedProg;
    let gain = 1;
    if (need > 1) gain += spendNail(s);
    s.shedProg += toward(s.shedProg, BUILD_NEED.shed, gain);
    log(s, `You set timber. ${s.shedProg}/${BUILD_NEED.shed}. Assigned hands will add theirs at dusk.`);
    return s;
  }
  if (kind === "game") {
    if (!s.exploreOpen) {
      log(s, "Eadgyth will not have you hunting until a store stands.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    return playerHunt(s);
  }
  if (!spendAp(s, 1)) return s;
  if (kind === "fish") {
    s.food += 1;
    log(s, "You work the dock. The catch is a little better.");
  } else if (kind === "wood") {
    s.wood += 1 + (s.toolsDays > 0 ? 1 : 0);
    log(s, s.toolsDays > 0 ? "You cut a load. The workshop edge bites deeper." : "You cut a load from the near trees.");
  } else log(s, "You walk the rocks below the dock. Only gulls and your own hall-smoke. Eadgyth wants a shed before you go farther.");
  return s;
}
function spendNail(s: GameState): number {
  if (s.nails < 1) return 0;
  s.nails -= 1;
  log(s, "A handful of Oswin's nails saves a labor.");
  return 1;
}

function playerHunt(s: GameState): GameState {
  const you = findPerson(s, "player");
  s.food += 1;
  const hideChance = 0.28 + ((you?.agi ?? 6) / 50);
  if (Math.random() < hideChance) {
    s.hide += 1;
    log(s, "You take a small kill on the near trails. Meat and a hide.");
  } else {
    log(s, "You hunt the near trails. A hare. No hide worth the knife.");
  }
  if (s.contacts.orc && Math.random() < 0.1) {
    markHunt(s);
    log(s, "The game-trail knows the hall. Watch tonight.", "warn");
  }
  return s;
}

function runHunt(s: GameState, hunters: Person[]) {
  if (!hunters.length) return;
  let meat = 0;
  let hides = 0;
  hunters.forEach((p) => {
    p.tired = true;
    meat += 1 + (p.agi >= 7 ? 1 : 0);
    if (Math.random() < 0.3 + p.agi * 0.03) hides += 1;
  });
  s.food += meat;
  s.hide += hides;
  const names = namesOf(hunters.map((p) => p.name));
  if (hides) log(s, `${names} hunt the near trails. +${meat} food, +${hides} hide.`);
  else log(s, `${names} hunt the near trails. +${meat} food. No hide.`);
  if (s.contacts.orc && Math.random() < 0.14) {
    markHunt(s);
    log(s, "The game-trail knows the hall. Watch tonight.", "warn");
  }
}
function runAldredRange(s: GameState, rangers: Person[]) {
  const p = rangers.find((x) => x.id === "aldred");
  if (!p || !s.aldredRange) return;
  if (s.party.includes("aldred")) return;
  p.tired = true;
  const weak = p.hurt > 0;
  const known: Array<"goblin" | "orc" | "elf" | "dwarf" | "troll"> = [];
  if (s.contacts.goblin) known.push("goblin");
  if (s.contacts.orc) known.push("orc");
  if (s.contacts.elf) known.push("elf");
  if (s.contacts.dwarf) known.push("dwarf");
  if (s.contacts.troll) known.push("troll");
  const roll = pickWeighted([
    { w: weak ? 2 : 3, v: "meat" as const },
    { w: 2, v: "hide" as const },
    { w: weak ? 3 : 2, v: "empty" as const },
    { w: weak ? 3 : 2, v: "cut" as const },
    { w: known.length ? 2 : 0, v: "sign" as const },
    { w: s.contacts.dwarf ? 1 : 0, v: "iron" as const },
    { w: 1, v: "story" as const },
  ]);
  if (roll === "meat") {
    const n = weak ? 1 : 1 + (p.agi >= 7 ? 1 : 0);
    s.food += n;
    if (!weak && Math.random() < 0.35) {
      s.hide += 1;
      log(s, `Aldred takes a spear alone. He comes in at dusk with a kill. +${n} food, +1 hide.`);
    } else {
      log(s, `Aldred takes a spear alone. He comes in at dusk with a kill. +${n} food.`);
    }
    return;
  }
  if (roll === "hide") {
    s.hide += 1;
    s.food += 1;
    log(s, "Aldred ranges the near timber. A hide and a little meat.");
    return;
  }
  if (roll === "empty") {
    log(s, "Aldred takes a spear. Cold trail. He comes home with burrs.");
    return;
  }
  if (roll === "cut") {
    p.hurt = Math.max(p.hurt, 3);
    if (!weak) {
      s.food += 1;
      log(s, "Aldred takes a spear alone. He comes in cut, a hare in the other hand. The timber answered.", "warn");
    } else {
      log(s, "Aldred takes a spear alone. He comes in cut. The timber answered.", "warn");
    }
    return;
  }
  if (roll === "iron") {
    s.iron += 1;
    s.renown += 1;
    log(s, "Aldred comes off the fold with a chip of worked iron. He did not stay. +1 Renown.");
    return;
  }
  if (roll === "story") {
    s.renown += 1;
    log(s, "Aldred ranges and comes home with a story worth telling. +1 Renown.", "ok");
    return;
  }
  const race = known[Math.floor(Math.random() * known.length)] ?? "goblin";
  s.renown += 1;
  if (race === "goblin") {
    s.nightSign = true;
    log(s, "Aldred follows small prints home. +1 Renown. Watch the water tonight.", "warn");
  } else if (race === "orc") {
    markHunt(s);
    log(s, "Aldred brings orc-sign. +1 Renown. The game-trail knows the hall.", "warn");
  } else if (race === "elf") {
    markElf(s);
    log(s, "Aldred found marks on the old timber. +1 Renown. They know the hall now.", "warn");
  } else if (race === "dwarf") {
    markDwarf(s);
    log(s, "Aldred was followed as far as the tree-line. +1 Renown. Stone-dust.", "warn");
  } else {
    markTroll(s);
    log(s, "Aldred will not take the stream-bank again. +1 Renown. The stink is on him.", "warn");
  }
}
function restrain(s: GameState, id: string, kind: "collar" | "cuffs"): GameState {
  const p = findPerson(s, id);
  if (!p || p.status !== "slave" || s.hide < 1) return s;
  if (kind === "collar" && p.collar) return s;
  if (kind === "cuffs" && p.cuffs) return s;
  if (!spendAp(s, 1)) return s;
  s.hide -= 1;
  if (kind === "collar") p.collar = true;
  else p.cuffs = true;
  const home = captiveHome(s);
  const where = home === "cage" ? " You take it to the bars." : home === "hut" ? " You take it to the first store." : " They still sleep this roof.";
  log(s, `You cut leather ${kind} for ${p.name}.${where} It will not watch the door.`);
  return s;
}
function fitLeather(s: GameState) {
  if (s.hide < 1) {
    log(s, "Osric waits on hide. The leather will not sit on air.", "warn");
    return;
  }
  const p = slaves(s).find((x) => !x.collar) ?? slaves(s).find((x) => !x.cuffs);
  if (!p) {
    log(s, "Osric looks at the yard. No throat left bare.");
    return;
  }
  s.hide -= 1;
  const kind = !p.collar ? "collar" : "cuffs";
  if (kind === "collar") p.collar = true;
  else p.cuffs = true;
  const home = captiveHome(s);
  const where = home === "cage" ? " He takes it to the bars." : home === "hut" ? " He takes it to the first store." : " They still sleep this roof.";
  log(s, `Osric cuts leather ${kind} for ${p.name}.${where} It will not watch the door.`);
}
function inspect(s: GameState, place: "hall" | "dock" | "shed" | "woods" | "wall" | "yard"): GameState {
  const held = slaves(s);
  if (place === "hall") {
    const fire = hasBuilding(s, "hearthhouse")
      ? " The fire lives in the hearth-house now."
      : " Eadgyth keeps the fire.";
    const floor = !hasBuilding(s, "bunkhouse")
      ? " Men still take the floor."
      : !hasBuilding(s, "hearthhouse")
        ? " Meal and fire are still underfoot."
        : "";
    const home = captiveHome(s);
    const names = held.map((p) => p.name).join(", ");
    const verb = held.length === 1 ? "sleeps" : "sleep";
    const heldLine = home === "cage" && held.length
      ? ` ${names} ${verb} under the proper bars, not this timber.`
      : home === "cage"
        ? " The proper cage stands empty of them."
        : home === "hut" && held.length
          ? ` ${names} ${verb} barred in the first store, not among the free.`
          : held.length
            ? " A prisoner among the free."
            : "";
    const press = home !== "hall" && held.length && crowding(s) === 0
      ? " The timber is not pressed of them."
      : "";
    log(s, `The hall leans but holds. ${hallSleepers(s).length} sleep under this roof. Meal is ${s.food}.${fire}${floor}${heldLine}${press}`);
  }
  else if (place === "dock") {
    const home = captiveHome(s);
    const names = held.map((p) => p.name).join(", ");
    const verb = held.length === 1 ? "sleeps" : "sleep";
    const inland = home === "cage" && held.length
      ? `${names} ${verb} inland of this plank, under the proper bars. The water-gate is for sails.`
      : home === "cage"
        ? "The proper cage stands inland. This plank is for sails."
        : home === "hut" && held.length
          ? `${names} ${verb} inland of this plank, barred in the first store. The water-gate is for sails.`
          : held.length
            ? "A prisoner among the free. The dock is not a cage."
            : "";
    if (s.trollSign) log(s, "The stink is on the water. Something huge has come down the stream. Watch the dock tonight.");
    else if (s.nightSign) log(s, "The pilings are scored. Something small came in the dark and will come again if no one watches.");
    else if (inland) log(s, inland);
    else if (s.settlersAsk) log(s, s.oswinDays > 0 ? "Oswin's stall is on the plank. A worn sail stands off it. Faces wait." : "A worn sail at the water-gate. Faces wait on the plank.");
    else if (findPerson(s, "saewyn")) log(s, "Saewyn's cloth is at the plank. A buyer, not a sail that stays.");
    else if (s.raidHits > 0) log(s, "The pilings remember them. Night-sign comes back if the cove is hunted.");
    else if (s.oswinDays > 0) log(s, "Oswin's sail is still on the water. He will take silver for stores.");
    else log(s, "A poor dock on a hard shore. Osric's lines are already wet.");
  }
  else if (place === "shed") {
    const line = escapeLine(s);
    if (hasBuilding(s, "thrallhut")) {
      const names = held.map((p) => p.name).join(", ");
      const sleep = held.length === 1 ? `${names} sleeps under the proper bars` : held.length ? `${names} sleep under the proper bars` : "";
      log(s, held.length
        ? `The first store is a larder again. ${sleep}. Watch is ${watchName(s)}.${line ? ` ${line}` : ""}`
        : `The first store is a larder again. The proper cage stands empty. Watch is ${watchName(s)}.`);
    }
    else if (s.hut && held.length) {
      log(s, `The store is a hut now. ${held.map((p) => p.name).join(", ")} barred inside. Watch is ${watchName(s)}${line ? `. ${line}` : ""}.`);
    }
    else if (s.sheds > 0) log(s, "The store-shed is dry enough. Flour and fish belong here, not underfoot.");
    else log(s, "No shed yet. Only stakes in the mud.");
  } else if (place === "wall") {
    const home = captiveHome(s);
    const names = held.map((p) => p.name).join(", ");
    const verb = held.length === 1 ? "sleeps" : "sleep";
    const inland = home === "cage" && held.length
      ? `${names} ${verb} inland of this ring, under the proper bars. The palisade is not a cage.`
      : home === "cage"
        ? "The proper cage stands inland. This timber is a ring, not a hold."
        : home === "hut" && held.length
          ? `${names} ${verb} inland of this ring, barred in the first store. The palisade is not a cage.`
          : held.length
            ? "A prisoner among the free. This timber is not a cage."
            : "";
    if (!s.palisade) log(s, "Stakes in the mud. A ring is not a wall yet.");
    else if (s.trollSign) log(s, "The post saw the stink on the water. Watch the dock tonight.");
    else if (s.nightSign) log(s, "The post saw small shapes at the water-gate. Watch tonight.");
    else if (s.huntSign) log(s, "The post saw heavy prints on the game-side. Watch tonight.");
    else if (s.elfSign) log(s, "The post saw marks on the old timber. Watch the tree-line tonight.");
    else if (s.dwarfSign) log(s, "The post saw stone-watchers at the tree-line. They followed you home.");
    else if (inland) log(s, inland);
    else if (s.watchPost) log(s, "Timber closes a yard. The post looks over the water-gate and the dock beyond.");
    else log(s, "Timber closes a yard. Night will see farther when a post stands.");
  } else if (place === "yard") {
    const home = captiveHome(s);
    const names = held.map((p) => p.name).join(", ");
    const verb = held.length === 1 ? "sleeps" : "sleep";
    const inland = home === "cage" && held.length
      ? `${names} ${verb} inland of this mud, under the proper bars. The yard is not a cage.`
      : home === "cage"
        ? "The proper cage stands inland. This mud is for timber."
        : home === "hut" && held.length
          ? `${names} ${verb} inland of this mud, barred in the first store. The yard is not a cage.`
          : held.length
            ? "A prisoner among the free. This mud is not a cage."
            : "";
    if (inland) log(s, inland);
    else if (s.sheds === 0) log(s, "Stakes in the mud. Eadgyth wants a store, not a cage in the open.");
    else if (s.hut) log(s, "The first store is barred. This mud is for timber, not for sleep.");
    else if (s.palisade) log(s, "Lots in the ring. Timber and mud. No one sleeps this yard.");
    else log(s, "A store stands. Mud and timber. No one sleeps this yard.");
  } else {
    const home = captiveHome(s);
    const names = held.map((p) => p.name).join(", ");
    const verb = held.length === 1 ? "sleeps" : "sleep";
    const inland = home === "cage" && held.length
      ? `${names} ${verb} inland of the wild, under the proper bars. The ranging is not a cage.`
      : home === "cage"
        ? "The proper cage stands inland. These trees are for ranging."
        : home === "hut" && held.length
          ? `${names} ${verb} inland of the wild, barred in the first store. The ranging is not a cage.`
          : held.length
            ? "A prisoner among the free. These trees are not a cage."
            : "";
    if (s.trollSign) log(s, "The stink has come down the water. Watch the dock tonight.");
    else if (s.elfSign) log(s, "Marks on the old timber. Watch the tree-line tonight.");
    else if (s.dwarfSign) log(s, "Stone-dust at the tree-line. They followed you home.");
    else if (s.huntSign) log(s, "The game-trails remember the hall. Watch tonight.");
    else if (inland) log(s, inland);
    else if (findPerson(s, "aldred")?.job === "explore") log(s, "Aldred took a spear at dawn. The timber will have him until dusk.");
    else if (s.exploreOpen) log(s, "Timber, trail, fold, stream, and coast. Hunt the near trails for hide, or range farther.");
    else log(s, "The trees wait. Eadgyth will not have you ranging until a store stands.");
  }
  return s;
}
export function watchName(s: GameState): string {
  if (s.watch === "none") return "no one";
  if (s.watch === "player") return "you";
  return findPerson(s, s.watch)?.name ?? "no one";
}
function beginExplore(s: GameState, routeId: RouteId): GameState {
  if (!s.exploreOpen || s.ap < 3 || s.choices) return s;
  const you = findPerson(s, "player");
  if ((you?.hurt ?? 0) > 3) {
    log(s, "The wound will not carry you into the trees.", "warn");
    return s;
  }
  s.partyRoute = routeId;
  log(s, `You mean to ${ROUTES.find((r) => r.id === routeId)?.name.toLowerCase() ?? "range"}. Who goes with you? Eadgyth said not alone the first times.`);
  return s;
}
function confirmParty(s: GameState, ids: string[]): GameState {
  if (!s.partyRoute || s.ap < 3) return s;
  const routeId = s.partyRoute;
  s.partyRoute = null;
  s.ap -= 3;
  s.explores += 1;
  const taken = ids.slice(0, 2).filter((id) => {
    const p = findPerson(s, id);
    return p && p.alive && p.id !== "player" && p.hurt < 7 && p.status === "free" && !p.guest;
  });
  s.party = taken;
  taken.forEach((id) => {
    const p = findPerson(s, id);
    if (p) p.job = "explore";
  });
  if (taken.length === 0) log(s, "Eadgyth's mouth thins. You go alone.");
  else log(s, `${taken.map((id) => findPerson(s, id)?.name).join(" and ")} take a spear.`);
  const route = ROUTES.find((r) => r.id === routeId);
  if (!route) return s;
  if (!s.contacts[route.first]) firstContact(s, route);
  else repeatRoute(s, route);
  return s;
}
function trollContact(s: GameState) {
  if (
    captiveHome(s) === "cage" &&
    slaves(s).length < captiveSlots(s) &&
    !s.contacts.stream_room
  ) {
    streamCageRoom(s);
    return;
  }
  log(s, "The stream-mouth stinks of fish-rot. Something huge is feeding. It does not speak.");
  setChoices(s, [
    {
      id: "troll_back",
      label: "Back away slowly"
    },
    {
      id: "troll_throw",
      label: "Throw fish and retreat"
    },
    {
      id: "troll_fight",
      label: "Fight it"
    },
    {
      id: "troll_watch",
      label: "Watch from cover"
    }
  ], partyVoice(s, VOICE_TROLL));
}
function firstContact(s: GameState, route: (typeof ROUTES)[number]) {
  s.contacts[route.first] = true;
  if (route.first === "troll") {
    trollContact(s);
    return;
  }
  if (route.first === "goblin") {
    if (captiveHome(s) === "cage" && slaves(s).length < captiveSlots(s) && !s.contacts.bars_room) {
      coastBarsRoom(s);
      return;
    }
    log(s, "A cove of driftwood and hide. Small sharp faces freeze, then chatter in a tongue you do not know.");
    setChoices(s, [
      {
        id: "goblin_watch",
        label: "Hold and watch"
      },
      {
        id: "goblin_offer",
        label: "Offer food"
      },
      {
        id: "goblin_speak",
        label: "Try to speak"
      },
      {
        id: "goblin_rush",
        label: "Rush them"
      },
      {
        id: "goblin_leave",
        label: "Leave"
      }
    ], partyVoice(s, VOICE_GOBLIN));
  } else if (route.first === "orc") {
    if (
      captiveHome(s) === "cage" &&
      slaves(s).length < captiveSlots(s) &&
      !s.contacts.trail_room &&
      !slaves(s).some((p) => p.race === "orc")
    ) {
      trailMossRoom(s);
      return;
    }
    log(s, "Hunters on a game trail. Large. They stop and measure you. No word you know.");
    setChoices(s, [
      {
        id: "orc_stand",
        label: "Stand your ground"
      },
      {
        id: "orc_share",
        label: "Offer a share"
      },
      {
        id: "orc_fight",
        label: "Fight"
      },
      {
        id: "orc_withdraw",
        label: "Withdraw"
      }
    ], partyVoice(s, VOICE_ORC));
  } else if (route.first === "elf") {
    if (
      captiveHome(s) === "cage" &&
      slaves(s).length < captiveSlots(s) &&
      !s.contacts.wood_room &&
      !slaves(s).some((p) => p.race === "elf")
    ) {
      timberWoodRoom(s);
      return;
    }
    log(s, "Old timber. You were watched first. Tall figures point you back the way you came.");
    setChoices(s, [
      {
        id: "elf_back",
        label: "Turn back"
      },
      {
        id: "elf_gift",
        label: "Leave a gift"
      },
      {
        id: "elf_push",
        label: "Push forward"
      },
      {
        id: "elf_hide",
        label: "Hide and watch"
      }
    ], partyVoice(s, VOICE_ELF));
  } else {
    if (
      captiveHome(s) === "cage" &&
      slaves(s).length < captiveSlots(s) &&
      !s.contacts.cut_room &&
      !slaves(s).some((p) => p.race === "dwarf")
    ) {
      foldCutRoom(s);
      return;
    }
    log(s, "Fresh chips of stone. Workers come out of a cut in the rock and stop.");
    setChoices(s, [
      {
        id: "dwarf_off",
        label: "Stay off the cut"
      },
      {
        id: "dwarf_offer",
        label: "Offer and step back"
      },
      {
        id: "dwarf_force",
        label: "Force the working"
      },
      {
        id: "dwarf_leave",
        label: "Leave"
      }
    ], partyVoice(s, VOICE_DWARF));
  }
}
function pickWeighted<T>(rows: { w: number; v: T }[]): T {
  const total = rows.reduce((n, r) => n + r.w, 0);
  let t = Math.random() * total;
  for (const r of rows) {
    t -= r.w;
    if (t <= 0) return r.v;
  }
  return rows[rows.length - 1]!.v;
}
function coastThieves(s: GameState, known: boolean) {
  log(s, known ? "The same little thieves. They know the path to your dock." : "Thieves at the wreckage again.");
  setChoices(s, [
    { id: "coast_drive", label: "Drive them off" },
    { id: "coast_take", label: "Rush to take one" },
    { id: "coast_leave", label: "Leave" },
  ], partyVoice(s, VOICE_COAST_THIEF));
}
function coastBarsRoom(s: GameState) {
  s.contacts.bars_room = true;
  log(s, "The wrack holds one still breathing. Small. The cage has room.");
  setChoices(s, [
    { id: "coast_bars_take", label: "Take them to the bars" },
    { id: "coast_bars_leave", label: "Leave them the wrack" },
  ], partyVoice(s, VOICE_COAST_BARS));
}
function repeatRoute(s: GameState, route: (typeof ROUTES)[number]) {
  if (route.id === "coast") repeatCoast(s);
  else if (route.id === "trails") repeatTrails(s);
  else if (route.id === "timber") repeatTimber(s);
  else if (route.id === "fold") repeatFold(s);
  else repeatStream(s);
}
function repeatCoast(s: GameState) {
  if (captiveHome(s) === "cage" && slaves(s).length < captiveSlots(s) && !s.contacts.bars_room) {
    coastBarsRoom(s);
    return;
  }
  const hunted = s.raidOnce || s.escaped?.race === "goblin";
  const roll = pickWeighted([
    { w: hunted ? 1 : 2, v: "empty" },
    { w: hunted ? 3 : 1, v: "watchers" },
    { w: hunted ? 4 : 2, v: "thieves" },
    { w: hunted ? 3 : 2, v: "night" },
    { w: 1, v: "dead" },
    { w: 1, v: "wreck" },
    { w: hunted ? 2 : 1, v: "ambush" },
    { w: 1, v: "weather" },
  ] as const);
  if (roll === "empty") log(s, "Empty cove. Cold fire-sign.");
  else if (roll === "watchers") log(s, hunted ? "Watchers in the rocks. They wait for you to turn toward home." : "Small faces in the wrack. They do not come down.");
  else if (roll === "thieves") coastThieves(s, hunted);
  else if (roll === "night") {
    s.nightSign = true;
    s.renown += 1;
    log(s, "Prints toward your own dock. +1 Renown. Watch the water tonight.");
  } else if (roll === "dead") {
    s.renown += 1;
    log(s, "A dead goblin, or the thing that ate one. +1 Renown.");
  } else if (roll === "wreck") log(s, "A wreck-gift: rope-ends and a cracked pot. Nothing worth the walk.");
  else if (roll === "ambush") {
    log(s, "They come out of the wrack at your knees.");
    fightTake(s, "goblin", "light");
  } else log(s, "Rain on the rocks. A wasted walk.");
}
function markHunt(s: GameState) {
  s.huntSign = true;
}
function markElf(s: GameState) {
  s.elfSign = true;
  if (s.elfGrudge < 1) s.elfGrudge = 1;
}
function markDwarf(s: GameState) {
  s.dwarfSign = true;
  if (s.dwarfGrudge < 1) s.dwarfGrudge = 1;
}
function markTroll(s: GameState) {
  if (s.contacts.troll_dead) return;
  s.trollSign = true;
}
function timberPoisoned(s: GameState): boolean {
  return s.elfGrudge >= 1 || slaves(s).some((p) => p.race === "elf");
}
function foldPoisoned(s: GameState): boolean {
  return s.dwarfGrudge >= 1 || slaves(s).some((p) => p.race === "dwarf");
}
function trailMossRoom(s: GameState) {
  s.contacts.trail_room = true;
  log(s, "One of them is down on the moss. Not small. The cage has room if you are a fool.");
  setChoices(s, [
    { id: "trail_moss_take", label: "Take them to the bars" },
    { id: "trail_moss_leave", label: "Leave them the moss" },
  ], partyVoice(s, VOICE_TRAIL_MOSS));
}
function repeatTrails(s: GameState) {
  if (
    captiveHome(s) === "cage" &&
    slaves(s).length < captiveSlots(s) &&
    !s.contacts.trail_room &&
    !slaves(s).some((p) => p.race === "orc")
  ) {
    trailMossRoom(s);
    return;
  }
  const hunted = s.huntHits > 0 || s.escaped?.race === "orc" || slaves(s).some((p) => p.race === "orc");
  const roll = pickWeighted([
    { w: hunted ? 1 : 2, v: "cold" },
    { w: 2, v: "watch" },
    { w: 1, v: "kill" },
    { w: 1, v: "contest" },
    { w: hunted ? 3 : 1, v: "sign" },
    { w: 1, v: "wounded" },
    { w: hunted ? 2 : 1, v: "ranks" },
    { w: 1, v: "woods" },
  ] as const);
  if (roll === "cold") log(s, "Cold trail. Yesterday's blood, nobody on it.");
  else if (roll === "watch") log(s, "They watch from the timber. They do not give the trail, and they do not take it.");
  else if (roll === "kill") {
    log(s, "A fresh kill cooling. The hunters are not on it yet.");
    setChoices(s, [
      { id: "trails_kill", label: "Take the carcass" },
      { id: "trails_leave", label: "Leave it" },
    ], partyVoice(s, VOICE_ORC));
  } else if (roll === "contest") {
    log(s, "Contest of ground. They will not step aside.");
    setChoices(s, [
      { id: "trails_fight", label: "Hold the trail" },
      { id: "trails_give", label: "Give it" },
    ], partyVoice(s, VOICE_ORC));
  } else if (roll === "sign") {
    s.renown += 1;
    markHunt(s);
    log(s, "Orc-sign toward your own hall. +1 Renown. Watch the game-side tonight.");
  } else if (roll === "wounded") {
    log(s, "One of them is down, bleeding into the moss. The rest have gone on.");
    setChoices(s, [
      { id: "trails_take", label: "Take the wounded" },
      { id: "trails_mercy", label: "Leave them" },
    ], partyVoice(s, VOICE_ORC));
  } else if (roll === "ranks") {
    log(s, "Closed ranks. Too many. Steel would be a story you do not come home to tell.");
    setChoices(s, [
      { id: "trails_ranks", label: "Stand anyway" },
      { id: "trails_give", label: "Give the trail" },
    ], partyVoice(s, VOICE_ORC));
  } else log(s, "Hard woods. You lose an hour and come back with burrs.");
}
function timberWoodRoom(s: GameState) {
  s.contacts.wood_room = true;
  log(s, "One of them is bound against the bark. Tall. The cage has room. The wood will remember.");
  setChoices(s, [
    { id: "wood_bind_take", label: "Take them to the bars" },
    { id: "wood_bind_leave", label: "Leave them the trees" },
  ], partyVoice(s, VOICE_WOOD_BIND));
}
function repeatTimber(s: GameState) {
  if (
    captiveHome(s) === "cage" &&
    slaves(s).length < captiveSlots(s) &&
    !s.contacts.wood_room &&
    !slaves(s).some((p) => p.race === "elf")
  ) {
    timberWoodRoom(s);
    return;
  }
  const poisoned = timberPoisoned(s);
  const roll = pickWeighted([
    { w: poisoned ? 1 : 2, v: "warn" },
    { w: poisoned ? 2 : 1, v: "marks" },
    { w: poisoned ? 0 : 1, v: "gift" },
    { w: poisoned ? 1 : 2, v: "empty" },
    { w: poisoned ? 2 : 1, v: "herd" },
    { w: 1, v: "lone" },
    { w: poisoned ? 3 : 1, v: "arrow" },
    { w: 1, v: "lost" },
    { w: poisoned ? 2 : 0, v: "fight" },
  ] as const);
  if (roll === "warn") log(s, poisoned ? "The same warning, sharper. The wood is shut. Capture poisoned this path." : "The same warning. They point you back. You take it.");
  else if (roll === "marks") {
    s.renown += 1;
    markElf(s);
    log(s, "Fresh marks on the trees. A border, redrawn. +1 Renown. Watch the tree-line tonight.");
  } else if (roll === "gift") {
    s.renown += 1;
    log(s, "The gift you left is gone, or answered with a white stone. +1 Renown.");
  } else if (roll === "empty") log(s, poisoned ? "Empty timber. No bird-noise. They let you feel the shut." : "Empty timber. Bird-noise only.");
  else if (roll === "herd") {
    log(s, poisoned ? "They herd you off the path without a word. The wood remembers steel." : "They herd you off the path without a word. You let them.");
    if (poisoned) markElf(s);
  } else if (roll === "lone") {
    if (poisoned) {
      log(s, "A lone watcher. Not a welcome. Steel if you take another step.");
      fightTake(s, "elf", "even");
    } else {
      s.renown += 1;
      log(s, "A lone watcher. You see how few they are, then leave. +1 Renown.");
    }
  } else if (roll === "arrow") {
    s.renown += 1;
    markElf(s);
    log(s, poisoned ? "An arrow in a trunk at head-height. Not a miss. +1 Renown. They will try the hall." : "An arrow in a trunk at head-height. Not a miss. +1 Renown.");
  } else if (roll === "fight") {
    log(s, "The wood is shut. They answer steel with steel.");
    fightTake(s, "elf", s.elfGrudge >= 3 ? "heavy" : "even");
  } else log(s, "You lose an hour among the same trunks.");
}
function foldCutRoom(s: GameState) {
  s.contacts.cut_room = true;
  log(s, "One of them is on the spoil-heap. Short. Alone. The cage has room. The cut will remember.");
  setChoices(s, [
    { id: "cut_bind_take", label: "Take them to the bars" },
    { id: "cut_bind_leave", label: "Leave them the stone" },
  ], partyVoice(s, VOICE_CUT_BIND));
}
function repeatFold(s: GameState) {
  if (
    captiveHome(s) === "cage" &&
    slaves(s).length < captiveSlots(s) &&
    !s.contacts.cut_room &&
    !slaves(s).some((p) => p.race === "dwarf")
  ) {
    foldCutRoom(s);
    return;
  }
  const poisoned = foldPoisoned(s);
  const roll = pickWeighted([
    { w: poisoned ? 3 : 2, v: "shut" },
    { w: poisoned ? 1 : 2, v: "work" },
    { w: poisoned ? 0 : 1, v: "gift" },
    { w: 1, v: "cut" },
    { w: poisoned ? 2 : 1, v: "block" },
    { w: 1, v: "straggler" },
    { w: poisoned ? 3 : 1, v: "follow" },
    { w: 1, v: "climb" },
  ] as const);
  if (roll === "shut") log(s, poisoned ? "A shut face of stone. The cut is closed. Capture poisoned this path." : "A shut face of stone. The cut is closed.");
  else if (roll === "work") log(s, poisoned ? "They are at work. They do not look up. The working is not yours." : "They are at work. They let you watch from below, not from the cut.");
  else if (roll === "gift") {
    s.renown += 1;
    if (Math.random() > 0.35) {
      s.iron += 1;
      log(s, "A trail-gift: a chip of worked iron. +1 Renown.");
    } else {
      log(s, "A trail-gift: a chip of worked stone. +1 Renown.");
    }
  } else if (roll === "cut") {
    s.renown += 1;
    log(s, poisoned ? "A fresh cut, empty. You look. You take nothing. +1 Renown." : "A fresh cut, empty. You look, you do not take. +1 Renown.");
  } else if (roll === "block") log(s, poisoned ? "The path is blocked with spoil. A working, closed to you." : "The path is blocked with spoil. You turn downslope.");
  else if (roll === "straggler") {
    log(s, poisoned ? "A straggler on the spoil-heap. Alone, and they have a hammer." : "A straggler on the spoil-heap. Alone, and watching you.");
    setChoices(s, [
      { id: "fold_offer", label: "Offer and step back" },
      { id: "fold_force", label: "Force them" },
      { id: "fold_leave", label: "Leave" },
    ], partyVoice(s, VOICE_DWARF));
  } else if (roll === "follow") {
    s.renown += 1;
    markDwarf(s);
    log(s, "You are followed home as far as the tree-line. +1 Renown. They know the hall now. Watch tonight.");
  } else log(s, "A bad climb. You come down with torn hands and no story.");
}
function streamCageRoom(s: GameState) {
  s.contacts.stream_room = true;
  log(s, "The stink is feeding. The cage has room. This is not a people.");
  setChoices(s, [
    { id: "stream_cage_take", label: "Take them to the bars" },
    { id: "stream_cage_throw", label: "Throw fish and retreat" },
    { id: "stream_cage_leave", label: "Leave it the bank" },
  ], partyVoice(s, VOICE_STREAM_CAGE));
}
function repeatStream(s: GameState) {
  if (
    captiveHome(s) === "cage" &&
    slaves(s).length < captiveSlots(s) &&
    !s.contacts.stream_room
  ) {
    streamCageRoom(s);
    return;
  }
  const dead = Boolean(s.contacts.troll_dead);
  const roll = pickWeighted(
    dead
      ? [
          { w: 3, v: "empty" },
          { w: 2, v: "fish" },
          { w: 2, v: "other" },
          { w: 1, v: "sign" },
        ]
      : [
          { w: 2, v: "empty" },
          { w: 1, v: "sign" },
          { w: 2, v: "feed" },
          { w: 1, v: "down" },
          { w: 1, v: "fish" },
          { w: 1, v: "other" },
          { w: 1, v: "hunt" },
          { w: 1, v: "cross" },
        ],
  );
  if (roll === "empty") log(s, dead ? "Empty water. The big thing is gone. The stink is not." : "Empty water. Old bones only.");
  else if (roll === "sign") {
    s.renown += 1;
    markTroll(s);
    log(s, "Fresh troll-sign toward the water. +1 Renown. Watch the dock tonight.");
  } else if (roll === "feed") {
    s.renown += 1;
    markTroll(s);
    log(s, "It is feeding again. You leave it the bank. +1 Renown. The stink will follow the water.");
  } else if (roll === "down") {
    s.renown += 1;
    markTroll(s);
    log(s, "Moved downstream. Closer to your own water-gate. +1 Renown. Watch the dock tonight.");
  } else if (roll === "fish") log(s, "A fish-kill. White bellies in the weeds. You take none.");
  else if (roll === "other") {
    s.renown += 1;
    log(s, "Other-race sign on the same bank. Not troll. +1 Renown.");
  } else if (roll === "hunt") {
    log(s, "You came prepared, or it did. The bank is a killing-ground.");
    setChoices(s, [
      { id: "stream_hunt", label: "Drive or kill it" },
      { id: "stream_back", label: "Leave the bank" },
    ], partyVoice(s, VOICE_TROLL));
  } else log(s, "A bad crossing. Wet to the bone, no story.");
}
function fightTake(s: GameState, race: Race | "troll", weight: "light" | "even" | "heavy", fromNight = false) {
  offerFight(s, race, weight, fromNight);
}
function soundCount(s: GameState): number {
  return s.party.filter((id) => {
    const p = findPerson(s, id);
    return p && p.alive && p.hurt < 7;
  }).length;
}
function enemyWeight(s: GameState, base: "light" | "even" | "heavy"): "light" | "even" | "heavy" {
  const you = findPerson(s, "player");
  if ((you?.hurt ?? 0) > 0) {
    if (base === "light") return "even";
    if (base === "even") return "heavy";
  }
  return base;
}
function yourSide(s: GameState, enemy: "light" | "even" | "heavy"): "heavy" | "even" | "light" {
  const n = soundCount(s);
  if (enemy === "heavy") return "light";
  if (enemy === "even") return n >= 1 ? "even" : "light";
  return n >= 2 ? "heavy" : "even";
}
function offerFight(s: GameState, race: Race | "troll", weight: "light" | "even" | "heavy", fromNight = false) {
  const w = enemyWeight(s, weight);
  s.pendingFight = { race, weight: w, fromNight: fromNight || undefined };
  const side = yourSide(s, w);
  const ground =
    side === "heavy"
      ? "You have the ground."
      : side === "even"
        ? "The ground is even. Winner takes a wound."
        : "They have the ground. Run is sense. Stand risks a life.";
  log(s, ground);
  setChoices(
    s,
    [
      { id: "fight_stand", label: "Stand" },
      { id: "fight_drive", label: side === "light" ? "Drive and pray" : "Drive them off" },
      { id: "fight_run", label: side === "light" ? "Run" : "Break off" },
    ],
    partyVoice(s, VOICE_FIGHT),
  );
}
function resolveStance(s: GameState, stance: "stand" | "drive" | "run") {
  const fight = s.pendingFight;
  if (!fight) return;
  s.pendingFight = null;
  if (fight.race === "orc") markHunt(s);
  if (fight.race === "elf" && stance !== "run" && !fight.fromNight) markElf(s);
  if (fight.race === "dwarf" && stance !== "run" && !fight.fromNight) markDwarf(s);
  if (fight.race === "troll" && !fight.fromNight) markTroll(s);
  const side = yourSide(s, fight.weight);
  if (stance === "run") {
    s.tired = true;
    if (fight.race === "troll" && fight.fromNight) {
      const n = Math.min(s.food, 6);
      if (n) s.food -= n;
      log(s, n ? `You give the water. It feeds at the pilings. ${n} meal gone.` : "You give the water. It noses the empty pilings and goes back up.", "warn");
      return;
    }
    if (side === "heavy") {
      const ead = findPerson(s, "eadric");
      log(s, ead?.alive ? "You give the ground. Eadric will call it timid." : "You give the ground. Easy, and small.");
    } else if (side === "light" && Math.random() > 0.65) {
      woundPerson(s, pickVictim(s, false), 3);
      log(s, "You run. Something still catches a man.", "warn");
    } else {
      log(s, "You give the ground. No story. No captive.");
    }
    return;
  }
  let fail = 0.45;
  if (side === "heavy") fail = stance === "drive" ? 0.04 : 0.08;
  else if (side === "even") fail = stance === "drive" ? 0.32 : 0.45;
  else fail = stance === "drive" ? 0.58 : 0.72;
  const win = Math.random() > fail;
  if (!win) {
    loseFight(s, side, stance);
    return;
  }
  s.tired = true;
  if (stance === "drive") {
    s.renown += 1;
    log(s, "You drive them. The ground is yours. No prisoner. +1 Renown.", "ok");
    return;
  }
  s.renown += 2;
  log(s, "You win the ground. +2 Renown.", "ok");
  if (fight.race === "dwarf") {
    s.iron += 1;
    log(s, "A pick, still good. Tools and a grudge.");
  }
  if (side === "heavy" && Math.random() > 0.85) {
    const v = pickVictim(s, true);
    if (v) {
      v.hurt = Math.max(v.hurt, 3);
      log(s, v.id === "player" ? "A sloppy cut. You will feel it tomorrow." : `${v.name} takes a light cut in the winning.`, "warn");
    }
  }
  offerTake(s, fight.race);
}
function offerTake(s: GameState, race: Race | "troll") {
  if (race === "troll") {
    s.contacts.troll_dead = true;
    s.trollSign = false;
    log(s, "It is a corpse or a flight. Not a thrall.");
    return;
  }
  if (s.party.length < 1 && !(s.escaped && s.escaped.race === race)) {
    log(s, "Alone, you cannot hold them. They flee into the rocks.");
    return;
  }
  if (s.rope < 1 && s.hide < 1) {
    log(s, "No rope. They wriggle free and are gone.");
    return;
  }
  s.pendingTake = race;
  const same = s.escaped && s.escaped.race === race;
  const copy = holdCopy(s);
  setChoices(s, [
    { id: "take_home", label: takeHomeLabel(s, same ? s.escaped!.name : undefined) },
    { id: "drive_off", label: "Drive them off and leave" },
  ], [{ text: same ? `${s.escaped!.name} is down. Rope will hold them, if the ${copy.ifWill} still will.` : "They are down. Rope or hide will hold them, if you mean to keep them." }]);
}
function loseFight(s: GameState, side: "heavy" | "even" | "light", stance: "stand" | "drive") {
  s.tired = true;
  const victim = pickVictim(s, side === "light" && stance === "stand");
  if (!victim) return;
  if (side === "light" && stance === "stand" && victim.id !== "player" && Math.random() > 0.4) {
    killPerson(s, victim);
    return;
  }
  woundPerson(s, victim, side === "light" ? 7 : 3);
  log(s, victim.id === "player" ? "You break off, hurt. No captive. Tomorrow will be thin." : `${victim.name} breaks off, hurt. No captive. Tomorrow will be thin.`, "warn");
}
function pickVictim(s: GameState, preferCompanion: boolean): Person | undefined {
  const partyFolk = s.party
    .map((id) => findPerson(s, id))
    .filter((p): p is Person => Boolean(p && p.alive));
  const easy = partyFolk.filter((p) => p.id === "wulfric" || p.id === "godric");
  if (easy.length) return easy[Math.floor(Math.random() * easy.length)];
  if (preferCompanion && partyFolk.length) return partyFolk[0];
  if (partyFolk.length && Math.random() > 0.45) return partyFolk[0];
  return findPerson(s, "player");
}
function woundPerson(s: GameState, p: Person | undefined, days: number) {
  if (!p) return;
  p.hurt = Math.max(p.hurt, days);
}
function killPerson(s: GameState, p: Person) {
  p.alive = false;
  s.people.forEach((x) => {
    if (x.alive && x.status === "free" && x.id !== "player") x.loyalty = Math.max(1, x.loyalty - 1);
  });
  if (s.watch === p.id) s.watch = "none";
  if (p.id === "aldred") s.aldredRange = false;
  if (p.id === "player") {
    endGame(s, "You fall. The hall has no heir.");
    return;
  }
  if (p.id === "eadric") log(s, "Eadric falls. The hall is quieter. Your brother is gone.", "warn");
  else if (p.id === "eadgyth") log(s, "Eadgyth falls. The hall cracks. The fire is only a fire now.", "warn");
  else log(s, `${p.name} falls. The hall will feel that.`, "warn");
  checkWipe(s);
}
function resolveChoice(s: GameState, id: string): GameState {
  if (!s.choices?.some((c) => c.id === id)) return s;
  if (id.startsWith("oswin_sell:")) {
    clearChoices(s);
    return sellThrall(s, id.slice(11));
  }
  if (id.startsWith("saewyn_sell:")) {
    clearChoices(s);
    return sellToSaewyn(s, id.slice(12));
  }
  clearChoices(s);
  const gain = (n: number, text: string) => {
    s.renown += n;
    log(s, text);
  };
  switch (id) {
    case "goblin_watch":
      gain(1, "They snatch scraps and vanish. +1 Renown. You have seen the little thieves.");
      break;
    case "goblin_offer":
      s.food = Math.max(0, s.food - 2);
      gain(1, "One darts in and takes it. No thanks. +1 Renown. They know you have meal.");
      break;
    case "goblin_speak":
      log(s, "Your words mean nothing. They mimic you and are gone. No Renown.");
      break;
    case "goblin_rush":
      fightTake(s, "goblin", "light");
      break;
    case "goblin_leave":
      log(s, "You back out of the cove. Eadric will call it timid if he hears.");
      break;
    case "orc_stand":
      gain(1, "A spear-butt hits the earth. They take their kill and go. +1 Renown.");
      break;
    case "orc_share":
      s.food = Math.max(0, s.food - 3);
      gain(1, "They take the meat after a long look. +1 Renown.");
      break;
    case "orc_fight":
      fightTake(s, "orc", "even");
      break;
    case "orc_withdraw":
      log(s, "You give the trail. Eadric will hate this.");
      break;
    case "elf_back":
      gain(1, "You leave their trees. +1 Renown. A border, not a welcome.");
      break;
    case "elf_gift":
      s.food = Math.max(0, s.food - 1);
      gain(1, "You set bread on a stone. Later it is gone. +1 Renown.");
      break;
    case "elf_push":
      fightTake(s, "elf", "even");
      break;
    case "elf_hide":
      gain(1, "You see how few they are, then leave unseen. +1 Renown.");
      break;
    case "dwarf_off":
      gain(1, "They watch you off their threshold. +1 Renown. Someone here makes things.");
      break;
    case "dwarf_offer":
      s.food = Math.max(0, s.food - 2);
      gain(1, "One takes it and leaves a broken chip. +1 Renown.");
      break;
    case "dwarf_force":
      fightTake(s, "dwarf", "even");
      break;
    case "dwarf_leave":
      log(s, "You turn downslope. Safe. No story.");
      break;
    case "troll_back":
      gain(1, "It watches. It does not chase. +1 Renown. The dock feels closer to this than you like.");
      markTroll(s);
      break;
    case "troll_throw":
      s.food = Math.max(0, s.food - 3);
      gain(1, "It takes the throw. You buy seconds and use them. +1 Renown.");
      markTroll(s);
      break;
    case "troll_fight":
      fightTake(s, "troll", "heavy");
      break;
    case "troll_watch":
      gain(1, "You mark how it moves. +1 Renown.");
      markTroll(s);
      break;
    case "stream_cage_take":
      log(s, "You cannot drag that. The bars were cut for throats, not this.", "warn");
      markTroll(s);
      break;
    case "stream_cage_throw":
      s.food = Math.max(0, s.food - 3);
      gain(1, "It takes the throw. You buy seconds and use them. +1 Renown.");
      markTroll(s);
      break;
    case "stream_cage_leave":
      log(s, "You leave it the bank. Sense. The cage stays empty of this.");
      break;
    case "coast_drive":
      gain(1, "They scatter. +1 Renown.");
      break;
    case "coast_take":
      fightTake(s, "goblin", "light");
      break;
    case "coast_leave":
      log(s, "You leave them the scraps.");
      break;
    case "coast_bars_take":
      if (s.party.length < 1) {
        log(s, "Alone, you cannot hold them. They flee into the rocks.");
        break;
      }
      s.pendingTake = "goblin";
      takeHome(s);
      break;
    case "coast_bars_leave":
      log(s, "You leave them the wrack. The cage still has room.");
      break;
    case "trails_kill":
      s.food += 3;
      s.hide += 1;
      s.renown += 1;
      markHunt(s);
      log(s, "You take the carcass. Meat and a hide. +1 Renown. They will know.");
      break;
    case "trails_leave":
      log(s, "You leave the kill. Sense, if not a story.");
      break;
    case "trails_fight":
      fightTake(s, "orc", "even");
      break;
    case "trails_give":
      log(s, "You give the trail. Eadric will hate this.");
      break;
    case "trails_take":
      fightTake(s, "orc", "even");
      break;
    case "trails_mercy":
      log(s, "You leave the wounded. The moss takes them, or their own.");
      break;
    case "trail_moss_take":
      if (s.party.length < 1) {
        log(s, "Alone, you cannot hold them. They flee into the timber.");
        break;
      }
      s.pendingTake = "orc";
      takeHome(s);
      break;
    case "trail_moss_leave":
      log(s, "You leave them the moss. Sense, if not a story.");
      break;
    case "wood_bind_take":
      if (s.party.length < 1) {
        log(s, "Alone, you cannot hold them. They vanish into the trunks.");
        break;
      }
      s.pendingTake = "elf";
      takeHome(s);
      break;
    case "wood_bind_leave":
      log(s, "You leave them the trees. The wood does not follow you home.");
      break;
    case "cut_bind_take":
      if (s.party.length < 1) {
        log(s, "Alone, you cannot hold them. They drop into the cut.");
        break;
      }
      s.pendingTake = "dwarf";
      takeHome(s);
      break;
    case "cut_bind_leave":
      log(s, "You leave them the stone. The cut does not follow you home.");
      break;
    case "trails_ranks":
      fightTake(s, "orc", "heavy");
      break;
    case "fold_offer":
      s.food = Math.max(0, s.food - 2);
      s.renown += 1;
      log(s, "The straggler takes it and leaves a chip. +1 Renown.");
      break;
    case "fold_force":
      fightTake(s, "dwarf", "even");
      break;
    case "fold_leave":
      log(s, "You turn downslope. Safe. No story.");
      break;
    case "stream_hunt":
      fightTake(s, "troll", "heavy");
      break;
    case "stream_back":
      log(s, "You leave the bank. The stink follows you home.");
      markTroll(s);
      break;
    case "raid_take":
      takeDockThief(s);
      break;
    case "raid_drive":
      s.renown += 1;
      log(s, "They scatter off the planks. +1 Renown. The path is still known.", "ok");
      break;
    case "raid_spare":
      log(s, "You let them see you and go. They will count that as leave to come again.");
      break;
    case "hunt_stand":
      formGate(s);
      fightTake(s, "orc", huntWeight(s));
      break;
    case "hunt_drive":
      s.renown += 1;
      log(s, "They give the timber. +1 Renown. The trails still know the hall.", "ok");
      break;
    case "hunt_bar":
      s.huntSign = true;
      log(s, "The bar holds. Heavy feet stay in the timber. They will try another night.");
      break;
    case "elf_mark_stand":
      formGate(s);
      fightTake(s, "elf", s.elfGrudge >= 3 && !(s.palisade && s.watchPost) ? "heavy" : "even", true);
      break;
    case "elf_mark_leave":
      s.renown += 1;
      log(s, "You leave their trees. +1 Renown. A border, still. They will remember the steel.");
      break;
    case "elf_mark_bar":
      log(s, "The bar holds. An arrow in the post by morning. They leave the yard.");
      break;
    case "dwarf_follow_offer":
      s.food = Math.max(0, s.food - 2);
      s.renown += 1;
      log(s, "You offer and step back. They take the gift and leave the yard. +1 Renown.");
      break;
    case "dwarf_follow_drive":
      formGate(s);
      fightTake(s, "dwarf", s.dwarfGrudge >= 3 && !(s.palisade && s.watchPost) ? "heavy" : "even", true);
      break;
    case "dwarf_follow_leave":
      log(s, "You leave the cut. They watch from the tree-line and go.");
      break;
    case "troll_gate_stand":
      formGate(s);
      fightTake(s, "troll", "heavy", true);
      break;
    case "troll_gate_throw":
      {
        const n = Math.min(s.food, 3);
        s.food -= n;
        s.renown += 1;
        log(s, n ? `It takes the throw. You buy the dock. +1 Renown.` : "Nothing to throw. It noses the empty pilings and goes back up. +1 Renown.");
      }
      break;
    case "troll_gate_give":
      {
        const n = Math.min(s.food, 4);
        if (n) s.food -= n;
        log(s, n ? `You give the water. It feeds at the pilings. ${n} meal gone.` : "You give the water. It noses the empty pilings and goes back up.", "warn");
      }
      break;
    case "take_home":
      takeHome(s);
      break;
    case "drive_off":
      log(s, "You let the rest of them have their fear.");
      s.pendingTake = null;
      break;
    case "fight_stand":
      resolveStance(s, "stand");
      break;
    case "fight_drive":
      resolveStance(s, "drive");
      break;
    case "fight_run":
      resolveStance(s, "run");
      break;
    case "hunt_follow":
      huntFollow(s, "hard");
      break;
    case "hunt_wait":
      huntFollow(s, "wait");
      break;
    case "hunt_back":
      log(s, s.escaped ? `You leave the tracks of ${s.escaped.name}.` : "You leave the tracks.");
      break;
    case "leave_go":
      letGo(s);
      break;
    case "leave_stay":
      keepHand(s);
      break;
    case "bar_shed":
      s.hut = true;
      s.hutAsk = false;
      log(s, "The shed becomes a hut. Meal comes back underfoot. Eadgyth wants another store.");
      break;
    case "keep_hall":
      s.hutAsk = false;
      log(s, "The stores stay. One room. The free and a prisoner. Sleep will be poor.");
      break;
    case "refuse_keep":
      refuseKeep(s);
      break;
    case "wait_hut":
      s.hutAsk = true;
      log(s, "Dawn will have to name it. They sleep among the free tonight.");
      break;
    case "oswin_tell":
      s.wordOut = true;
      log(s, "He listens without liking it. 'Men will come for wonder as much as for you.' Word will leave with him.");
      oswinBuy(s);
      break;
    case "oswin_silent":
      log(s, "You keep counsel. His crew has eyes. They will see something before he sails.");
      oswinBuy(s);
      break;
    case "oswin_keep":
      log(s, "'Then they work your rock. If you take another, keep me in mind. I am at the dock two days.'");
      break;
    case "oswin2_house":
      joinHanger(s, "cuthwin");
      joinHanger(s, "hilda");
      if (s.palisade || hasBuilding(s, "bunkhouse")) {
        joinHanger(s, "aldred");
        log(s, "Cuthwin and Hilda take a bunk. Aldred claims a corner and a spear. Saewyn will lodge a few nights.");
      } else {
        s.aldredWaiting = true;
        log(s, "Cuthwin and Hilda squeeze into the hall. Aldred looks at the open timber and will not stay — yet. Raise a wall, or bunks after, and he will take a corner. Saewyn lodges a few nights anyway.");
      }
      joinHanger(s, "saewyn");
      s.saewynDays = 4;
      break;
    case "oswin2_cuthwin":
      joinHanger(s, "cuthwin");
      joinHanger(s, "saewyn");
      s.saewynDays = 3;
      log(s, "Cuthwin stays. Hilda and the rest go back up the plank. Saewyn remains a guest.");
      break;
    case "oswin2_away":
      s.settlersHint = true;
      joinHanger(s, "saewyn");
      s.saewynDays = 2;
      log(s, "You turn them from the dock. Oswin shrugs. 'Then the next coast will have them.' Saewyn lodges anyway.", "warn");
      break;
    case "saewyn_buy":
      s.saewynTalk = true;
      s.renown += 1;
      log(s, "Saewyn talks as a buyer talks: hall, stock, the sea-road. Eadgyth notices. +1 Renown.");
      if (slaves(s).length && !s.saewynBought) openSaewynStock(s);
      break;
    case "saewyn_warm": {
      s.saewynTalk = true;
      s.saewynWarm = true;
      s.renown += 1;
      const eadric = findPerson(s, "eadric");
      if (eadric?.alive) eadric.loyalty = Math.max(1, eadric.loyalty - 1);
      log(s, eadric?.alive
        ? "A warmer word than a buyer needs. Eadgyth notices. Eadric hates it. +1 Renown."
        : "A warmer word than a buyer needs. Eadgyth notices. +1 Renown.");
      break;
    }
    case "saewyn_weather":
      log(s, "You give her the weather and the catch. She is not insulted.");
      break;
    case "saewyn_leave":
      log(s, "You give her the weather. She is not insulted. The plank is waiting.");
      sailSaewyn(s);
      break;
    case "saewyn_private":
      s.saewynReturn = true;
      s.renown += 1;
      log(s, "A private word before she sails. She will come again, if the hall still stands. +1 Renown.");
      sailSaewyn(s);
      break;
    case "saewyn_home":
      log(s, "The hall is open to her. She lodges. A buyer, not a hand.");
      break;
    case "saewyn_keep": {
      const home = captiveHome(s);
      log(s, home === "cage"
        ? "You keep them. She is not insulted. The bars still have stock if you change your mind."
        : home === "hut"
          ? "You keep them. She is not insulted. The first store still has stock if you change your mind."
          : "You keep them. She is not insulted. The hall still has stock if you change your mind.");
      break;
    }
    case "escape_yard_back": {
      const p = s.pendingEscape ? findPerson(s, s.pendingEscape) : undefined;
      s.pendingEscape = null;
      if (!p || p.status !== "slave") log(s, "The yard is empty.");
      else {
        const copy = holdCopy(s);
        const home = captiveHome(s);
        log(s, home === "cage"
          ? `You put ${p.name} back under the bars. ${copy.holds}`
          : home === "hut"
            ? `You put ${p.name} back under the bar. ${copy.holds}`
            : `You put ${p.name} back under the roof. ${copy.holds}`);
      }
      break;
    }
    case "escape_yard_run": {
      const p = s.pendingEscape ? findPerson(s, s.pendingEscape) : undefined;
      s.pendingEscape = null;
      if (!p || p.status !== "slave") log(s, "The yard is empty.");
      else letThrallGo(s, p, false);
      break;
    }
    case "pair_house":
      namePair(s, "house");
      break;
    case "pair_hands":
      namePair(s, "hands");
      break;
    case "pair_hold":
      namePair(s, "hold");
      break;
    case "pair_later":
      s.pairAsk = false;
      log(s, "The lots wait. Name them when you know.");
      break;
    case "pair2_house":
      namePair2(s, "house");
      break;
    case "pair2_hands":
      namePair2(s, "hands");
      break;
    case "pair2_hold":
      namePair2(s, "hold");
      break;
    case "pair2_later":
      s.pair2Ask = false;
      log(s, "The new lots wait. Name them when you know.");
      break;
    case "settlers_house":
      s.settlersAsk = false;
      s.settlersLanded = true;
      takeSettlers(s, "all");
      break;
    case "settlers_leofric":
      s.settlersAsk = false;
      s.settlersLanded = true;
      takeSettlers(s, "leofric");
      break;
    case "settlers_away":
      s.settlersAsk = false;
      s.settlersLanded = true;
      s.settlersHint = true;
      log(s, "You turn the worn sail. They will tell the next coast what they saw.", "warn");
      if (findPerson(s, "saewyn")) log(s, "Saewyn stays the night anyway. The rest take the plank.");
      if (s.oswinDays > 0) log(s, "Oswin's stall stays. He did not bring those mouths.");
      break;
  }
  if (!s.choices) maybePairAsk(s);
  if (!s.choices) maybePair2Ask(s);
  return s;
}
function takeHome(s: GameState) {
  const race = s.pendingTake;
  s.pendingTake = null;
  if (!race) return;
  const home = captiveHome(s);
  const copy = holdCopy(s);
  if (slaves(s).length >= captiveSlots(s)) {
    log(s, `No space to hold another. They tear free on the path to ${copy.path}.`, "warn");
    return;
  }
  if (s.rope < 1 && s.hide < 1) {
    log(s, "No rope. They wriggle free and are gone.");
    return;
  }
  if (s.rope > 0) s.rope -= 1;
  else s.hide -= 1;
  if (s.escaped && s.escaped.race === race) {
    const person = recapture(s.escaped);
    s.escaped = null;
    s.people.push(person);
    if (person.race === "orc") markHunt(s);
    if (person.race === "elf") markElf(s);
    if (person.race === "dwarf") markDwarf(s);
    log(s, `You have ${person.name} again. ${copy.remember}`, "ok");
    openHutAsk(s, false);
    return;
  }
  const person = generateCaptive(race);
  s.people.push(person);
  if (race === "orc") markHunt(s);
  if (race === "elf") markElf(s);
  if (race === "dwarf") markDwarf(s);
  if (home === "cage") log(s, s.hut
    ? `You drag ${person.name} the ${race} to the bars. No shared word. The first store stays a larder.`
    : `You drag ${person.name} the ${race} to the bars. No shared word.`);
  else if (home === "hut") log(s, `You drag ${person.name} the ${race} back to the barred store. No shared word. Eadgyth looks at the door.`);
  else log(s, `You drag ${person.name} the ${race} back to the hall. No shared word. Eadgyth looks at the door.`);
  openHutAsk(s, false);
}
function needsHutAsk(s: GameState): boolean {
  return s.sheds >= 1 && !s.hut && slaves(s).length > 0 && captiveHome(s) !== "cage";
}
function openHutAsk(s: GameState, fromDawn: boolean) {
  if (!needsHutAsk(s) || s.choices) return;
  const choices: Choice[] = [
    { id: "bar_shed", label: "Bar them in the store-shed" },
    { id: "keep_hall", label: "Keep stores. Hold them in the hall" },
    { id: "refuse_keep", label: "Refuse to keep them" },
  ];
  if (!fromDawn) choices.push({ id: "wait_hut", label: "Wait until morning" });
  const extra: SceneLine[] = [{
    speaker: "Eadgyth",
    text: "Put them in the store. Raise another after. I will not sleep with a prisoner among the free.",
  }];
  const osric = findPerson(s, "osric");
  if (osric?.alive) extra.push({ speaker: "Osric", text: "The shed will hold a bar. Meal can wait on a second roof." });
  setChoices(s, choices, extra);
}
function refuseKeep(s: GameState) {
  s.hutAsk = false;
  const held = slaves(s);
  const p = held[held.length - 1];
  if (!p) {
    log(s, "No one to refuse.");
    return;
  }
  s.escaped = {
    id: p.id,
    name: p.name,
    race: p.race,
    sex: p.sex,
    day: s.day,
    portrait: p.portrait,
    beauty: p.beauty,
    body: p.body,
    str: p.str,
    agi: p.agi,
    end: p.end,
    int: p.int,
    cha: p.cha,
  };
  s.people = s.people.filter((x) => x.id !== p.id);
  if (s.pendingEscape === p.id) s.pendingEscape = null;
  if (p.race === "goblin") s.nightSign = true;
  if (p.race === "orc") s.huntSign = true;
  log(s, `You will not keep ${p.name}. Eadgyth watches them go. The rope was a mistake.`, "warn");
}
function huntRunaway(s: GameState): GameState {
  if (!s.escaped) return s;
  const you = findPerson(s, "player");
  if ((you?.hurt ?? 0) > 3) {
    log(s, "The wound will not carry you after them.", "warn");
    return s;
  }
  if (!spendAp(s, 3)) return s;
  log(s, `Tracks of ${s.escaped.name}. Three hours of light left.`);
  setChoices(s, [
    { id: "hunt_follow", label: "Follow hard" },
    { id: "hunt_wait", label: "Wait on the trail" },
    { id: "hunt_back", label: "Turn back" },
  ], [{ text: "A 3 AP walk. They are not certain." }]);
  return s;
}
function huntFollow(s: GameState, how: "hard" | "wait") {
  if (!s.escaped) return;
  const you = findPerson(s, "player");
  const base = how === "hard" ? 0.32 : 0.18;
  const chance = base + ((you?.agi ?? 6) + (you?.int ?? 6)) / 50;
  if (Math.random() > chance) {
    log(s, `Tracks of ${s.escaped.name} go cold in the timber.`);
    return;
  }
  const race = s.escaped.race;
  if (how === "hard" && (race === "orc" || Math.random() > 0.55)) {
    log(s, `${s.escaped.name} turns. Steel, not a bag.`);
    s.party = [];
    offerFight(s, race, race === "orc" ? "even" : "light");
    return;
  }
  if (slaves(s).length >= captiveSlots(s)) {
    log(s, `You find ${s.escaped.name}. No space to hold them. They vanish again.`, "warn");
    return;
  }
  if (s.rope < 1 && s.hide < 1) {
    log(s, `You find ${s.escaped.name}. No rope, no leather. They slip you.`, "warn");
    return;
  }
  if (s.rope > 0) s.rope -= 1;
  else s.hide -= 1;
  const back = recapture(s.escaped);
  s.people.push(back);
  s.escaped = null;
  s.renown += 1;
  log(s, `You take ${back.name} again. ${holdCopy(s).hunt}. +1 Renown.`, "ok");
  openHutAsk(s, false);
}
function buyGoods(s: GameState, item: ShopItem): GameState {
  if (s.oswinDays < 1) return s;
  const spec = SHOP.find((x) => x.id === item);
  if (!spec || s.silver < spec.cost) {
    log(s, "Oswin waits on silver.", "warn");
    return s;
  }
  s.silver -= spec.cost;
  if (item === "food") s.food += 10;
  if (item === "wood") s.wood += 2;
  if (item === "hide") s.hide += 1;
  if (item === "iron") s.iron += 1;
  if (item === "nails") s.nails += 1;
  log(s, `Oswin sells ${spec.name.toLowerCase()}. ${spec.note}.`);
  return s;
}
function sellGoods(s: GameState, item: ShopSell): GameState {
  if (s.oswinDays < 1) return s;
  const spec = SELL.find((x) => x.id === item);
  if (!spec) return s;
  if (s.oswinBuys >= 4) {
    log(s, "Oswin will not strip his hold the other way. His bags are full enough.");
    return s;
  }
  const have = item === "smoked" ? s.smoked : item === "hide" ? s.hide : item === "wood" ? s.wood : s.iron;
  if (have < spec.qty) {
    log(s, "The stall waits on a pile you do not have.", "warn");
    return s;
  }
  if (item === "smoked" && s.food + (s.smoked - spec.qty) < mouths(s)) {
    log(s, "Eadgyth will not have you selling the last meal.", "warn");
    return s;
  }
  if (item === "smoked") s.smoked -= spec.qty;
  else if (item === "hide") s.hide -= spec.qty;
  else if (item === "wood") s.wood -= spec.qty;
  else s.iron -= spec.qty;
  s.silver += spec.pay;
  s.oswinBuys += 1;
  if (item === "smoked") log(s, `Oswin takes smoked sides. ${spec.pay} silver. Coin, not a name.`);
  else if (item === "hide") log(s, `Oswin takes hide. ${spec.pay} silver. The old ports pay for leather.`);
  else if (item === "wood") log(s, `Oswin takes timber. ${spec.pay} silver. He has trees of his own.`);
  else log(s, `Oswin weighs the bar. ${spec.pay} silver. He will not always buy iron back.`);
  return s;
}
function sellThrall(s: GameState, id: string): GameState {
  if (s.oswinDays < 1) return s;
  const p = findPerson(s, id);
  if (!p || p.status !== "slave") return s;
  const price = slavePrice(p);
  if (price < 1) {
    log(s, "Oswin will not take this one. Too much trouble for the hold.");
    return s;
  }
  s.silver += price;
  p.alive = false;
  s.people = s.people.filter((x) => x.id !== id);
  s.wordOut = true;
  log(s, captiveHome(s) === "cage"
    ? `Oswin prices ${p.name} from the bars. ${price} silver. The rumor is richer now.`
    : captiveHome(s) === "hut"
      ? `Oswin prices ${p.name} from the first store. ${price} silver. The rumor is richer now.`
      : `Oswin prices ${p.name} like cargo. ${price} silver. The rumor is richer now.`);
  return s;
}
function sellToSaewyn(s: GameState, id: string): GameState {
  if (s.saewynDays < 1 || s.saewynBought) return s;
  if (!findPerson(s, "saewyn")) return s;
  const p = findPerson(s, id);
  if (!p || p.status !== "slave") return s;
  const price = slavePrice(p);
  if (price < 1) {
    log(s, "Saewyn will not take this one. Too much trouble for the hold.");
    return s;
  }
  s.silver += price;
  p.alive = false;
  s.people = s.people.filter((x) => x.id !== id);
  s.wordOut = true;
  s.saewynBought = true;
  log(s, captiveHome(s) === "cage"
    ? `Saewyn prices ${p.name} from the bars. ${price} silver. Eadgyth notices. She still lodges.`
    : captiveHome(s) === "hut"
      ? `Saewyn prices ${p.name} from the first store. ${price} silver. Eadgyth notices. She still lodges.`
      : `Saewyn prices ${p.name} for the home market. ${price} silver. Eadgyth notices. She still lodges.`);
  return s;
}
function endDay(s: GameState): GameState {
  let fish = 0;
  let wood = 0;
  let shed = s.shedProg;
  let wall = s.palisade ? 0 : s.wallProg;
  let post = s.watchPost ? 0 : s.watchPostProg;
  let lotLabor = 0;
  let hallMind = false;
  let watered = false;
  let osricOnShed = false;
  const guard = fishGuard(s);
  const hutGuard = s.people.some((p) => p.alive && p.status === "free" && p.job === "hut");
  const waterNames: string[] = [];
  const skipFishNames: string[] = [];
  const slaveFishNames: string[] = [];
  const hallSlaveNames: string[] = [];
  const smokeNames: string[] = [];
  const craftNames: string[] = [];
  const hearthNames: string[] = [];
  const hunters: Person[] = [];
  const rangers: Person[] = [];
  const hutNames: string[] = [];
  let osricLeather = false;
  const bunks = hasBuilding(s, "bunkhouse");
  const knitted: string[] = [];
  s.people.forEach((per) => {
    if (!per.alive || per.guest) return;
    const wounded = per.hurt;
    if (per.hurt > 0) per.hurt -= 1;
    if (bunks && per.hurt > 0 && per.status !== "slave") {
      per.hurt -= 1;
      knitted.push(per.id === "player" ? "You" : per.name);
    }
    if (per.id === "player") return;
    if (wounded > 3) return;
    const half = wounded > 0 || per.tired ? 0.5 : 1;
    per.tired = false;
    if (per.job === "hall") {
      hallMind = true;
      if (per.status === "slave") hallSlaveNames.push(per.name);
    }
    if (per.job === "water") {
      watered = true;
      waterNames.push(per.name);
    }
    if (per.job === "fish") {
      if (per.status === "slave" && !guard) {
        skipFishNames.push(per.name);
      } else {
        fish += Math.max(1, Math.floor(per.fish * half));
        if (per.status === "slave") slaveFishNames.push(per.name);
      }
    }
    if (per.job === "wood") wood += Math.max(1, Math.floor(per.wood * half)) + (s.toolsDays > 0 ? 1 : 0);
    if (per.job === "shed") {
      shed += 1;
      if (per.id === "osric") osricOnShed = true;
    }
    if (per.job === "wall") {
      if (s.palisade && !s.watchPost) post += 1;
      else wall += 1;
    }
    if (per.job === "lot") lotLabor += s.workshop ? 2 : 1;
    if (per.job === "leather") {
      if (per.id !== "osric") log(s, `${per.name}'s hands will not sit the leather. Osric, or you.`, "warn");
      else osricLeather = true;
    }
    if (per.job === "smoke") smokeNames.push(per.name);
    if (per.job === "craft" && per.status === "free") craftNames.push(per.name);
    if (per.job === "hearth" && per.status === "free") hearthNames.push(per.name);
    if (per.job === "hunt" && per.status === "free") hunters.push(per);
    if (per.job === "explore" && per.id === "aldred" && s.aldredRange) rangers.push(per);
    if (per.job === "hut" && per.status === "free") hutNames.push(per.name);
  });
  if (knitted.length) {
    log(
      s,
      knitted.length === 1
        ? knitted[0] === "You"
          ? "You take a pallet. Sleep knits a little."
          : `The bunks knit. ${knitted[0]} sleeps like a person with a roof.`
        : `The bunks knit. ${namesOf(knitted)} sleep like folk with a roof.`,
    );
  }
  s.food += fish;
  s.wood += wood;
  s.shedProg = 0;
  if (shed >= BUILD_NEED.shed && s.wood >= 2) {
    s.wood -= 2;
    s.sheds += 1;
    s.exploreOpen = true;
    if (s.sheds === 1) {
      if (!osricOnShed) {
        s.leakyShed = true;
        log(s, "A store-shed stands, but Osric was not on the timber. It will leak. Stores spoil a little faster.", "warn");
      } else log(s, "A store-shed stands by the hall. Eadgyth: now you may look for trouble.", "ok");
    } else if (s.sheds === 2) {
      s.leakyShed = false;
      log(s, "A second store stands. Meal leaves the sleeping-room again. Eadgyth nods.", "ok");
    } else log(s, "Another store is up.", "ok");
  } else if (shed > 0) log(s, "The shed is not finished. Timber and time still short.");
  if (!s.palisade && wallReady(s)) {
    const today = Math.max(0, wall - s.wallProg);
    const need = BUILD_NEED.wall - s.wallProg;
    let used = Math.min(today, s.wood, need);
    if (used > 0) {
      s.wood -= used;
      s.wallProg += used;
      if (s.wallProg < BUILD_NEED.wall && s.nails > 0) s.wallProg += spendNail(s);
      if (s.wallProg > BUILD_NEED.wall) s.wallProg = BUILD_NEED.wall;
      log(s, `The palisade takes timber. ${s.wallProg}/${BUILD_NEED.wall}.`);
    } else if (today > 0 && s.wood < 1) log(s, "Hands wait on the wall. No wood.", "warn");
    if (s.wallProg >= BUILD_NEED.wall) completePalisade(s);
  }
  if (s.palisade && !s.watchPost && post > 0) {
    const need = BUILD_NEED.post - s.watchPostProg;
    const used = Math.min(post, s.wood, need);
    if (used > 0) {
      s.wood -= used;
      s.watchPostProg += used;
      log(s, `The watch-post takes timber. ${s.watchPostProg}/${BUILD_NEED.post}.`);
    }
    if (s.watchPostProg >= BUILD_NEED.post) {
      s.watchPost = true;
      log(s, "The post stands. Night will see farther.", "ok");
    }
  }
  finishLots(s, lotLabor);
  if (osricLeather) fitLeather(s);
  runYardJobs(s, smokeNames, craftNames, hearthNames);
  runHunt(s, hunters);
  runAldredRange(s, rangers);
  {
    const spear = findPerson(s, "aldred");
    if (
      spear?.alive &&
      s.aldredRange &&
      !rangers.some((r) => r.id === "aldred") &&
      !s.party.includes("aldred")
    ) {
      log(s, "Aldred could not take a spear. The wound will not carry him.", "warn");
    }
  }
  const coldHall = burnFirewood(s);
  if (waterNames.length) {
    log(s, `${namesOf(waterNames)} ${waterNames.length === 1 ? "carries" : "carry"} water. The barrels fill.`);
  }
  if (skipFishNames.length) {
    log(
      s,
      skipFishNames.length === 1
        ? `${namesOf(skipFishNames)} was sent to the dock. No free hand on the lines. The catch is nothing.`
        : `${namesOf(skipFishNames)} were sent to the dock. No free hand on the lines. The catch is nothing.`,
      "warn",
    );
  }
  if (fish) {
    const extra = slaveFishNames.length && guard ? ` ${namesOf(slaveFishNames)} on the lines under ${guard.name}.` : "";
    log(s, `The dock brings ${fish} food.${extra}`);
  }
  if (wood) log(s, `Wood stacked: +${wood}.`);
  if (hallSlaveNames.length) {
    log(s, `${namesOf(hallSlaveNames)} ${hallSlaveNames.length === 1 ? "does" : "do"} the dirty hall work.`);
  }
  if (hutNames.length) {
    const who = namesOf(hutNames);
    if (!slaves(s).length) log(s, `${who} stood an empty bar.`);
    else log(s, `${who} stood ${holdCopy(s).dusk}.`);
  }
  let eat = mouths(s);
  if (hallMind) eat = Math.max(1, eat - 1);
  if (watered) eat = Math.max(1, eat - 1);
  if (hasBuilding(s, "hearthhouse")) eat = Math.max(1, eat - 1);
  if (s.hearthTended) {
    eat = Math.max(1, eat - 1);
    s.hearthTended = false;
  }
  if (s.leakyShed && !hasBuilding(s, "store") && s.sheds < 2 && !hasBuilding(s, "smokehouse")) eat += 1;
  if (crowding(s) > 0 && !hasBuilding(s, "hearthhouse") && !hallMind) eat += 1;
  if (coldHall) eat += 1;
  const fromSmoke = Math.min(s.smoked, eat);
  s.smoked -= fromSmoke;
  s.food -= eat - fromSmoke;
  if (s.food < 0) s.food = 0;
  log(s, fromSmoke > 0 ? `Night. The house eats ${eat} (${fromSmoke} smoked). Stores ${s.food}.` : `Night. The house eats ${eat}. Stores ${s.food}.`);
  if (s.watch === "player") s.tired = true;
  else s.tired = (findPerson(s, "player")?.hurt ?? 0) > 0;
  if (s.watch !== "none") {
    const w = s.watch === "player" ? findPerson(s, "player") : findPerson(s, s.watch);
    if (!w?.alive || w.hurt > 3) {
      if (w?.alive && w.hurt > 3) {
        log(s, w.id === "player" ? "You cannot watch. The wound will not let you." : `${w.name} cannot watch. The wound will not let them.`, "warn");
      }
      s.watch = "none";
    }
  }
  if (s.watch !== "none" && s.watch !== "player") {
    const w = findPerson(s, s.watch);
    if (w) w.tired = true;
  }
  if (slaves(s).length) escapeCheck(s, hutGuard);
  if (s.escaped && s.escaped.race === "goblin") s.nightSign = true;
  if (s.escaped && s.escaped.race === "orc") s.huntSign = true;
  if (!s.choices) maybeDockRaid(s);
  if (!s.choices) maybeOrcHunt(s);
  if (!s.choices) maybeElfMark(s);
  if (!s.choices) maybeDwarfFollow(s);
  if (!s.choices) maybeTrollGate(s);
  if (s.explores >= 2 && s.oswin === 0 && !s.choices) oswinArrives(s);
  else if (s.oswin === 1 && !s.choices) maybeOswinReturn(s);
  else if (s.oswin === 2 && !s.choices) maybeOswinThird(s);
  if (s.oswin === 1 && s.wordOut && s.renown >= 8 && s.day > 12 && !s.settlersHint) {
    s.settlersHint = true;
    log(s, "Oswin's rumor has worked. Distant sails will bring mouths soon. The hall is still too small.");
  }
  if (!s.choices) maybeSettlers(s);
  if (!s.choices) maybeSaewynReturn(s);
  if (s.oswinDays > 0) {
    s.oswinDays -= 1;
    if (s.oswinDays === 0) {
      s.oswinGoneOn = s.day;
      log(s, "Oswin's sail is gone by morning. The dock is yours again.");
    }
  }
  if (s.toolsDays > 0) s.toolsDays -= 1;
  const saewyn = findPerson(s, "saewyn");
  if (s.saewynDays > 0 && saewyn && !s.choices) {
    if (s.saewynDays === 1 && s.saewynTalk && !s.saewynReturn) {
      log(s, "Dawn. Saewyn's cloth is packed. She waits on a word.");
      const extra: SceneLine[] = [{
        speaker: "Saewyn",
        text: "The sea-road is short if a hall is worth finding again."
      }];
      const eadric = findPerson(s, "eadric");
      if (s.saewynWarm && eadric?.alive) extra.push({ speaker: "Eadric", text: "Do not make a fool of the house." });
      setChoices(s, [{
        id: "saewyn_private",
        label: "A private word before she sails"
      }, {
        id: "saewyn_leave",
        label: "Let her go with the weather"
      }], extra);
    } else {
      s.saewynDays -= 1;
      if (s.saewynDays === 0) sailSaewyn(s);
    }
  }
  if (s.escaped && s.day - s.escaped.day >= 5) {
    log(s, `Five days. ${s.escaped.name} is gone into the land.`);
    s.escaped = null;
  }
  const crowd = crowding(s);
  if (crowd > 0) log(s, `The roof is too small. ${crowd} extra mouth${crowd > 1 ? "s" : ""} under it.`, "warn");
  if (!s.choices) maybeAldredReturns(s);
  tickLoyalty(s);
  if (!s.choices) maybeLeave(s);
  s.day += 1;
  const you = findPerson(s, "player");
  const hungry = s.food + s.smoked === 0;
  if ((you?.hurt ?? 0) > 0 || hungry) s.ap = 3;
  else if (s.tired) s.ap = 4;
  else s.ap = 6;
  if (s.food + s.smoked === 0) {
    s.starve += 1;
    log(s, "There is no meal.", "warn");
    if (s.starve >= 3) return endGame(s, "The hall starves.");
  } else s.starve = 0;
  s.people.forEach((per) => {
    if (per.job === "explore" && !(per.id === "aldred" && s.aldredRange)) per.job = "idle";
    if (per.job === "lot" && !s.lots.some((l) => l.building && !lotIsDone(l))) per.job = "idle";
  });
  if (s.aldredRange) {
    const spear = findPerson(s, "aldred");
    if (spear?.alive) spear.job = "explore";
    else s.aldredRange = false;
  }
  log(s, `— Dawn of day ${s.day} —`);
  if (s.hutAsk && (!slaves(s).length || s.hut || captiveHome(s) === "cage")) s.hutAsk = false;
  if (!s.choices && s.hutAsk) {
    log(s, "Morning. The house has not named a bar.");
    openHutAsk(s, true);
  }
  if (!s.choices) maybePairAsk(s);
  if (!s.choices) maybePair2Ask(s);
  if (!s.choices) s.party = [];
  return s;
}
function escapeCheck(s: GameState, hutGuard: boolean) {
  const held = slaves(s).slice().sort((a, b) => escapeRisk(s, b, hutGuard) - escapeRisk(s, a, hutGuard));
  const home = captiveHome(s);
  const quiet = home === "cage" ? "The bars hold." : home === "hut" ? "The bar holds." : "This roof holds.";
  const tryAt = home === "cage" ? "the bars" : home === "hut" ? "the bar" : "the door";
  let used = false;
  held.forEach((p) => {
    if (s.choices || used) {
      if (s.watch !== "none" && !used) log(s, `${p.name} is quiet. ${quiet}`);
      return;
    }
    const risk = escapeRisk(s, p, hutGuard);
    if (Math.random() > risk) {
      if (s.watch !== "none") log(s, `${p.name} is quiet. ${quiet}`);
      return;
    }
    used = true;
    const outcome = pickEscapeOutcome(s, p);
    if (outcome === "bar") {
      const wname = s.watch === "player" ? "You" : findPerson(s, s.watch)?.name ?? "Watch";
      log(s, `A try at ${tryAt}. ${wname} ${s.watch === "player" ? "are" : "is"} there first. ${p.name} still held.`);
    } else if (outcome === "yard") {
      openYardCatch(s, p);
    } else if (outcome === "stole") {
      letThrallGo(s, p, true);
    } else if (outcome === "violence") {
      escapeViolence(s, p);
    } else {
      letThrallGo(s, p, false);
    }
  });
}

function pickEscapeOutcome(s: GameState, p: Person): "bar" | "yard" | "gone" | "stole" | "violence" {
  const watched = s.watch !== "none";
  const rows: { w: number; v: "bar" | "yard" | "gone" | "stole" | "violence" }[] = watched
    ? [
        { w: 5, v: "bar" },
        { w: 3, v: "yard" },
        { w: 1, v: "gone" },
        { w: p.race === "goblin" ? 2 : 1, v: "stole" },
        { w: p.race === "orc" ? 2 : 1, v: "violence" },
      ]
    : [
        { w: 1, v: "yard" },
        { w: 3, v: "gone" },
        { w: p.race === "goblin" ? 4 : 2, v: "stole" },
        { w: p.race === "orc" ? 3 : 2, v: "violence" },
      ];
  return pickWeighted(rows);
}

function openYardCatch(s: GameState, p: Person) {
  s.pendingEscape = p.id;
  log(s, `${p.name} is in the yard, not yet the trees.`, "warn");
  const copy = holdCopy(s);
  const home = captiveHome(s);
  const extra: SceneLine[] = [];
  if (s.watch === "player") extra.push({ text: VOICE_YARD.player });
  else {
    const w = findPerson(s, s.watch);
    const line = w ? (w.id === "godric" ? copy.godric : yardWatchLine(w.id, home)) : undefined;
    if (w && line) extra.push({ speaker: w.name, text: line });
  }
  const ead = findPerson(s, "eadgyth");
  if (ead?.alive) extra.push({ speaker: "Eadgyth", text: copy.eadgyth });
  setChoices(
    s,
    [
      { id: "escape_yard_back", label: copy.back },
      { id: "escape_yard_run", label: "Let the trees have them" },
    ],
    extra,
  );
}

function letThrallGo(s: GameState, p: Person, stole: boolean) {
  s.escaped = {
    id: p.id,
    name: p.name,
    race: p.race,
    sex: p.sex,
    day: s.day,
    portrait: p.portrait,
    beauty: p.beauty,
    body: p.body,
    str: p.str,
    agi: p.agi,
    end: p.end,
    int: p.int,
    cha: p.cha,
  };
  s.people = s.people.filter((x) => x.id !== p.id);
  if (s.pendingEscape === p.id) s.pendingEscape = null;
  if (p.race === "goblin") s.nightSign = true;
  if (p.race === "orc") s.huntSign = true;
  if (stole) {
    if (s.food > 0) {
      const n = Math.min(4, s.food);
      s.food -= n;
      log(s, `${holdCopy(s).open}. ${p.name} is gone, and ${n} meal with them.`, "warn");
    } else if (s.hide > 0) {
      s.hide -= 1;
      log(s, `${holdCopy(s).open}. ${p.name} is gone, and a hide with them.`, "warn");
    } else {
      log(s, `${holdCopy(s).open}. ${p.name} is gone. Nothing left to take.`, "warn");
    }
  } else {
    log(s, `${holdCopy(s).open}. ${p.name} is gone. Tracks toward the trees.`, "warn");
  }
}

function escapeViolence(s: GameState, p: Person) {
  const w = s.watch === "player" ? findPerson(s, "player") : findPerson(s, s.watch);
  if (w?.alive) {
    woundPerson(s, w, p.race === "orc" ? 7 : 3);
    log(
      s,
      w.id === "player" ? `${p.name} comes at you in the dark.` : `${p.name} comes at ${w.name} in the dark.`,
      "warn",
    );
  } else {
    woundLate(s);
    log(s, `${p.name} finds whoever came out late.`, "warn");
  }
  if (Math.random() < 0.45) letThrallGo(s, p, p.race === "goblin");
  else log(s, `${p.name} is held. ${bloodHoldLine(s)}`, "warn");
}

function oswinArrives(s: GameState) {
  s.oswin = 1;
  s.oswinDays = 2;
  s.oswinBuys = 0;
  s.food += 12;
  log(s, "A small sail takes your poor dock. Oswin comes down last. Casks of meal. 'I knew your father when his hall did not lean.' He will lie two days.");
  setChoices(s, [{
    id: "oswin_tell",
    label: "Tell him of the new folk"
  }, {
    id: "oswin_silent",
    label: "Say nothing"
  }], [{
    speaker: "Oswin",
    text: "Speak of this coast, or keep your counsel. I will not winter."
  }]);
}
function oswinBuy(s: GameState) {
  const held = slaves(s);
  if (!held.length) {
    log(s, "He looks at the yard, counts his crew twice, and will not winter. His stall is on the dock.");
    return;
  }
  const choices: Choice[] = held.map((p) => {
    const price = slavePrice(p);
    return {
      id: `oswin_sell:${p.id}`,
      label: price < 1 ? `${p.name}: he refuses` : `Sell ${p.name} for ${price} silver`
    };
  });
  choices.push({
    id: "oswin_keep",
    label: "Keep them"
  });
  log(s, holdCopy(s).oswinShock);
  const home = captiveHome(s);
  setChoices(s, choices, [{
    speaker: "Oswin",
    text: home === "cage"
      ? "They sleep a proper cage. Exotic stock sells in the old ports. Or they work your rock. I am at the dock two days."
      : home === "hut"
        ? "They sleep a larder. Exotic stock sells in the old ports. Or they work your rock. I am at the dock two days."
        : "Exotic stock sells in the old ports. Or they work your rock. I am at the dock two days."
  }]);
}
export function wallReady(s: GameState): boolean {
  if (s.palisade) return true;
  const storeOk = s.hut ? s.sheds >= 2 : s.sheds >= 1;
  const pressure = s.raidOnce || s.settlersHint || mouths(s) >= 7;
  return storeOk && s.oswin >= 1 && s.renown >= 8 && pressure;
}
function completePalisade(s: GameState) {
  if (s.palisade) return;
  s.palisade = true;
  s.wallProg = BUILD_NEED.wall;
  s.pairAsk = true;
  log(s, "The palisade closes. Dock outside the water-gate. Two houses stand. Two lots wait.", "ok");
  maybeAldredReturns(s);
}
function maybePairAsk(s: GameState) {
  if (s.choices || !s.pairAsk) return;
  if (!s.palisade || s.lots.some((l) => l.building)) {
    s.pairAsk = false;
    return;
  }
  const extra: SceneLine[] = [{
    speaker: "Eadgyth",
    text: "House first is fire and meal. Hands first is pallets and iron. Hold first is a proper cage. Or leave the ground until you know.",
  }];
  const osric = findPerson(s, "osric");
  if (osric?.alive) extra.push({ speaker: "Osric", text: "Timber is timber. The name is yours." });
  setChoices(s, [
    { id: "pair_house", label: "House first — hearth and a store" },
    { id: "pair_hands", label: "Hands first — bunks and a workshop" },
    { id: "pair_hold", label: "Hold first — a proper cage and a store" },
    { id: "pair_later", label: "Name them later" },
  ], extra);
}

export function namePairReady(s: GameState): "first" | "next" | null {
  if (s.choices) return null;
  const c = s.lots.find((l) => l.id === "c");
  const d = s.lots.find((l) => l.id === "d");
  if (s.pairDone && c && d && !c.building && !d.building && !s.namedPair2 && !s.pair2Ask) return "next";
  const a = s.lots.find((l) => l.id === "a");
  const b = s.lots.find((l) => l.id === "b");
  if (s.palisade && a && b && !a.building && !b.building && !s.namedPair && !s.pairAsk) return "first";
  return null;
}

function askName(s: GameState): GameState {
  if (s.choices) return s;
  const ready = namePairReady(s);
  if (ready === "next") {
    s.pair2Ask = true;
    maybePair2Ask(s);
    return s;
  }
  if (ready === "first") {
    s.pairAsk = true;
    maybePairAsk(s);
    return s;
  }
  log(s, "The ground already has a name, or a stake.");
  return s;
}
function namePair(s: GameState, kind: NamedPair) {
  const a = s.lots.find((l) => l.id === "a");
  const b = s.lots.find((l) => l.id === "b");
  if (!a || !b || a.building || b.building) {
    s.pairAsk = false;
    return;
  }
  if (kind === "house") {
    a.building = "hearthhouse";
    b.building = "store";
    s.namedPair = "house";
    log(s, "House first. Hearth-house on lot a, a store on lot b. Timber and labor still to raise them.");
  } else if (kind === "hands") {
    a.building = "bunkhouse";
    b.building = "workshop";
    s.namedPair = "hands";
    log(s, "Hands first. Bunk-house and a workshop. The hangers will sleep if you raise them.");
  } else {
    a.building = "thrallhut";
    b.building = "store";
    s.namedPair = "hold";
    log(s, "Hold first. A proper cage and a store. The free will see the bars.");
  }
  a.prog = 0;
  b.prog = 0;
  s.pairAsk = false;
}
export const LOT_BUILDINGS: { id: LotBuildingId; name: string; wood: number; labor: number; note: string }[] = [
  {
    id: "store",
    name: "Second store",
    wood: 2,
    labor: 2,
    note: "Meal off the sleeping-floor."
  },
  {
    id: "smokehouse",
    name: "Smokehouse",
    wood: 3,
    labor: 3,
    note: "Fish and meat keep."
  },
  {
    id: "thrallhut",
    name: "Cage",
    wood: 3,
    labor: 3,
    note: "Holds two or three. Escape falls."
  },
  {
    id: "bunkhouse",
    name: "Bunk-house",
    wood: 4,
    labor: 4,
    note: "Sleeps four free. Hangers leave the hall."
  },
  {
    id: "workshop",
    name: "Workshop",
    wood: 4,
    labor: 5,
    note: "Later work goes faster."
  },
  {
    id: "hearthhouse",
    name: "Hearth-house",
    wood: 3,
    labor: 3,
    note: "Fire and food away from sleep."
  }
];
function startLot(s: GameState, lotId: LotId, building: LotBuildingId): GameState {
  if (!s.palisade || s.choices) return s;
  const lot = s.lots.find((l) => l.id === lotId);
  if (!lot || lot.building) return s;
  lot.building = building;
  lot.prog = 0;
  log(s, `Stakes go down for a ${LOT_BUILDINGS.find((b) => b.id === building)?.name ?? "building"} on lot ${lotId}.`);
  return s;
}
export const LOT_PIN: Record<LotBuildingId, string> = {
  store: "Store",
  smokehouse: "Smoke",
  thrallhut: "Thralls",
  bunkhouse: "Bunks",
  workshop: "Shop",
  hearthhouse: "Hearth",
};

function completeLotBuilding(s: GameState, lot: Lot) {
  const spec = LOT_BUILDINGS.find((b) => b.id === lot.building);
  if (!spec) return;
  log(s, `The ${spec.name} stands on lot ${lot.id}. ${spec.note}`, "ok");
  if (lot.building === "store") {
    s.sheds += 1;
    s.leakyShed = false;
  }
  if (lot.building === "workshop") s.workshop = true;
  if (lot.building === "bunkhouse") {
    s.people.forEach((p) => {
      if (isHand(p.id)) p.loyalty = Math.min(10, p.loyalty + 2);
    });
    log(s, "New hands sleep like folk with a roof. Loyalty holds better.");
    maybeAldredReturns(s);
  }
  if (lot.building === "hearthhouse") log(s, "The hall smells like people again. Food waste falls.");
  if (lot.building === "thrallhut") log(s, "The cage is timbered properly. The free look at it and know your mind.");
  maybePairDone(s);
  maybePair2Done(s);
}

function applyLotLabor(s: GameState, lot: Lot, labor: number): number {
  if (!lot.building || labor <= 0) return labor;
  const spec = LOT_BUILDINGS.find((b) => b.id === lot.building);
  if (!spec || lotIsDone(lot)) return labor;
  if (lot.prog === 0) {
    if (s.wood < spec.wood) {
      log(s, `Lot ${lot.id} waits on wood (${spec.wood}).`, "warn");
      return labor;
    }
    s.wood -= spec.wood;
  }
  const used = toward(lot.prog, spec.labor, labor);
  lot.prog += used;
  if (lotIsDone(lot)) completeLotBuilding(s, lot);
  else log(s, `Lot ${lot.id} rises. ${lot.prog}/${spec.labor}.`);
  return labor - used;
}

function spillLotLabor(s: GameState, labor: number, skipId?: LotId) {
  if (!s.palisade || labor <= 0) return;
  for (const lot of s.lots) {
    if (labor <= 0) break;
    if (skipId && lot.id === skipId) continue;
    labor = applyLotLabor(s, lot, labor);
  }
}

function finishLots(s: GameState, labor: number) {
  spillLotLabor(s, labor);
}

function runYardJobs(s: GameState, smokeNames: string[], craftNames: string[], hearthNames: string[]) {
  if (smokeNames.length) {
    if (!hasBuilding(s, "smokehouse")) {
      log(s, `${namesOf(smokeNames)} wait on racks that are not built.`, "warn");
    } else {
      const used = Math.min(smokeNames.length, s.wood);
      s.wood -= used;
      let hung = 0;
      for (let i = 0; i < used; i += 1) {
        const take = Math.min(4, s.food);
        if (take < 1) break;
        s.food -= take;
        s.smoked += take;
        hung += take;
      }
      if (hung) log(s, `${namesOf(smokeNames.slice(0, used))} hang ${hung} on the racks. They will keep.`);
      if (used < smokeNames.length) log(s, "The smoke waits on wood.", "warn");
      if (used && s.food < 1 && hung === 0) log(s, "The racks are ready. Nothing to hang.", "warn");
    }
  }
  if (craftNames.length) {
    if (!hasBuilding(s, "workshop")) {
      log(s, `${namesOf(craftNames)} wait on a bench that is not built.`, "warn");
    } else {
      const did: string[] = [];
      craftNames.forEach((name) => {
        if (s.iron < 1) return;
        s.iron -= 1;
        const lotsUp = s.lots.some((l) => l.building && !lotIsDone(l));
        if (s.toolsDays === 0 && !lotsUp) {
          s.toolsDays = 8;
          did.push(`${name} sets an edge`);
        } else {
          s.nails += 3;
          did.push(`${name} cuts nails`);
        }
      });
      if (did.length) log(s, `${did.join(". ")}.`);
      if (did.length < craftNames.length) log(s, "The bench waits on iron.", "warn");
    }
  }
  if (hearthNames.length) {
    if (!hasBuilding(s, "hearthhouse")) {
      log(s, `${namesOf(hearthNames)} wait on a fire that is not built.`, "warn");
    } else if (s.wood < 1) {
      log(s, "No wood for the new fire.", "warn");
    } else {
      s.wood -= 1;
      s.hearthTended = true;
      log(s, `${namesOf(hearthNames)} ${hearthNames.length === 1 ? "tends" : "tend"} the new fire. Meal will waste less tonight.`);
    }
  }
}

function burnFirewood(s: GameState): boolean {
  if (!s.exploreOpen) return false;
  if (s.hearthTended) return false;
  if (s.wood >= 1) {
    s.wood -= 1;
    log(s, "The hall fire takes a load.");
    return false;
  }
  log(s, "No wood for the fire. The hall is cold.", "warn");
  return true;
}

function maybePairDone(s: GameState) {
  const a = s.lots.find((l) => l.id === "a");
  const b = s.lots.find((l) => l.id === "b");
  if (!a || !b || !lotIsDone(a) || !lotIsDone(b)) return;
  if (!s.pairDone) {
    s.pairDone = true;
    const ead = findPerson(s, "eadgyth");
    const eadric = findPerson(s, "eadric");
    if (s.namedPair === "house") {
      if (ead) ead.loyalty = Math.min(10, ead.loyalty + 1);
      log(s, "House first, finished. The hall smells like people again. Meal waste falls. Crowding is not solved.");
      if (ead?.alive) log(s, "Eadgyth's patience resets. The fire is where it belongs.");
      if (eadric?.alive) log(s, "Eadric: fire and meal are well. Men still sleep on the hall-floor.");
    } else if (s.namedPair === "hands") {
      log(s, "Hands first, finished. Hangers leave the hall. Later work goes faster. Meal and fire are still in the sleeping-room.");
      if (slaves(s).length && !hasBuilding(s, "thrallhut")) {
        log(s, s.hut
          ? "A thrall in a larder, beside free bunks. The new hands see it."
          : "A prisoner among the free, beside free bunks. The new hands see it.", "warn");
      }
      if (eadric?.alive) log(s, "Eadric nods at the pallets. He wanted men housed.");
    } else if (s.namedPair === "hold") {
      log(s, s.hut
        ? "Hold first, finished. Captives leave the larder. Escape will cost more. The free look at it and know your mind."
        : "Hold first, finished. Captives leave the hall. Escape will cost more. The free look at it and know your mind.");
      if (eadric?.alive) log(s, "Eadric: they will see the cage before the fire.");
      s.people.forEach((p) => {
        if (isHand(p.id) && p.status === "free") p.loyalty = Math.max(1, p.loyalty - 1);
      });
    } else {
      log(s, "The first two lots stand. The ring has more ground.");
    }
  }
  openSecondYard(s);
}

function standingBuildings(s: GameState): Set<LotBuildingId> {
  const have = new Set<LotBuildingId>();
  s.lots.forEach((l) => {
    if (l.building) have.add(l.building);
  });
  return have;
}

function pairBuildingsFor(s: GameState, kind: NamedPair): [LotBuildingId, LotBuildingId] | null {
  const have = standingBuildings(s);
  const unused = (ids: LotBuildingId[]) => ids.filter((id) => !have.has(id));
  if (kind === "house") {
    const free = unused(["hearthhouse", "smokehouse", "store"]);
    if (free.length >= 2) return [free[0]!, free[1]!];
    if (free.length === 1) return [free[0]!, "store"];
    return null;
  }
  if (kind === "hands") {
    const free = unused(["bunkhouse", "workshop"]);
    if (free.length >= 2) return [free[0]!, free[1]!];
    if (free.length === 1) {
      const extra = unused(["smokehouse", "store", "hearthhouse"])[0];
      return extra ? [free[0]!, extra] : [free[0]!, "store"];
    }
    return null;
  }
  const free = unused(["thrallhut", "smokehouse", "store"]);
  if (free.length >= 2) return [free[0]!, free[1]!];
  if (free.length === 1) return [free[0]!, "store"];
  return null;
}

function pair2Label(s: GameState, kind: NamedPair): string {
  const pair = pairBuildingsFor(s, kind);
  const nameOf = (id: LotBuildingId) =>
    id === "hearthhouse" ? "hearth" : id === "smokehouse" ? "smoke" : id === "thrallhut" ? "a proper cage" : id === "bunkhouse" ? "bunks" : id === "workshop" ? "a workshop" : "a store";
  if (!pair) return kind;
  const a = nameOf(pair[0]);
  const b = nameOf(pair[1]);
  if (kind === "house") return `House next — ${a} and ${b}`;
  if (kind === "hands") return `Hands next — ${a} and ${b}`;
  return `Hold next — ${a} and ${b}`;
}

function openSecondYard(s: GameState) {
  if (!s.lots.some((l) => l.id === "c")) {
    s.lots.push({ id: "c", building: null, prog: 0 }, { id: "d", building: null, prog: 0 });
    s.pair2Ask = true;
    log(s, "The ring has more ground. Two lots wait again.");
  }
}

function maybePair2Ask(s: GameState) {
  if (s.choices || !s.pair2Ask) return;
  const c = s.lots.find((l) => l.id === "c");
  const d = s.lots.find((l) => l.id === "d");
  if (!c || !d) {
    s.pair2Ask = false;
    return;
  }
  if (c.building || d.building) {
    s.pair2Ask = false;
    return;
  }
  const choices: Choice[] = [];
  (["house", "hands", "hold"] as NamedPair[]).forEach((kind) => {
    if (pairBuildingsFor(s, kind)) choices.push({ id: `pair2_${kind}`, label: pair2Label(s, kind) });
  });
  choices.push({ id: "pair2_later", label: "Name them later" });
  if (choices.length === 1) {
    s.pair2Ask = false;
    return;
  }
  const extra: SceneLine[] = [{
    speaker: "Eadgyth",
    text: "The first pair stands. The ring still has ground. House, hands, or hold — or leave it unnamed.",
  }];
  const eadric = findPerson(s, "eadric");
  if (eadric?.alive && s.namedPair === "house") extra.push({ speaker: "Eadric", text: "Men still sleep on the hall-floor." });
  else if (eadric?.alive && s.namedPair === "hold") extra.push({ speaker: "Eadric", text: "They saw the bars. Give them pallets or they will walk." });
  else if (eadric?.alive && s.namedPair === "hands") extra.push({ speaker: "Eadric", text: "Meal and fire are still underfoot." });
  setChoices(s, choices, extra);
}

function namePair2(s: GameState, kind: NamedPair) {
  const c = s.lots.find((l) => l.id === "c");
  const d = s.lots.find((l) => l.id === "d");
  const pair = pairBuildingsFor(s, kind);
  if (!c || !d || c.building || d.building || !pair) {
    s.pair2Ask = false;
    return;
  }
  const label = pair2Label(s, kind);
  c.building = pair[0];
  d.building = pair[1];
  c.prog = 0;
  d.prog = 0;
  s.namedPair2 = kind;
  s.pair2Ask = false;
  log(s, `${label}. Timber and labor still to raise them.`);
}

function maybePair2Done(s: GameState) {
  if (s.pair2Done) return;
  const c = s.lots.find((l) => l.id === "c");
  const d = s.lots.find((l) => l.id === "d");
  if (!c || !d || !lotIsDone(c) || !lotIsDone(d)) return;
  s.pair2Done = true;
  const reading = lotReading(s);
  if (reading === "mixed") {
    const fire = hasBuilding(s, "hearthhouse");
    const beds = hasBuilding(s, "bunkhouse");
    if (fire && beds) log(s, "The ring is mixed. Fire, pallets, and bars. They will not know which you meant.");
    else if (fire) log(s, "The ring is mixed. Fire and bars. They will not know which you meant.");
    else log(s, s.hut
      ? "The ring is mixed. Pallets and a proper cage. The larder is empty of them."
      : "The ring is mixed. Pallets and a proper cage.");
  } else if (s.namedPair2 === "house") {
    log(s, "The second pair is house. Fire and racks. The house eats like a house.");
  } else if (s.namedPair2 === "hands") {
    log(s, "The second pair is hands. Pallets and iron. The hall is for talk.");
  } else if (s.namedPair2 === "hold") {
    log(s, "The second pair is hold. The cage is in the ring. Word of this hall will be the bars.");
  } else {
    log(s, "The four lots stand. The ring is named.");
  }
}

function workLot(s: GameState, lotId: LotId): GameState {
  if (!s.palisade) return s;
  const lot = s.lots.find((l) => l.id === lotId);
  if (!lot?.building || lotIsDone(lot)) return s;
  const spec = LOT_BUILDINGS.find((b) => b.id === lot.building);
  if (!spec) return s;
  if (lot.prog === 0 && s.wood < spec.wood) {
    log(s, `Lot ${lot.id} waits on wood (${spec.wood}).`, "warn");
    return s;
  }
  if (!spendAp(s, 1)) return s;
  const given = s.workshop ? 2 : 1;
  const left = applyLotLabor(s, lot, given);
  spillLotLabor(s, left, lot.id);
  if (!s.choices) maybePair2Ask(s);
  return s;
}

function lotAct(s: GameState, lotId: LotId, act: LotAct): GameState {
  const lot = s.lots.find((l) => l.id === lotId);
  if (!lot?.building || !lotIsDone(lot)) return s;
  const b = lot.building;
  const you = findPerson(s, "player");

  if (act === "inspect") {
    if (b === "store") {
      log(s, `The store holds meal ${s.food}${s.smoked ? `, smoked ${s.smoked}` : ""}, wood ${s.wood}, hide ${s.hide}, iron ${s.iron}, rope ${s.rope}, nails ${s.nails}.`);
    } else if (b === "smokehouse") {
      log(s, s.smoked ? `Fish and sides hang. ${s.smoked} smoked. They will keep.` : "The racks are empty. Hang meat and light the fire.");
    } else if (b === "thrallhut") {
      const held = slaves(s);
      log(s, held.length ? `The bars are true. ${held.map((p) => p.name).join(", ")} held. Escape will cost more.` : "The cage is timbered properly. Empty, for now.");
    } else if (b === "bunkhouse") {
      const press = slaves(s).length > 0 && !hasBuilding(s, "thrallhut");
      const larder = press && s.hut;
      const underfoot = !hasBuilding(s, "hearthhouse");
      log(
        s,
        `Four pallets. The hall breathes. Cuthwin sleeps like a man with a roof.${underfoot ? " Meal and fire are still in the sleeping-room." : ""}${larder ? " A thrall in a larder, beside free bunks." : press ? " A prisoner among the free, beside free bunks." : ""}`,
        press ? "warn" : "normal",
      );
    } else if (b === "workshop") {
      log(s, s.toolsDays > 0 ? `Benches, iron, and a whetstone. The edges bite ${s.toolsDays} more dawns.` : "Benches and a cold whetstone. Iron makes nails. A sharpening lasts.");
      if (s.lots.some((l) => l.building && !lotIsDone(l))) log(s, "Later work goes faster. One hand does two.");
    } else {
      log(s, s.hearthTended ? "The new fire is fed. Meal will waste less tonight." : "A fire away from sleep. The hall smells like people again.");
      if (!hasBuilding(s, "bunkhouse")) log(s, "Men still sleep on the hall-floor.");
    }
    return s;
  }

  if (act === "smoke") {
    if (b !== "smokehouse") return s;
    if (s.wood < 1) {
      log(s, "No wood for the smoke.", "warn");
      return s;
    }
    if (s.food < 1) {
      log(s, "Nothing to hang.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    s.wood -= 1;
    const take = Math.min(4, s.food);
    s.food -= take;
    s.smoked += take;
    log(s, `You feed the smoke. ${take} hang. They will keep.`);
    return s;
  }

  if (act === "nails") {
    if (b !== "workshop") return s;
    if (s.iron < 1) {
      log(s, "No iron for the cut.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    s.iron -= 1;
    s.nails += 3;
    log(s, "You cut iron to nails. Three handfuls.");
    return s;
  }

  if (act === "tools") {
    if (b !== "workshop") return s;
    if (s.toolsDays > 3) {
      log(s, "The edges still bite.");
      return s;
    }
    if (s.iron < 1) {
      log(s, "No iron for a new edge.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    s.iron -= 1;
    s.toolsDays = 8;
    log(s, "The edges take a new bite. Wood will come faster for a while.");
    return s;
  }

  if (act === "hearth") {
    if (b !== "hearthhouse") return s;
    if (s.wood < 1) {
      log(s, "No wood for the fire.", "warn");
      return s;
    }
    if (!spendAp(s, 1)) return s;
    s.wood -= 1;
    s.hearthTended = true;
    log(s, "You feed the new fire. Meal will waste less tonight.");
    return s;
  }

  if (act === "rest") {
    if (b !== "bunkhouse" && b !== "hearthhouse") return s;
    if (you && you.hurt > 0) {
      if (!spendAp(s, 1)) return s;
      you.hurt -= 1;
      log(s, b === "bunkhouse" ? "You take a pallet. Sleep knits a little." : "You sit the new fire. The wound eases.");
      return s;
    }
    log(s, b === "bunkhouse" ? "You are whole. The pallet is empty comfort." : "You are whole. The fire is only warmth.");
    return s;
  }

  return s;
}
function joinHanger(s: GameState, id: string) {
  if (s.people.some((p) => p.id === id)) return;
  const h = hangerOf(id);
  if (!h) return;
  if (id === "aldred" && h.job === "idle") h.job = "wood";
  s.people.push(h);
  if (id === "aldred") s.aldredWaiting = false;
}
function openSaewynTalk(s: GameState): GameState {
  if (s.choices || s.saewynTalk || s.saewynDays <= 0) return s;
  if (!findPerson(s, "saewyn")) return s;
  const reading = lotReading(s);
  if (reading === "mixed") {
    const flavor = mixedFlavor(s);
    log(s, flavor === "beds"
      ? "Saewyn looks twice. Pallets and bars. She has the hall's measure, and she does not."
      : flavor === "both"
        ? "Saewyn looks twice. Fire, pallets, and bars. She has the hall's measure, and she does not."
        : "Saewyn looks twice. A house that holds. She has the hall's measure, and she does not.");
  } else if (reading === "hold" || s.namedPair === "hold") {
    log(s, "Saewyn looks at the cage before the fire. She has the hall's measure.");
  } else if (reading === "hands" || s.namedPair === "hands") {
    log(s, s.hut
      ? "Saewyn nods at pallets and a bench. She still sees the barred store."
      : "Saewyn nods at pallets and a bench.");
  } else if (reading === "house" || s.namedPair === "house") {
    log(s, "Saewyn smells the proper fire. She still counts who sleeps on the floor.");
  } else {
    log(s, "Saewyn will speak if you mean it. She buys. She will not winter.");
  }
  setChoices(s, [
    { id: "saewyn_buy", label: "Speak of hall and stock" },
    { id: "saewyn_warm", label: "A warmer word" },
    { id: "saewyn_weather", label: "Give her the weather" },
  ], [
    { speaker: "Saewyn", text: "I buy. I do not winter. The hall is small and the stock is thinner." },
    { speaker: "Eadgyth", text: "She has eyes. So do I." },
  ]);
  return s;
}
function openSaewynStock(s: GameState): GameState {
  if (s.choices || s.saewynDays <= 0 || s.saewynBought) return s;
  if (!findPerson(s, "saewyn")) return s;
  const held = slaves(s);
  if (!held.length) {
    log(s, "Saewyn looks at the yard. No stock for the home market.");
    return s;
  }
  const choices: Choice[] = held.map((p) => {
    const price = slavePrice(p);
    return {
      id: `saewyn_sell:${p.id}`,
      label: price < 1 ? `${p.name}: she refuses` : `Sell ${p.name} for ${price} silver`,
    };
  });
  choices.push({ id: "saewyn_keep", label: "Keep them" });
  const home = captiveHome(s);
  if (home === "cage") {
    log(s, "She prices them from the bars. For the home market, not for this rock.");
    setChoices(s, choices, [
      { speaker: "Saewyn", text: "They sleep a proper cage. Exotic stock sells in the old ports. I buy. I do not winter." },
      { speaker: "Eadgyth", text: "Coin, not a name. She has eyes. The bars do not hide them." },
    ]);
  } else if (home === "hut") {
    log(s, "She prices them from the first store. For the home market, not for this rock.");
    setChoices(s, choices, [
      { speaker: "Saewyn", text: "They sleep a larder. Exotic stock sells in the old ports. I buy. I do not winter." },
      { speaker: "Eadgyth", text: "Coin, not a name. She has eyes. The first store does not hide them." },
    ]);
  } else {
    log(s, "She prices them as a buyer prices: for the home market, not for this rock.");
    setChoices(s, choices, [
      { speaker: "Saewyn", text: "Exotic stock sells in the old ports. I buy. I do not winter." },
      { speaker: "Eadgyth", text: "Coin, not a name. She has eyes." },
    ]);
  }
  return s;
}
function sailSaewyn(s: GameState) {
  const p = findPerson(s, "saewyn");
  if (!p) {
    s.saewynDays = 0;
    return;
  }
  p.alive = false;
  s.people = s.people.filter((x) => x.id !== "saewyn");
  s.saewynDays = 0;
  s.saewynLeftOn = s.day;
  log(s, s.saewynReturn
    ? "Saewyn takes the plank. She will look for this hall again."
    : "Saewyn takes the plank. The hall is poorer for the quiet.");
}
function landSaewyn(s: GameState) {
  joinHanger(s, "saewyn");
  s.saewynDays = 4;
  s.saewynTalk = false;
  s.saewynReturn = false;
  s.saewynBought = false;
}
function maybeSaewynReturn(s: GameState) {
  if (!s.saewynReturn || findPerson(s, "saewyn") || s.oswinDays > 0 || s.choices) return;
  if (s.saewynLeftOn > 0 && s.day < s.saewynLeftOn + 1) return;
  landSaewyn(s);
  log(s, "A small sail takes the water-gate. Saewyn, not Oswin. She said the sea-road was short.");
  const extra: SceneLine[] = [{ speaker: "Saewyn", text: "The sea-road was short. I said it would be." }];
  const eadric = findPerson(s, "eadric");
  if (s.saewynWarm && eadric?.alive) extra.push({ speaker: "Eadric", text: "Again. The house is not a stall for her." });
  else extra.push({ speaker: "Eadgyth", text: "A buyer, not a hand. The roof already knows that." });
  setChoices(s, [{ id: "saewyn_home", label: "The hall is open" }], extra);
}
function maybeAldredReturns(s: GameState) {
  if (findPerson(s, "aldred")) {
    s.aldredWaiting = false;
    return;
  }
  if (!s.aldredWaiting || s.choices) return;
  if (!s.palisade && !hasBuilding(s, "bunkhouse")) return;
  joinHanger(s, "aldred");
  log(s, "Aldred takes the path back. The timber is closed. He claims a corner and a spear.", "ok");
}
function maybeOswinReturn(s: GameState) {
  if (s.choices) return;
  if (!(s.wordOut || s.settlersHint) || s.renown < 8) return;
  if (!s.palisade && s.day < 16) return;
  if (s.palisade && s.day < 10) return;
  s.oswin = 2;
  s.oswinDays = 2;
  s.oswinBuys = 0;
  s.food += 10;
  s.iron += 1;
  log(s, "Oswin's sail is larger this time. Faces you do not know wait on the plank. Cuthwin, Hilda, a spear-man called Aldred. A woman in good cloth: Saewyn. His stall is up again.");
  const reading = lotReading(s);
  const extra: SceneLine[] = [{
    speaker: "Oswin",
    text: "Word travelled. These will work your rock, if you will have them."
  }];
  if (reading === "mixed") {
    const flavor = mixedFlavor(s);
    extra.push({
      speaker: "Oswin",
      text: flavor === "beds"
        ? "Pallets and bars. Hands that hold. I cannot tell which you meant."
        : flavor === "both"
          ? "Fire, pallets, and bars. I cannot tell which you meant."
          : "Fire and bars. A house that holds. I cannot tell which you meant.",
    });
    extra.push({
      speaker: "Saewyn",
      text: flavor === "beds"
        ? "Intent mixed. You house them and keep them."
        : "Intent mixed. You eat like a house and keep like a hold.",
    });
  } else if (reading === "hold" || s.namedPair === "hold") {
    extra.push({ speaker: "Oswin", text: "I saw the cage first. That is a mind I can sell in the old ports." });
    extra.push({ speaker: "Saewyn", text: "Intent at a glance. You built a hold." });
  } else if (reading === "hands" || s.namedPair === "hands") {
    extra.push({ speaker: "Oswin", text: "Pallets and iron. Hands will stay if you house them." });
  } else if (reading === "house" || s.namedPair === "house") {
    extra.push({ speaker: "Oswin", text: "A fire away from sleep. The hall smells like people again." });
    extra.push({ speaker: "Eadric", text: "Fire and meal. Men still sleep on the floor." });
  }
  setChoices(s, [
    {
      id: "oswin2_house",
      label: "House those who will work"
    },
    {
      id: "oswin2_cuthwin",
      label: "Take Cuthwin only"
    },
    {
      id: "oswin2_away",
      label: "Turn them away"
    }
  ], extra);
}

function maybeOswinThird(s: GameState) {
  if (s.choices || s.oswinDays > 0) return;
  if (s.oswin !== 2) return;
  if (!s.pairDone) return;
  if (s.oswinGoneOn > 0 && s.day < s.oswinGoneOn + 4) return;
  if (s.oswinGoneOn === 0 && s.day < 16) return;
  s.oswin = 3;
  s.oswinDays = 2;
  s.oswinBuys = 0;
  s.iron += 1;
  s.nails += 1;
  const reading = lotReading(s);
  log(s, "Oswin's sail again. The stall is up. He looks at the ring as a man looks at a market.");
  if (reading === "mixed") {
    const flavor = mixedFlavor(s);
    log(s, flavor === "beds"
      ? "He looks twice. Pallets and a cage in the ring. He cannot tell which you meant. He buys both stories."
      : flavor === "both"
        ? "He looks twice. Fire, pallets, and a cage. He cannot tell which you meant. He buys both stories."
        : "He looks twice. A fire away from sleep, and a cage in the ring. He cannot tell which you meant. He buys both stories.");
  } else if (reading === "hold") log(s, "He saw the cage first. That is a mind he can sell in the old ports. He buys piles. He will not winter.");
  else if (reading === "hands") {
    log(s, "He nods at pallets and a bench. Hands stay if you house them. He buys what they make.");
    if (slaves(s).length && !hasBuilding(s, "thrallhut")) {
      log(s, s.hut
        ? "He sees the barred store beside the bunks. He will price that too."
        : "He sees a prisoner among the free, beside the bunks. He will price that too.");
    }
  } else if (reading === "house") log(s, "He smells the proper fire. A hall that eats like a hall. He will take smoked if you have it.");
  else log(s, "He counts the roofs. Not a camp. He buys piles. He sells iron. He will not winter.");
  if (!findPerson(s, "saewyn")) {
    landSaewyn(s);
    s.saewynDays = 2;
    log(s, "Saewyn comes down after him. She looks at the yard as a buyer looks. She will not winter. Speak with her, or she takes the weather.");
  }
}

export function lotReading(s: GameState): "house" | "hands" | "hold" | "mixed" | "open" {
  const done = s.lots.filter((l) => lotIsDone(l)).map((l) => l.building);
  const has = (id: LotBuildingId) => done.includes(id);
  if (done.length === 0) return "open";
  const cage = has("thrallhut");
  const beds = has("bunkhouse");
  const fire = has("hearthhouse");
  if (cage && (beds || fire)) return "mixed";
  if (cage) return "hold";
  if (beds && has("workshop")) return "hands";
  if (fire && (has("store") || s.sheds >= 2)) return "house";
  if (beds) return "hands";
  if (fire || has("store")) return "house";
  return "mixed";
}

export function mixedFlavor(s: GameState): "both" | "fire" | "beds" {
  const fire = hasBuilding(s, "hearthhouse");
  const beds = hasBuilding(s, "bunkhouse");
  if (fire && beds) return "both";
  if (fire) return "fire";
  return "beds";
}

function maybeSettlers(s: GameState) {
  if (s.settlersLanded || s.settlersAsk || s.choices) return;
  if (!s.palisade || s.oswin < 2 || s.renown < 8) return;
  if (!s.wordOut && !s.settlersHint) return;
  if (!s.lots.some((l) => lotIsDone(l))) return;
  if (s.day < 14) return;
  const reading = lotReading(s);
  s.settlersAsk = true;
  const hold = reading === "hold";
  const offering = hold ? "Leofric and Æthel" : "Leofric, Æthel, and Dunstan";
  const twoSails = s.oswinDays > 0;
  const lead = twoSails ? "A second sail takes the water-gate. Not Oswin's." : "A worn sail takes the water-gate. Not Oswin's.";
  let saewynCame = false;
  if (s.saewynReturn && !findPerson(s, "saewyn")) {
    landSaewyn(s);
    saewynCame = true;
  }
  if (hold) {
    log(s, `${lead} ${offering} wait on the plank. Dunstan looks at the cage and will not leave the boat.`);
  } else if (reading === "mixed") {
    const fire = hasBuilding(s, "hearthhouse");
    const beds = hasBuilding(s, "bunkhouse");
    const seen = fire && beds ? "a fire and pallets, then bars" : fire ? "a fire, then bars" : "pallets, then bars";
    log(s, `${lead} ${offering}. They see ${seen}. Dunstan looks twice and steps off anyway.`);
  } else if (reading === "hands") {
    log(s, `${lead} ${offering}. They see pallets through the gate and put their packs down.`);
  } else if (reading === "house") {
    log(s, `${lead} ${offering}. Smoke from a proper fire. The hall will still sleep tight.`);
  } else {
    log(s, `${lead} ${offering}. They heard of a hall on a wild shore.`);
  }
  const extra: SceneLine[] = [];
  if (hold) extra.push({ speaker: "Eadric", text: "They saw the bars before the fire." });
  else if (reading === "mixed") {
    const flavor = mixedFlavor(s);
    extra.push({
      speaker: "Eadric",
      text: flavor === "both"
        ? "Fire, pallets, and a cage. He will sleep in a bed, in sight of the bars."
        : flavor === "fire"
          ? "Fire and meal, and a cage in the ring. He will sleep in sight of it."
          : "Pallets, and a cage in the ring. He will sleep in sight of it.",
    });
  }
  else if (reading === "hands") extra.push({ speaker: "Eadgyth", text: "Beds first. They will stay if you let them." });
  else if (reading === "house") extra.push({ speaker: "Eadric", text: "Fire and meal are well. Men still sleep on the hall-floor." });
  else extra.push({ speaker: "Eadgyth", text: "Mouths enough. The roof will tell you if you were ready." });
  if (twoSails) extra.push({ speaker: "Oswin", text: "Not cargo I priced. Their keep is yours." });
  if (saewynCame) extra.push({ speaker: "Saewyn", text: "The sea-road was short. I said it would be." });
  else if (findPerson(s, "saewyn")) {
    extra.push({
      speaker: "Saewyn",
      text: hold
        ? "One of them looked at the bars and stayed on the boat. I would."
        : reading === "mixed"
          ? "They looked twice. I would."
          : "I came on his stall. They came asking for a roof.",
    });
  }
  setChoices(
    s,
    [
      { id: "settlers_house", label: hold ? "House those who will stay" : "House them" },
      { id: "settlers_leofric", label: "Take Leofric only" },
      { id: "settlers_away", label: "Turn the sail" },
    ],
    extra,
  );
}

function takeSettlers(s: GameState, who: "all" | "leofric") {
  const reading = lotReading(s);
  let loyalty = 4;
  if (reading === "hands") loyalty = 6;
  else if (reading === "house") loyalty = 5;
  else if (reading === "mixed") loyalty = mixedFlavor(s) === "fire" ? 4 : 5;
  else if (reading === "hold") loyalty = 3;
  const ids = who === "leofric" ? ["leofric"] : reading === "hold" ? ["leofric", "aethel"] : ["leofric", "aethel", "dunstan"];
  ids.forEach((id) => {
    joinHanger(s, id);
    const p = findPerson(s, id);
    if (p) p.loyalty = Math.min(10, loyalty);
  });
  s.food += who === "all" ? 4 : 2;
  s.renown += who === "all" ? 1 : 0;
  const named = ids.map((id) => findPerson(s, id)?.name).filter((n): n is string => Boolean(n));
  const names = named.length <= 2 ? named.join(" and ") : `${named[0]}, ${named[1]}, and ${named[2]}`;
  if (who === "leofric") log(s, "Leofric takes a corner and an axe. The rest go back up the plank.");
  else if (reading === "hold") log(s, `${names} stay. The free look at the cage and know your mind. +1 Renown.`);
  else if (reading === "hands") log(s, `${names} take pallets. Loyalty holds better. +1 Renown.`, "ok");
  else if (reading === "mixed") {
    log(s, mixedFlavor(s) === "fire"
      ? `${names} come under the roof. They looked twice. Meal for a day or two in their packs. +1 Renown.`
      : `${names} take pallets. They looked twice. +1 Renown.`, mixedFlavor(s) === "fire" ? "normal" : "ok");
  }
  else log(s, `${names} come under the roof. Meal for a day or two in their packs. +1 Renown.`);
  if (crowding(s) > 0) log(s, "The roof is already too small.", "warn");
}

function formGate(s: GameState) {
  const ids = ["player"];
  if (s.watch !== "none" && s.watch !== "player") ids.push(s.watch);
  s.party = ids;
}

function huntWeight(s: GameState): "light" | "even" | "heavy" {
  const hall = s.huntHits >= 2;
  if (hall && !(s.palisade && s.watchPost)) return "heavy";
  if (s.palisade) return "even";
  return "even";
}

function huntAside(s: GameState, hall: boolean): SceneLine[] {
  const extra: SceneLine[] = [];
  if (s.watch === "player") {
    extra.push({ text: hall ? "You hear them at the hall-door. Not goblins." : "You hear them on the game-side of the timber." });
  } else {
    const w = findPerson(s, s.watch);
    if (w) extra.push({ speaker: w.name, text: VOICE_HUNT[w.id] ?? "Heavy feet. Not goblins." });
  }
  const mother = findPerson(s, "eadgyth");
  if (mother?.alive && s.watch !== "eadgyth") extra.push({ speaker: mother.name, text: "Inside. Bar it." });
  const spear = findPerson(s, "aldred");
  if (spear?.alive && s.watch !== "aldred") extra.push({ speaker: spear.name, text: VOICE_HUNT.aldred ?? "Spear-work." });
  return extra;
}

function maybeOrcHunt(s: GameState) {
  if (!s.huntSign || s.choices || s.oswinDays > 0) return;
  if (s.escaped?.race === "orc" && s.escaped.day >= s.day) return;
  const watched = s.watch !== "none";
  const hall = s.huntHits >= 2;
  const same = s.escaped?.race === "orc";
  const who = same ? s.escaped!.name : "the hunters";

  if (!watched) {
    strikeHunt(s, hall);
    return;
  }

  s.huntSign = false;
  if (hall) {
    s.renown += 1;
    log(
      s,
      s.watchPost
        ? `The post sees them on the game-side. ${who} try the hall and find a watch. +1 Renown.`
        : `Watch hears them at the hall-door. Hunters. ${who}. +1 Renown.`,
      "ok",
    );
  } else {
    log(
      s,
      s.watchPost
        ? `The post sees them first. ${who} on the game-trail.`
        : `Watch hears them in the timber. ${who}.`,
    );
  }
  const choices: Choice[] = [
    { id: "hunt_stand", label: hall ? "Stand the door" : "Stand the gate" },
    { id: "hunt_drive", label: "Drive them off" },
  ];
  if (s.palisade) choices.push({ id: "hunt_bar", label: "Bar the timber" });
  setChoices(s, choices, huntAside(s, hall));
}

function strikeHunt(s: GameState, hall: boolean) {
  s.huntSign = false;
  s.huntHits += 1;
  const n = Math.min(s.food, hall ? 8 : 4);
  if (hall && n >= 2) {
    s.food -= n;
    log(s, `Hunters at the hall-door. No watch. ${n} meal gone. The timber is theirs.`, "warn");
  } else {
    log(s, hall ? "Hunters at the hall-door. No watch. They cut whoever came out." : "Hunters on the game-side. No watch. They cut whoever came out.", "warn");
  }
  woundLate(s);
  if (hall) woundLate(s);
  if (s.huntHits >= 3) {
    const easy = s.people.filter((p) => p.alive && !p.guest && (p.id === "wulfric" || p.id === "godric") && p.hurt < 7);
    const pool = easy.length ? easy : s.people.filter((p) => p.alive && !p.guest && p.id !== "eadgyth" && p.id !== "player" && !isKin(p.id));
    if (pool.length && Math.random() < 0.4) {
      const p = pool[Math.floor(Math.random() * pool.length)]!;
      killPerson(s, p);
    }
  }
  const you = findPerson(s, "player");
  const standing = living(s).filter((p) => p.hurt < 7);
  if (standing.length === 0 && ((you?.hurt ?? 0) >= 7 || living(s).length === 0)) {
    endGame(s, "The hunters hit the hall and nobody is left standing.");
  }
}

function elfAside(s: GameState): SceneLine[] {
  const extra: SceneLine[] = [];
  if (s.watch === "player") extra.push({ text: "Marks at the tree-line. Not goblins. Not hunters." });
  else {
    const w = findPerson(s, s.watch);
    if (w) extra.push({ speaker: w.name, text: VOICE_ELF_NIGHT[w.id] ?? "Marks on the old timber." });
  }
  const mother = findPerson(s, "eadgyth");
  if (mother?.alive && s.watch !== "eadgyth") extra.push({ speaker: mother.name, text: "Leave their trees. We have a hall." });
  return extra;
}

function dwarfAside(s: GameState): SceneLine[] {
  const extra: SceneLine[] = [];
  if (s.watch === "player") extra.push({ text: "Stone-watchers at the tree-line. They followed you home." });
  else {
    const w = findPerson(s, s.watch);
    if (w) extra.push({ speaker: w.name, text: VOICE_DWARF_NIGHT[w.id] ?? "They followed us home." });
  }
  const mother = findPerson(s, "eadgyth");
  if (mother?.alive && s.watch !== "eadgyth") extra.push({ speaker: mother.name, text: "Offer and step back. This is not a raid." });
  return extra;
}

function maybeElfMark(s: GameState) {
  if (!s.elfSign || s.choices || s.oswinDays > 0) return;
  const watched = s.watch !== "none";
  if (!watched) {
    strikeElf(s);
    return;
  }
  s.elfSign = false;
  s.renown += 1;
  log(
    s,
    s.watchPost
      ? "The post sees marks on the old timber. They followed the path we cut. +1 Renown."
      : "Watch sees marks at the tree-line. Not thieves. A border, at our own trees. +1 Renown.",
    "ok",
  );
  const choices: Choice[] = [
    { id: "elf_mark_stand", label: "Stand the tree-line" },
    { id: "elf_mark_leave", label: "Leave their trees" },
  ];
  if (s.palisade) choices.push({ id: "elf_mark_bar", label: "Bar the timber" });
  setChoices(s, choices, elfAside(s));
}

function strikeElf(s: GameState) {
  s.elfSign = false;
  s.elfGrudge += 1;
  const take = Math.min(s.wood, s.elfGrudge >= 3 ? 3 : 2);
  if (take > 0) s.wood -= take;
  const cutters = s.people.filter((p) => p.alive && !p.guest && p.job === "wood" && p.hurt < 7);
  const target = cutters[0];
  if (target) {
    woundPerson(s, target, 3);
    log(s, `An arrow from the old timber. No watch. ${target.name} takes it${take ? `, and ${take} wood is gone` : ""}.`, "warn");
  } else {
    woundLate(s);
    log(s, take ? `An arrow in the palisade. No watch. ${take} wood gone. They know this hall.` : "An arrow in the palisade. No watch. They know this hall.", "warn");
  }
  if (s.elfGrudge >= 3) {
    const easy = s.people.filter((p) => p.alive && !p.guest && (p.id === "wulfric" || p.id === "godric") && p.hurt < 7);
    const pool = easy.length ? easy : cutters.length ? cutters : s.people.filter((p) => p.alive && !p.guest && p.id !== "eadgyth" && p.id !== "player" && !isKin(p.id));
    if (pool.length && Math.random() < 0.4) {
      const p = pool[Math.floor(Math.random() * pool.length)]!;
      killPerson(s, p);
    }
  }
  const you = findPerson(s, "player");
  const standing = living(s).filter((p) => p.hurt < 7);
  if (standing.length === 0 && ((you?.hurt ?? 0) >= 7 || living(s).length === 0)) {
    endGame(s, "The timber answers and nobody is left standing.");
  }
}

function maybeDwarfFollow(s: GameState) {
  if (!s.dwarfSign || s.choices || s.oswinDays > 0) return;
  const watched = s.watch !== "none";
  if (!watched) {
    strikeDwarf(s);
    return;
  }
  s.dwarfSign = false;
  s.renown += 1;
  log(
    s,
    s.watchPost
      ? "The post sees them stop at the tree-line. Stone-watchers. They followed us home. +1 Renown."
      : "Watch sees them at the tree-line. They followed us home. Iron, not meal. +1 Renown.",
    "ok",
  );
  setChoices(
    s,
    [
      { id: "dwarf_follow_offer", label: "Offer and step back" },
      { id: "dwarf_follow_drive", label: "Drive them off" },
      { id: "dwarf_follow_leave", label: "Leave the cut" },
    ],
    dwarfAside(s),
  );
}

function strikeDwarf(s: GameState) {
  s.dwarfSign = false;
  s.dwarfGrudge += 1;
  if (s.iron > 0) {
    s.iron -= 1;
    log(s, "Followed home. No watch. They walked the yard and took iron.", "warn");
  } else if (s.nails > 0) {
    s.nails -= 1;
    log(s, "Followed home. No watch. They took nails from the bench.", "warn");
  } else if (s.toolsDays > 0) {
    s.toolsDays = 0;
    log(s, "Followed home. No watch. The workshop edge is ruined.", "warn");
  } else {
    log(s, "Followed home. No watch. Nothing worth taking. They cut whoever came out.", "warn");
    woundLate(s);
  }
  if (s.dwarfGrudge >= 3) {
    if (s.toolsDays > 0) s.toolsDays = 0;
    woundLate(s);
  }
}

function trollAside(s: GameState): SceneLine[] {
  const extra: SceneLine[] = [];
  if (s.watch === "player") {
    extra.push({ text: "The stink is on the water. Something huge is at the pilings." });
  } else {
    const w = findPerson(s, s.watch);
    if (w) extra.push({ speaker: w.name, text: VOICE_TROLL_NIGHT[w.id] ?? "The stink is on our water." });
  }
  const mother = findPerson(s, "eadgyth");
  if (mother?.alive && s.watch !== "eadgyth") extra.push({ speaker: mother.name, text: VOICE_TROLL_NIGHT.eadgyth ?? "Inside." });
  const spear = findPerson(s, "aldred");
  if (spear?.alive && s.watch !== "aldred") extra.push({ speaker: spear.name, text: VOICE_TROLL_NIGHT.aldred ?? "Not spear-work." });
  return extra;
}

function maybeTrollGate(s: GameState) {
  if (s.contacts.troll_dead) {
    s.trollSign = false;
    return;
  }
  if (!s.trollSign || s.choices || s.oswinDays > 0) return;
  const watched = s.watch !== "none";
  if (!watched) {
    strikeTroll(s);
    return;
  }
  s.trollSign = false;
  const hall = s.trollHits >= 2;
  log(
    s,
    s.watchPost
      ? hall
        ? "The post sees it at the water-gate. Not goblins. The stink is at the door."
        : "The post sees it first. The stink has come down the water."
      : hall
        ? "Watch hears it at the hall-side of the dock. Not a people."
        : "Watch hears it in the water. The stink is at the pilings.",
  );
  setChoices(
    s,
    [
      { id: "troll_gate_stand", label: hall ? "Stand the door" : "Stand the water" },
      { id: "troll_gate_throw", label: "Throw meal and give the bank" },
      { id: "troll_gate_give", label: "Give the dock" },
    ],
    trollAside(s),
  );
}

function strikeTroll(s: GameState) {
  s.trollSign = false;
  s.trollHits += 1;
  const hall = s.trollHits >= 2;
  const n = Math.min(s.food, hall ? 10 : 6);
  if (n) s.food -= n;
  log(
    s,
    hall
      ? n
        ? `The thing from the stream tries the hall. No watch. ${n} meal gone.`
        : "The thing from the stream tries the hall. No watch. It cuts whoever came out."
      : n
        ? `The thing from the stream feeds at the dock. No watch. ${n} meal gone.`
        : "The thing from the stream at the dock. No watch. It cuts whoever came out.",
    "warn",
  );
  const fisher = s.people.find((p) => p.alive && !p.guest && p.job === "fish" && p.hurt < 7);
  if (fisher) {
    fisher.hurt = Math.max(fisher.hurt, hall ? 7 : 3);
    log(s, `${fisher.name} was on the water. The stink finds them.`, "warn");
  } else {
    woundLate(s);
  }
  if (hall) woundLate(s);
  if (s.trollHits >= 3) {
    const easy = s.people.filter((p) => p.alive && !p.guest && (p.id === "wulfric" || p.id === "godric") && p.hurt < 7);
    const pool = easy.length ? easy : s.people.filter((p) => p.alive && !p.guest && p.id !== "eadgyth" && p.id !== "player");
    if (pool.length && Math.random() < 0.4) {
      const p = pool[Math.floor(Math.random() * pool.length)]!;
      killPerson(s, p);
    }
  }
  const you = findPerson(s, "player");
  const standing = living(s).filter((p) => p.hurt < 7);
  if (standing.length === 0 && ((you?.hurt ?? 0) >= 7 || living(s).length === 0)) {
    endGame(s, "The thing from the stream hits the hall and nobody is left standing.");
  }
}

function raidAside(s: GameState, hall: boolean): SceneLine[] {
  const extra: SceneLine[] = [];
  const table = hall ? VOICE_HALL_RAID : VOICE_RAID;
  if (s.watch === "player") {
    extra.push({ text: hall ? "You hear them at the hall-door." : "You hear them at the pilings." });
  } else {
    const w = findPerson(s, s.watch);
    if (w) extra.push({ speaker: w.name, text: table[w.id] ?? (hall ? "They are at the door." : "Small feet on wet wood.") });
  }
  const mother = findPerson(s, "eadgyth");
  if (mother?.alive && s.watch !== "eadgyth") {
    extra.push({ speaker: mother.name, text: hall ? "Inside. Now." : "The meal is on the dock." });
  }
  return extra;
}

function maybeDockRaid(s: GameState) {
  if (!s.nightSign || s.choices || s.oswinDays > 0) return;
  s.raidOnce = true;
  const hall = s.raidHits >= 2;
  const watched = s.watch !== "none";
  const same = s.escaped?.race === "goblin";
  const who = same ? s.escaped!.name : "the little thieves";

  if (hall && !watched) {
    s.nightSign = false;
    s.raidHits += 1;
    const n = Math.min(s.food, 8);
    s.food -= n;
    if (s.hide > 0) s.hide -= 1;
    log(s, `They come past the dock and try the hall. ${n ? n + " meal gone. " : ""}No watch. The door is a door.`, "warn");
    woundLate(s);
    if (s.raidHits >= 3) woundLate(s);
    const you = findPerson(s, "player");
    const standing = living(s).filter((p) => p.hurt < 7);
    if (standing.length === 0 && ((you?.hurt ?? 0) >= 7 || living(s).length === 0)) {
      endGame(s, "The raid hits the hall and nobody is left standing.");
    }
    return;
  }

  if (!watched) {
    stealDock(s, same);
    return;
  }

  s.nightSign = false;
  if (hall) {
    s.renown += 1;
    log(
      s,
      s.watchPost
        ? `The post sees them at the water-gate. ${who} try the hall and find a watch. +1 Renown.`
        : `Watch hears them at the hall-door. ${who}. +1 Renown.`,
      "ok",
    );
  } else {
    log(
      s,
      s.watchPost
        ? `The post sees them first. ${who} at the pilings. Night is yours if you take it.`
        : `Watch hears them at the pilings. ${who}.`,
    );
  }
  setChoices(
    s,
    [
      { id: "raid_take", label: same ? `Take ${s.escaped!.name}` : "Take one" },
      { id: "raid_drive", label: "Drive them off" },
      { id: "raid_spare", label: "Let them go" },
    ],
    raidAside(s, hall),
  );
}

function stealDock(s: GameState, same: boolean) {
  s.nightSign = false;
  s.raidHits += 1;
  const n = Math.min(s.food, 6);
  if (n >= 4) {
    s.food -= n;
    log(
      s,
      same
        ? `${s.escaped!.name} and others at the dock in the dark. ${n} meal gone. You set no watch.`
        : `Goblins at the dock in the dark. ${n} meal taken. You set no watch.`,
      "warn",
    );
  } else if (s.hide > 0) {
    s.hide -= 1;
    log(s, "They take a hide from the dock-store. You set no watch.", "warn");
  } else {
    log(s, "They find little. They cut whoever came out.", "warn");
  }
  if (Math.random() < 0.45) woundLate(s);
}

function takeDockThief(s: GameState) {
  s.renown += 1;
  if (s.escaped?.race === "goblin") {
    if (slaves(s).length >= captiveSlots(s)) {
      log(s, `No space to hold ${s.escaped.name}. They tear free on the path to ${holdCopy(s).path}.`, "warn");
      return;
    }
    if (s.rope < 1 && s.hide < 1) {
      log(s, `No rope, no leather. ${s.escaped.name} slips you in the dark.`, "warn");
      return;
    }
    if (s.rope > 0) s.rope -= 1;
    else s.hide -= 1;
    const person = recapture(s.escaped);
    s.escaped = null;
    s.people.push(person);
    log(s, `You have ${person.name} again. ${holdCopy(s).remember}`, "ok");
    openHutAsk(s, false);
    return;
  }
  s.pendingTake = "goblin";
  takeHome(s);
}

function woundLate(s: GameState) {
  const pool = s.people.filter((p) => p.alive && !p.guest && p.id !== "eadgyth" && p.hurt < 7);
  if (!pool.length) return;
  const easy = pool.filter((p) => p.id === "wulfric" || p.id === "godric");
  const list = easy.length ? easy : pool;
  const p = list[Math.floor(Math.random() * list.length)]!;
  p.hurt = Math.max(p.hurt, 3);
  log(s, p.id === "player" ? "You come out late and take a cut." : `${p.name} comes out late and takes a cut.`, "warn");
}

function tickLoyalty(s: GameState) {
  const crowd = crowding(s);
  const ead = findPerson(s, "eadgyth");
  const eadOnHall = Boolean(ead?.alive && ead.job === "hall");
  const hearth = hasBuilding(s, "hearthhouse");
  const bunks = hasBuilding(s, "bunkhouse");
  const slavesInHall = slaves(s).length > 0 && !s.hut && !hasBuilding(s, "thrallhut");
  const idle: string[] = [];
  s.people.forEach((p) => {
    if (!p.alive || p.guest || !isHand(p.id) || p.status !== "free") return;
    if (p.job === "idle") {
      p.loyalty = Math.max(1, p.loyalty - 1);
      idle.push(p.name);
    }
    if (crowd > 0 && !eadOnHall && !hearth) p.loyalty = Math.max(1, p.loyalty - 1);
    if (slavesInHall && bunks) p.loyalty = Math.max(1, p.loyalty - 1);
  });
  if (idle.length) {
    const names = idle.length <= 2 ? idle.join(" and ") : `${idle[0]}, ${idle[1]}, and ${idle[2]}`;
    const verb = idle.length === 1 ? "sits" : "sit";
    log(s, `${names} ${verb} unused. A hand that is not used will walk.`, "warn");
  }
  if (crowd > 0 && eadOnHall) log(s, "Eadgyth keeps the press from turning into a walk.");
  if (slavesInHall && bunks) log(s, "A prisoner among free pallets. The new hands see it.", "warn");
}

function maybeLeave(s: GameState) {
  if (s.choices) return;
  const restless = s.people
    .filter((p) => p.alive && !p.guest && p.status === "free" && isHand(p.id) && !isKin(p.id) && p.loyalty <= 2)
    .sort((a, b) => a.loyalty - b.loyalty);
  const p = restless[0];
  if (!p) return;
  s.pendingLeave = p.id;
  const crowd = crowding(s);
  const kind: "roof" | "idle" | "cage" | "hall" =
    crowd > 0
      ? "roof"
      : p.job === "idle"
        ? "idle"
        : hasBuilding(s, "thrallhut") && !hasBuilding(s, "bunkhouse")
          ? "cage"
          : "hall";
  const why =
    kind === "roof"
      ? "The roof is too small."
      : kind === "idle"
        ? "No work was given."
        : kind === "cage"
          ? "They saw the cage before the fire."
          : "The hall does not hold them.";
  log(s, `${p.name} has a pack on. ${why}`);
  const extra: SceneLine[] = [{ speaker: p.name, text: leaveWord(kind) }];
  if (findPerson(s, "eadgyth")?.alive) extra.push({ speaker: "Eadgyth", text: "A pack on the floor is a man already gone." });
  if (findPerson(s, "eadric")?.alive) extra.push({ speaker: "Eadric", text: "Give a pallet or let them walk. Do not talk." });
  setChoices(
    s,
    [
      { id: "leave_stay", label: hasBuilding(s, "bunkhouse") ? "Point them at a pallet" : "Buy another night with meal" },
      { id: "leave_go", label: "Let them walk" },
    ],
    extra,
  );
}

function leaveWord(kind: "roof" | "idle" | "cage" | "hall"): string {
  if (kind === "roof") return "I will not sleep on this floor another night.";
  if (kind === "idle") return "You have no work for me. I will find some.";
  if (kind === "cage") return "You built a cage first. I know what that means.";
  return "This hall does not hold me.";
}

function letGo(s: GameState) {
  const p = s.pendingLeave ? findPerson(s, s.pendingLeave) : undefined;
  s.pendingLeave = null;
  if (!p) return;
  if (s.watch === p.id) s.watch = "none";
  s.party = s.party.filter((id) => id !== p.id);
  s.people = s.people.filter((x) => x.id !== p.id);
  if (p.id === "aldred") s.aldredRange = false;
  s.settlersHint = true;
  log(s, `${p.name} takes the path. Word goes with them. The next coast will hear it.`, "warn");
}

function keepHand(s: GameState) {
  const p = s.pendingLeave ? findPerson(s, s.pendingLeave) : undefined;
  s.pendingLeave = null;
  if (!p) return;
  const bunks = hasBuilding(s, "bunkhouse");
  const hold = hasBuilding(s, "thrallhut") && !bunks;
  if (hold && p.loyalty <= 1) {
    log(s, `${p.name} looks at the cage and will not take the meal. They walk.`, "warn");
    s.pendingLeave = p.id;
    letGo(s);
    return;
  }
  if (bunks) {
    p.loyalty = Math.min(10, Math.max(5, p.loyalty + 2));
    log(s, `${p.name} drops the pack. A pallet is a reason.`, "ok");
    return;
  }
  if (s.food >= 2) {
    s.food -= 2;
    p.loyalty = 3;
    log(s, `Meal for another night. ${p.name} stays. It will not last.`);
    return;
  }
  log(s, `No meal to buy the night. ${p.name} walks.`, "warn");
  s.pendingLeave = p.id;
  letGo(s);
}

function checkWipe(s: GameState) {
  const you = findPerson(s, "player");
  if (!you?.alive) {
    endGame(s, "You fall. The hall has no heir.");
    return;
  }
  const first = ["eadgyth", "eadric", "godric", "wulfric", "osric"];
  if (first.every((id) => !findPerson(s, id)?.alive) && s.renown < 8) {
    endGame(s, "The first household is dead and no story remains.");
  }
}
function endGame(s: GameState, msg: string): GameState {
  s.gameOver = true;
  s.endMessage = msg;
  log(s, msg, "warn");
  return s;
}

export type { Job };
