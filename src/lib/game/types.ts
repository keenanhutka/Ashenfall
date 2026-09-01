export type Job =
  | "idle"
  | "hall"
  | "fish"
  | "wood"
  | "shed"
  | "hut"
  | "explore"
  | "wall"
  | "lot"
  | "water"
  | "leather"
  | "smoke"
  | "craft"
  | "hearth"
  | "hunt";

export type Race = "human" | "goblin" | "orc" | "elf" | "dwarf";

export type Status = "free" | "indentured" | "slave";

export type Sex = "m" | "f";

export type LogKind = "normal" | "warn" | "ok";

export type RouteId = "coast" | "trails" | "timber" | "fold" | "stream";

export type LotId = "a" | "b" | "c" | "d";

export type LotBuildingId =
  | "store"
  | "smokehouse"
  | "thrallhut"
  | "bunkhouse"
  | "workshop"
  | "hearthhouse";

export type NamedPair = "house" | "hands" | "hold";

export type LotAct = "inspect" | "smoke" | "nails" | "tools" | "hearth" | "rest";

export type LogLine = {
  id: number;
  text: string;
  kind: LogKind;
};

export type Choice = {
  id: string;
  label: string;
};

export type SceneLine = {
  speaker?: string;
  text: string;
};

export type Lot = {
  id: LotId;
  building: LotBuildingId | null;
  prog: number;
};

export type CoreStats = {
  str: number;
  agi: number;
  int: number;
  cha: number;
  end: number;
};

export type Person = {
  id: string;
  name: string;
  job: Job;
  alive: boolean;
  hurt: number;
  fish: number;
  wood: number;
  race: Race;
  sex: Sex;
  age: number;
  status: Status;
  role: string;
  str: number;
  agi: number;
  int: number;
  cha: number;
  end: number;
  beauty: number;
  body: number;
  loyalty: number;
  portrait: string;
  collar: boolean;
  cuffs: boolean;
  tired: boolean;
  guest: boolean;
};

export type Escaped = {
  id: string;
  name: string;
  race: Race;
  sex: Sex;
  day: number;
  portrait: string;
  beauty: number;
  body: number;
  str: number;
  agi: number;
  end: number;
  int: number;
  cha: number;
};

export type FightWeight = "light" | "even" | "heavy";

export type PendingFight = {
  race: Race | "troll";
  weight: FightWeight;
  fromNight?: boolean;
};

export type GameState = {
  version: 82;
  started: boolean;
  name: string;
  house: string;
  day: number;
  ap: number;
  tired: boolean;
  food: number;
  wood: number;
  hide: number;
  iron: number;
  silver: number;
  rope: number;
  nails: number;
  smoked: number;
  toolsDays: number;
  hearthTended: boolean;
  renown: number;
  sheds: number;
  hut: boolean;
  leakyShed: boolean;
  palisade: boolean;
  exploreOpen: boolean;
  explores: number;
  contacts: Record<string, boolean>;
  oswin: number;
  oswinDays: number;
  oswinGoneOn: number;
  oswinBuys: number;
  wordOut: boolean;
  nightSign: boolean;
  raidOnce: boolean;
  raidHits: number;
  huntSign: boolean;
  huntHits: number;
  elfSign: boolean;
  elfGrudge: number;
  dwarfSign: boolean;
  dwarfGrudge: number;
  trollSign: boolean;
  trollHits: number;
  gameOver: boolean;
  endMessage: string;
  people: Person[];
  watch: string;
  party: string[];
  log: LogLine[];
  logSeq: number;
  choices: Choice[] | null;
  scene: SceneLine[] | null;
  partyRoute: RouteId | null;
  shedProg: number;
  wallProg: number;
  watchPost: boolean;
  watchPostProg: number;
  lots: Lot[];
  starve: number;
  settlersHint: boolean;
  settlersLanded: boolean;
  settlersAsk: boolean;
  pendingTake: Race | null;
  pendingFight: PendingFight | null;
  pendingLeave: string | null;
  pendingEscape: string | null;
  aldredWaiting: boolean;
  aldredRange: boolean;
  saewynDays: number;
  saewynTalk: boolean;
  saewynReturn: boolean;
  saewynWarm: boolean;
  saewynLeftOn: number;
  saewynBought: boolean;
  hutAsk: boolean;
  pairAsk: boolean;
  namedPair: NamedPair | null;
  pairDone: boolean;
  pair2Ask: boolean;
  namedPair2: NamedPair | null;
  pair2Done: boolean;
  escaped: Escaped | null;
  workshop: boolean;
};

export type WorkKind = "fish" | "wood" | "shed" | "collar" | "cuffs" | "nearshore" | "wall" | "post" | "game";

export type ShopItem = "food" | "wood" | "hide" | "iron" | "nails";

export type ShopSell = "smoked" | "hide" | "wood" | "iron";

export type GameAction =
  | { type: "hydrate"; state: GameState }
  | { type: "start"; name: string; house: string; stats: CoreStats }
  | { type: "setJob"; id: string; job: Job }
  | { type: "setWatch"; id: string }
  | { type: "work"; kind: WorkKind }
  | { type: "inspect"; place: "hall" | "dock" | "shed" | "woods" | "wall" | "yard" }
  | { type: "endDay" }
  | { type: "beginExplore"; routeId: RouteId }
  | { type: "confirmParty"; ids: string[] }
  | { type: "cancelParty" }
  | { type: "choose"; id: string }
  | { type: "startLot"; lotId: LotId; building: LotBuildingId }
  | { type: "askName" }
  | { type: "workLot"; lotId: LotId }
  | { type: "lotAct"; lotId: LotId; act: LotAct }
  | { type: "saewyn"; id: "saewyn_talk" | "saewyn_stock" }
  | { type: "hunt" }
  | { type: "buy"; item: ShopItem }
  | { type: "sell"; item: ShopSell }
  | { type: "sellPerson"; id: string }
  | { type: "restrain"; id: string; kind: "collar" | "cuffs" }
  | { type: "reset" };

export function isLotId(v: string): v is LotId {
  return v === "a" || v === "b" || v === "c" || v === "d";
}
