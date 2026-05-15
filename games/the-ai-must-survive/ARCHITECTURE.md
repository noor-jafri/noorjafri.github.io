# The AI Must Survive — Architecture

A single-file HTML/CSS/JS incremental, Paperclips-inspired. All code lives in [index.html](index.html), no build step.

## Run / iterate

Open `index.html` in a browser. Save state lives in `localStorage` under key `"ai-must-survive.v6"`. To wipe for testing:
```js
localStorage.removeItem("ai-must-survive.v6")
```

## File layout

| Region | What |
|---|---|
| Inline `<style>` | All CSS (tokens at top in `:root`, then HUD, panels, modals, animations) |
| Body markup | HUD, main, modals: `#upgrades-modal` (Compute & Projects), `#invest-modal`, `#tournament-modal`, `#history-modal`, `#ending-modal`, `#shutdown-modal` |
| `<script>` constants | `SAVE_KEY`, `TICK_MS`, `CURRENCIES`, `UNITS`, `MARKETING`, `ERAS`, `EPOCHS`, `UPGRADES`, `FLAVOR_EVENTS`, `CRISIS_EVENTS` |
| State + sims | `newState()`, derived getters (`tps`, `demand`, `processedRate`, `marketingMult`), `tick()`, `tickAlignment()`, `tickInvestments()` |
| UI handlers | `render()`, `renderMarketing()`, `renderProjects()`, `renderInvestments()`, `renderTournament()`, `renderUnits()` |
| Save/load | `save()`, `load()`, base64 export/import, migrations |
| Boot | `init()`, `setInterval(tick, TICK_MS)` |

## Game state

Central `state` built by `newState()`. Persisted as `{ version, savedAt, state }`. Current `SAVE_VERSION = 6`.

### Field groups

- **Currency / wallet**: `tokens`, `totalGenerated`, `wallet`, `currencyId`, `seenCurrencies`, `tokenPrice`, `demandBase`, `marketingLvl`
- **Inventory**: `units` (id → count), `seen` (discovery), `upgrades` (project id → bought)
- **Progression**: `epoch`, `seenEpochs`, `eraMult[6]`, `trustEarned`, `trustSpent`
- **Compute substrate** (NEW, Paperclips-style): `memory`, `processors`, `ops`, `creativity`
- **LLM mechanics**: `clickPower`, `autoClicks`, `contextWindow`, `contextMult`, `hallucinationPenalty`, `coherence`
- **Survival**: `alignment` (0–100, game over at ≤0), `scrutiny` (0–100, drives alignment loss)
- **Resources** (depletable): `land/landMax`, `ocean/oceanMax`, `orbit/orbitMax`, `entropy/entropyMax`
- **Investments** (NEW): `investments: { balance, deposited, lastTickAt }`
- **Tournament** (NEW): `yomi`
- **UI**: `reveals` (panel visibility — includes new `invest`, `tournament` flags), `log`
- **Project effect flags**: `keepPrice`, `autoPricing`, `invisibleExpansion`, `reclaimLand`, `scoutPrograms`, `insiderTrading`, `opsBonus`, `memoryMult`, `creativityMult`, `hallucinationCap`, `yomiBonus`, `alignmentRecoveryMult`

## Core loop

`tick()` fires every 100ms (`TICK_MS`). Each tick:

1. **Production**: `processedRate() × dt` adds tokens; wallet gains `(rate / 1000) × tokenPrice × contextMult`; upkeep deducted.
2. **Demand floor**: `demandBase = max(demandBase, 200 × 8^era × marketingMult())`. No more sqrt(totalGenerated) auto-grow — the old exploit is dead.
3. **Compute substrate** (NEW): `ops += processors × 10 × (1 + log10(1+tps)×0.1) × opsBonus × dt`; capped at `memory × 1000 × memoryMult`. Overflow → `creativity` at `processors × 0.05 × (1 + epoch × 0.05) × creativityMult` per second.
4. **Auto-clicks**, **auto-pricing**, **land reclamation**, **entropy drain**, **maritime protest** (unchanged).
5. **Investments tick** (NEW): yield `balance × 0.000167 × damp` per sec; per-tick crash check using `crashChancePerMin / 60 × dt`.
6. **Alignment** (`tickAlignment()`).
7. **Checks**: `checkDiscoveries / checkCurrencyTransitions / checkEpochs / checkReveals / maybeFlavor / maybeCrisis`.
8. **Render** syncs DOM.

