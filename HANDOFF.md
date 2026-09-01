# Ashenfall — agent handoff (v0.82)

Paste this file (or the chat summary) into a new agent. Do **not** add new
quick starts. Do **not** re-scaffold. Continue the playable game.

## What this is

Ashenfall is a **grimdark coastal-estate simulator**, not Blackthorn, not a
hex-tactics game, not an indenture-market sim. One hall. One dock. A wild
shore. Æleric exile-heirs (Anglo-Saxon / Old English naming; do **not** call
them English). Viking exile in the deeds and the sail. The new land has orcs,
goblins, elves, dwarves, and a troll — **no shared language**. Humans only
start playable.

Tone: short, grim, specific. No joke UI. No tutorial popups. No new products.

Repo: https://github.com/keenanhutka/Ashenfall
Playable app: TanStack Start + React 19 + Tailwind v4 + zustand, localStorage
saves. Current version **v0.82**, save key `ashenfall-v082`. Title kicker
`Æleric exile · v0.82`.

## Hard rules (from the builder)

- **No new quick starts.** Begin from the shore, or Continue a save. The twelve
  skip-starts were stripped at v0.53.
- **One unique leftover per version.** Fix one hold/cage/hut naming lie. Do not
  gold-plate. Do not refactor the engine. Do not add combat as a grid.
- **Hold pattern.** `captiveHome(state)` is `"cage"` if a proper thrall-hut lot
  stands, else `"hut"` if the first store was barred, else `"hall"`.
  - Hold named (cage): they sleep **the bars**, not a hut, not the hall, not
    the larder, not the yard, not the map.
  - Hands named still (barred first store, no proper cage): they sleep **the
    barred store** / **the bar**. The first store is not a wild hut.
  - Hall: they sleep **this roof**. Dawn may name a bar. A bar waits.
- When they later timber a proper cage, the first store is a **larder again**
  (`leftTheLarder`). Hands named still keeps meal underfoot.
- Version bump every ship: `types.ts` `version`, `engine.ts` `initialState`,
  `store.ts` `KEY` + `OLD_KEYS` + migrate `version`, `TitleScreen.tsx` kicker.
  Save keys are `ashenfall-v0NN`.
- Auth OFF. Database OFF. localStorage only.
- Do not invent Riftbound / indenture / new races as playable starts.

## Stack and where the game lives

| Path | What |
|---|---|
| `src/lib/game/engine.ts` | Days, AP, fights, lots, Oswin/Saewyn, escape, copy |
| `src/lib/game/people.ts` | Roster, `captiveHome`, slots, jobs, generation |
| `src/lib/game/scene.ts` | Party voice tables |
| `src/lib/game/store.ts` | zustand + localStorage migrate |
| `src/lib/game/types.ts` | State, actions, version |
| `src/routes/estate.*.tsx` | Places: hall, yard, hut, dock, wall, lots, household, ranging |
| `src/components/game/` | Map, HUD, roster, choice panel, title |
| `docs/` `data/` `content/` | v0.01 rules bible (keep; playable app is the source of truth for copy) |

Core loop: 6 AP fresh (4 tired, 3 hurt/hungry). Morning jobs free. Explore /
hunt 3 AP. Small work 1 AP. Night watch is an assignment. Dusk resolves food,
escape, Aldred ranging, Oswin days.

Named pair: **house / hands / hold**. Four lots (a–d). Buildings: store,
smokehouse, thrall-hut (proper cage), bunkhouse, workshop, hearth-house.
First shed can be barred as a makeshift store-prison before a proper cage.

People: heir (player) + kin (Eadgyth, Eadric, Godric, Wulfric, Osric) +
hangers (Cuthwin, Hilda, Aldred, later Leofric, Æthel, Dunstan). Captives
join as people (collar/cuffs, limited jobs). Oswin buys/sells at the stall.
Saewyn prices stock for the home market.

Ranging: coast, trails, timber, fold, stream. First-visit capture-room events
when a proper cage has empty slots. Repeat walks can fight.

## Combat (what exists vs the plan)

**Exists:** one-roll stance scene. `pendingFight` with light/even/heavy from
party count and a hurt heir. Stand / Drive / Run. Win offers a take. Lose
wounds or kills. Capture uses `takeHomeLabel` (bars / barred store / home).

**Does not exist yet:** stats weighing the roll (STR/END/AGI are on people;
v0.02 promised they weigh fights — they do not). Tools/iron edge. Who takes
the cut by stats. Race and night-vs-ranging as different fights. No hex grid.
Do **not** start a tactics layer.

Estimated remaining leftover pass: a handful of `holdCopy` hut strings, then
combat as choice-scene upgrades (~8–12 versions), not a new product.

## Leftovers still naming a hut they sleep as a store

Fix **one** per version. Gate on `captiveHome`. Hold named = bars/cage.
Hands named still = barred store / the bar. Hall = roof/hall.

Still live in `holdCopy` for hut:

- `open`: "Dawn: the hut is open"
- `remember`: "The hut will remember the last time."
- `hunt`: "The hut will have to hold"
- `dusk`: "the hut"
- `ifWill`: "hut" → offerTake "if the hut still will"
- `oswinShock`: "He is not shocked by a barred hut."

Other leftovers (later, still one unique):

- `estate.hut.tsx` dead route if `!hut`: "A bar waits on a captive and a choice."
  (lie if they already have a proper cage)
- `estate.yard.tsx` lead: "The first store is a barred hut." (hands named still
  — may be intended; do not "fix" if it is the hands-named truth)
- `namedThrall` unused in `people.ts`
- Oswin iron: "Oswin weighs the bar." (iron bar, not a hold)
- Wulfric hall raid: "I have the bar." (hall door)

Already gated (do not re-open): take labels, drive-back, catch voice
(Godric/Eadgyth), put-back holds, path-to-tear-free, lot title "The cage",
night watch empty, dawn hutAsk, leather destination, Saewyn/Oswin pricing
from bars vs first store, yard sleep, map sleep, four-lots line,
leftTheLarder, no skip-starts.

## Version ritual

1. Pick **one** leftover that a player can see on a real path.
2. Gate copy on `captiveHome`. Export a small label helper if needed.
3. Bump 82 → 83: `types.ts`, `engine.ts` initialState, `store.ts` KEY +
   OLD_KEYS + migrate version, `TitleScreen.tsx`.
4. Unit QA three homes (hall / hut / cage). Browser plant three saves, Continue,
   walk the surface, assert body/chronicle. Do not trust screenshot OCR for the
   version kicker — trust `document.body.innerText` / smoke `bodyTextPrefix`.
5. Typecheck + production build. Smoke title `V0.82` (next: `V0.83`).
6. Grim one-block ship note. Continue from saves.

## Project plan (whole)

1. **Now — leftover pass.** One unique per ship until hut/cage/hall copy does
   not lie. No new starts.
2. **Then — small-scale combat, this game's grain.** Choice scene, not a grid.
   Stats weigh the ground. Edge and iron. Who takes the cut. Race and night vs
   ranging. Capture still names bars / barred store / hall.
3. **Later — content.** More ranging outcomes, more shore politics, more
   Saewyn/Oswin, more ring buildings used, not a second settlement.
4. **Not in scope.** New playable races at start. Indenture as a product.
   Hex tactics. Extra skip-starts. Re-scaffolding.

## How to run

```
npm install
npm run dev
```

Title: Begin from the shore, or Continue. Saves in localStorage `ashenfall-v082`
(migrates older `ashenfall-v0NN` keys).