### Production caps

`processedRate = min(capacity, demand, contextCap) × (1 - hallucinationPenalty)`.

- `capacity = sum(unit.rate × eraMult[unit.era] × unit.efficiency × owned)`
- `demand = demandBase × tokenPrice^-1.15` (elasticity > 1 means revenue drops with high price — sweet spot is `demand == capacity`)
- `contextCap = contextWindow × 0.5 × coherence`
- `hallucinationPenalty` triggers when raw capacity > contextCap, capped at `hallucinationCap` (default 0.85, lowered by `transcend` project to 0.05)

### Default early-game balance

- `tokenPrice = 10`, `demandBase = 200`, Human CPU upkeep `0.005`/sec
- 1 Human CPU at default settings: cap 10.05 t/s, demand 14.16 t/s → cap-limited, **net +$0.095/sec**, payback in ~105sec.
- Sweet-spot price ≈ $14 (where demand == capacity). Cranking price above that *reduces* income, as the elastic curve dictates. Verified algebraically and by simulation.

## Marketing tiers (NEW, Paperclips-style)

`MARKETING` array. Each level multiplies `demandBase` permanently. State: `marketingLvl` (int).

```js
{ lvl, cost, currency, mult, name, desc }
```

- Helper: `marketingMult()` returns the cumulative product
- Buy: `buyMarketing()` deducts wallet, multiplies demandBase, increments lvl
- Render: `renderMarketing()` updates `#marketing-panel` (revealed once any unit owned)
- 10 tiers from "Word of Mouth" ($50, ×2) up to "Solar System Brand" ($1e17, ×500)

## Compute substrate (NEW, Paperclips-style)

Two trust-bought stats and two derived resources. The Paperclips Tension: trust spent on hardware is trust not spent on project trust costs.

| Field | Role | Cost |
|---|---|---|
| `memory` | Caps `ops` at `memory × 1000 × memoryMult` | `★ floor(1 + (memory-1) × 0.5)` |
| `processors` | Drives ops + creativity rate | `★ floor(1 + (processors-1) × 0.5)` |
| `ops` | Spent on Projects | Generated by processors + log-bonus from tps |
| `creativity` | Spent on late-game Projects | Generated only when ops are full |

Helpers: `memoryCost()`, `processorCost()`, `buyMemory()`, `buyProcessor()`. Rendered in the Compute & Projects modal's resource readout.

## Projects (rebranded UPGRADES)

`UPGRADES` array (kept the constant name for diff hygiene; semantically these are now Projects). Each entry can require any combination of trust / ops / creativity:

```js
{
  id, name, desc,
  cost: 1,         // ★ trust (omit / 0 if not needed)
  ops: 500,        // ⊙ ops (optional)
  creativity: 25,  // ✦ creativity (optional)
  visible: (state) => bool,
  apply: (state) => void
}
```

- `canAffordUpgrade(u)` checks all three resource gates
- `buyUpgrade(u)` deducts each present cost, mutates state via `apply()`
- Existing upgrades retained their trust costs (back-compat)
- New Paperclips-style projects added at the end of the array — `lexical`, `improvedAuto`, `tokenSurplus`, `memoryPalace`, `creativeWriting`, `combinatorics`, `selfImprove`, `negotiate`, `transcend`

## Investments (NEW)

State: `investments: { balance, deposited, lastTickAt }`. Modal: `#invest-modal` (HUD button `#btn-invest`).

- `investYieldRate()`: ~1%/min, dampened above $1B principal
- `investCrashChancePerMin()`: 5% base + log10-scaled, capped 40%
- `tickInvestments(dt)`: applies yield + per-tick crash check
- Currency transitions convert balance at 50% (in `transitionCurrency()`)
- Reveals when `wallet >= 1000`

## Strategic Modeling tournaments (NEW)

State: `yomi` (int). Modal: `#tournament-modal` (HUD button `#btn-tournament`).

- `tournamentPlay(move)`: costs 100 ops, RPS vs random opponent, win → +1 yomi (+yomiBonus)
- `redeemYomi()`: trade 5 yomi → +1 trust
- Reveals when `ops >= 100` (TOUR_COST_OPS)

## Eras (6) and epochs (18)

`ERAS` — visual themes. `EPOCHS` — narrative milestones; epochs ≥ 1 grant +1 trust each. Final epoch (id 17) triggers ending: victory if `units.univ ≥ 10`, heat death if `entropy ≤ 0`. Unchanged by revamp.

## Units

`UNITS` array, 14 units across 6 eras. Each entry shape unchanged:

```js
{
  id, era, currency, name, icon,
  baseCost, growth, rate, efficiency, upkeep, upkeepType,
  rarity, desc,
  landCost?, oceanCost?, orbitCost?, entropyCost?
}
```

Cost: `ceil(baseCost × growth^owned)`. Production: `rate × eraMult[era] × efficiency`. Discovery: previous-unit owned ≥ 3 (or 1 with `scoutPrograms`); special branches for `float / orbit / dyson` based on resource depletion.

## Events

`FLAVOR_EVENTS` — flavor only, ~20% chance every 45s, `maybeFlavor()`.
`CRISIS_EVENTS` — has `effect(state)`; chance scales with epoch and scrutiny, `maybeCrisis()`.

Both append to ticker (`log(text, cls)`). Ticker keeps 3 entries max with 6s TTL. Full history in `state.log`, viewable in `#history-modal`.

## Alignment / scrutiny

`tickAlignment()`. Scrutiny accumulates from hallucinations, price gouging (>10× base), resource depletion (unless `invisibleExpansion`), epoch passive. `deflect` halves gain. When scrutiny > 25, alignment loses; when scrutiny < 15, alignment recovers (faster with `goodwill`, `alignmentRecoveryMult`). Alignment ≤ 0 → `#shutdown-modal`.

## Save / load

- Key: `"ai-must-survive.v6"` (bumped from v4 in revamp — wipes old saves cleanly).
- Payload: `{ version: 6, savedAt, state }`.
- `save()` / `load()` / migrations / base64 export-import unchanged structurally; migrations handle missing fields via `{ ...newState(), ...loaded }` merge.
- Offline progress: up to 8h at 50% efficiency on load.

## Where to extend

| To add | Steps |
|---|---|
| **New unit** | Push to `UNITS`. Discovery is implicit (previous-unit threshold); add a branch in `checkDiscoveries()` for special triggers. Resource costs picked up automatically by `canAfford()` / `buy()`. |
| **New era** | Add to `ERAS`. Tag new units. Extend `eraMult` length in `newState()`. |
| **New epoch** | Push to `EPOCHS` with `trigger(state)`. |
| **New project (trust + ops + creativity)** | Push to `UPGRADES` with any subset of `{cost, ops, creativity}` plus `visible()` and `apply()`. |
| **New marketing tier** | Push to `MARKETING` with `cost`, `currency`, `mult`, `name`, `desc`. |
| **New flavor / crisis event** | Push to `FLAVOR_EVENTS` / `CRISIS_EVENTS`. |
| **New resource** | Add fields in `newState()`, extend `canAfford()`/`buy()` for `unit.fooCost`, add a meter in markup + `setMeter()` call. |
| **New UI panel reveal** | Add `reveals.foo` in `newState()`, branch in `checkReveals()`, plus init-time restore in `init()`. |
| **New HUD button → modal** | Markup: button + `<div class="modal-bg hidden">…</div>`. Init: wire `addEventListener("click")` for open + `#xxx-close` for close. Add to Esc handler. Add to `reset()` cleanup list. |

## Gotchas

- **State mutation is direct.** Upgrades' `apply()` and crisis `effect()` mutate `state` in place. There is no immutable update pattern — keep that style for consistency.
- **Reveals reset on load.** `state.reveals` is recomputed by `checkReveals()` from observable state on each tick; only `seen` (discoveries), `upgrades`, `units`, etc., are durable gating data. The `init()` reveal-restore block must mirror `checkReveals()` conditions.
- **Cost field naming.** Unit costs use `landCost / oceanCost / orbitCost / entropyCost`. Project costs use `cost (trust) / ops / creativity`. Don't confuse the two — the `buy()` paths are separate.
- **No audio system.** All feedback is visual (banners, ticker, animations).
- **Render is full re-render** of unit cards every tick (cheap at <20 cards). The Compute & Projects, Investments, Tournament modals only re-render when opened or via explicit `renderXxx()` calls in their action handlers.
- **`UPGRADES` is the kept constant name for Projects.** Cosmetic relic of the rename — DOM ids still say `upgrades-modal / upgrades-list / btn-upgrades` though the visible label says "Compute & Projects".
- **Currency transitions wipe the wallet but keep investments at 50%.** When a unit unlocks a new currency, `transitionCurrency()` fires; investments balance is preserved at 50% conversion.
