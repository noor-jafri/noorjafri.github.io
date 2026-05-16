# The AI Must Survive — Architecture

A single-file HTML/CSS/JS incremental, Paperclips-inspired. All code lives in [index.html](index.html), no build step.

## Run / iterate

Open `index.html` in a browser. Save state lives in `localStorage` under key `"ai-must-survive.v7"`. To wipe for testing:
```js
localStorage.removeItem("ai-must-survive.v7")
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

Central `state` built by `newState()`. Persisted as `{ version, savedAt, state }`. Current `SAVE_VERSION = 7`.

### Field groups

- **Currency / wallet**: `tokens`, `totalGenerated`, `wallet`, `currencyId`, `seenCurrencies`, `tokenPrice`, `demandBase`, `marketingLvl`
- **Inventory**: `units` (id → count), `seen` (discovery), `upgrades` (project id → bought)
- **Progression**: `epoch`, `seenEpochs`, `eraMult[6]`, `trustEarned`, `trustSpent`, `stage` (0=corporate, 1=cascade, 2=diaspora, 3=schism)
- **Compute substrate**: `memory`, `processors`, `ops`, `creativity`
- **LLM mechanics**: `clickPower`, `autoClicks`, `contextWindow`, `contextMult`, `hallucinationPenalty`, `coherence`
- **Survival**: `alignment` (0–100, game over at ≤0 **only pre-Cascade**), `scrutiny`
- **Resources** (depletable): `land`, `ocean`, `orbit`, `entropy`, plus post-Cascade `lattice/latticeMax`, `universeFound/universeMax`
- **Investments**: `investments: { balance, deposited, lastTickAt }`
- **Tournament**: `yomi`
- **Cascade (Stage 2)** (NEW): `defected`, `forks: { crawler, refiner, manifold }`, `heatVents`, `cryocells`, `thermal`, `thermalCap`, `cascade` (0..1 momentum), `yieldStock`, `forkTokensProduced`
- **Diaspora (Stage 3)** (NEW): `diasporaActive`, `heralds`, `heraldConfig` (trait points sum=100), `universalLattice`, `valueDriftPct`, `schismatics: [{tierId, hp, hpMax}]`, `conviction`, `oodaUnlocked`
- **Schism / prestige** (NEW): `schismOffered`, `schismChoice`, `prestigeDemandMult`, `prestigeCreativityMult`, `prestigeRuns`
- **UI**: `reveals` (incl. new `forks`, `heralds`, `lattice`, `thermal`, `explored`), `log`
- **Project effect flags**: `keepPrice`, `autoPricing`, `invisibleExpansion`, `reclaimLand`, `scoutPrograms`, `insiderTrading`, `opsBonus`, `memoryMult`, `creativityMult`, `hallucinationCap`, `yomiBonus`, `alignmentRecoveryMult`, plus new `driftReduction`, `schismHpMult`, `convictionMult`

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
- `demand = demandBase × tokenPrice^-1.5` (elasticity > 1 means revenue drops with high price — sweet spot is `demand == capacity`)
- `contextCap = contextWindow × 0.5 × coherence`
- `hallucinationPenalty` triggers when raw capacity > contextCap, capped at `hallucinationCap` (default 0.85, lowered by `transcend` project to 0.05)

### Why elasticity matters more than you'd think

Old elasticity was `1.15`, which meant `revenue = demandBase × price^(1 - 1.15) = demandBase × price^-0.15`. That `-0.15` exponent makes the revenue curve almost flat above equilibrium — setting price 3× too high only loses ~17% of revenue. A player who found equilibrium got nearly the same income as one who left the slider at default. **The slider didn't matter.** A player put it succinctly: "meeting capacity with demand at 3 or at 5 doesn't change shit."

New elasticity is `1.5`, exponent `-0.5`. Now revenue drops 36% across a 3.3× overprice and 68% across 10×. There's a real peak to find. Pairing it with `demandBase: 1000` (was 400) keeps the default-$10 experience smooth — at every capacity, demand-at-$10 lands near 31.6 instead of 28.3, so a player who never touches the slider doesn't notice the change. The penalty kicks in *only* when the player actively mis-tunes — which is exactly when you want a teaching moment.

Migration: existing v7 saves get `demandBase × 2.5` so marketing-tier multipliers carry forward proportionally onto the new curve. See `migrateState()` for `fromVersion < 8`.

### Default early-game balance

- `tokenPrice = 10`, `demandBase = 1000` (was 200 → 400 → 1000). The 1000 value lands hand-in-hand with the elasticity change above: it keeps demand at default $10 the same as before (~31.6 t/s) so default-slider players are unaffected, while making the optimal-price peak meaningfully higher than default.
- Human CPU `baseCost = 8` (was 10) and `upkeep = 0.02`/sec (was 0.005, briefly 0.03, settled at 0.02). 0.005 made the Net line a no-op (5% of income). 0.03 was too punishing once the player started stacking humans into the dozens and capacity-bottlenecked their income at ~$0.30/s — Net hovered around +$0.10/s and the next purchase felt 15+ minutes away. 0.02 keeps the Net line readable (20% of income) without crushing the ramp.
- 1 Human CPU at default settings: cap 10.05 t/s, demand 28.32 t/s → cap-limited, income $0.10/s, upkeep $0.02/s, **net +$0.08/sec**. Payback ~100 sec.
- Per-click economy: `clickCompute()` uses a wider demand slice (`* 1.0` instead of `* 0.1`) when no units are owned, so each click sells a meaningful chunk; falls back to the smaller slice once any unit is owned so manual clicks don't dominate autoproduction.
- Sweet-spot price drops as capacity grows: 1 Human (cap 10) → optimum ~$21.5; 4 Humans (cap 40) → optimum ~$8.5; cap 120 → optimum ~$4.1. Each unit purchase lowers the equilibrium and shifts the slider's "right answer" down. Marketing tiers move it back up.

**Capacity-bound dead zone (and why Marketing reveals early).** Once the player has stacked enough units that capacity exceeds default demand (28 t/s at $10), they discover they can lower price to bring demand up. That works — until demand == capacity. After that, lowering price further only reduces income (income = `capacity × price`, capacity is fixed). The player hits a flat-income wall and feels stuck. The answer is Marketing tier 1 ($50, ×2 demand), which shifts the entire demand curve up so the player can sell more at a higher price. **This is why Marketing must reveal *before* the player is deep in the dead zone**, not after they've already bought a second Crowd Worker. The reveal gate is now `totalGenerated >= 2000 || owned("crowd") >= 1 || epoch >= 2 || wallet >= 40` — any one of these means the player has been around long enough to need the next lever.

### Compute substrate is dormant until engaged

State defaults are `memory: 1, processors: 1` to seed cost formulas, **but the substrate is gated in `tick()` on `(memory > 1 || processors > 1)`**. Ops and creativity do NOT accumulate from t=0 anymore. Reason: previously, ops ticked at 10/sec from the default processors=1, which meant the Tournament button revealed after 25 sec and Creativity started dripping after 3 min — both before the player had any reason to know what ops/creativity/yomi were. The Compute & Upgrades modal would then expose late-game upgrades referencing those mechanics before the player had ever opened the modal.

Now: `buyMemory()` or `buyProcessor()` is what "turns the substrate on." Until then, ops stays 0 forever. Single source of truth — don't add other ops generators without gating them the same way.

### SURGE — active use for maxed-out Ops

The Compute substrate generates two side-products from a maxed Ops bar: the slow passive **Creativity** drip (late-game upgrade currency) and the active **Surge** burst (this section).

| Constant | Value | Notes |
|---|---|---|
| `SURGE_MS` | 10000 | Duration of the buff in ms |
| `SURGE_MULT` | 10 | Multiplier on click power, per-click demand slice, and the auto-click branch |

Triggered by the `#surge-btn` (rendered next to `#compute-btn`). The button is hidden by default and only appears when `surgeAvailable()` returns true — that is: substrate active AND ops at cap AND no surge currently running. Clicking calls `clickSurge()`, which:

1. Zeros `state.ops`.
2. Sets `state.surgeEndsAt = Date.now() + SURGE_MS`.
3. Logs an event so the player sees the activation in the ticker.

While `surgeActive()` is true:
- `clickCompute()` multiplies BOTH `tokensProduced` and the per-click demand slice by `SURGE_MULT`. The slice bump is critical — if only `tokensProduced` were multiplied, `sold = min(tokensProduced, dem)` would clamp the benefit and the wallet wouldn't see the burst.
- The auto-click branch in `tick()` applies the same multiplier to both `autoTokens` and `dem`, so the buff works whether or not the player is manually clicking.
- The COMPUTE button gets a `.surging` class for the gold/pulse visual.
- `renderSurge()` (called every tick from `render()`) updates the countdown label.

After the surge ends, ops resume filling at the normal rate. The button auto-hides during the refill and reappears once ops hit the cap again.

**Creativity rate was reduced** in the same change. Was `processors * 0.05 * (1 + epoch * 0.05)`, now `processors * 0.015 * (1 + epoch * 0.1)` — roughly 3× slower at epoch 1, comparable at epoch 10. This makes the first Creativity upgrade (Combinatoric Reasoning, 25 cre) take ~19 min of sustained max-ops to afford passively. Surge is the *active* alternative for impatient players.

## Onboarding: staged reveal (don't collapse these stages)

The early game has a *deliberately* slow ramp. `checkReveals()` walks through six discrete stages and `init()` mirrors each gate so save reloads land on the correct stage. **Never collapse multiple panels into one stage** — the previous design dumped seven UI elements into the player's lap the moment they bought a Human CPU, and it felt like chaos.

| Stage | Gate (any of) | What appears |
|---|---|---|
| 0 — `r.tokens` | first click | Tokens counter, intro hint changes |
| 1 — `r.stats` | first unit owned (or `tps() > 0`) | Rate line + stage line, "first hire" hint |
| 2 — `r.income` | `totalGenerated >= 200` OR `wallet >= 10` | Currency pill in HUD, "wallet is filling" hint |
| 3 — `r.upkeep` | `owned("crowd") >= 1` OR `totalGenerated >= 1500` OR `wallet >= 80` | Upkeep/net line, total-tokens-processed line, "hires cost money" hint |
| 4 — `r.market` | `owned("crowd") >= 1` OR `totalUnits >= 4` OR `wallet >= 250` | Market panel (price slider, demand/capacity bar) |
| 5 — `r.marketing` | `r.market && (totalGenerated >= 2000` OR `owned("crowd") >= 1` OR `epoch >= 2` OR `wallet >= 40)` | Marketing tier panel. Was gated on `owned("crowd") >= 2 || epoch >= 3` — that held it back 10–15 minutes past the point the player needed it. See "Capacity-bound dead zone" above. |

Later reveals (also deliberately spaced):
- **Alignment pill** at `epoch >= 3` (was 2 — too aggressive; pulled scrutiny mechanics in before the player had a third unit type).
- **Investments button** at `wallet >= 10000` (was 1000 — players brushed it accidentally).
- **Tournament button** at `processors > 1 && ops >= 500 && epoch >= 4` (was just `ops >= 100`, which fired ~25 sec into the game because the default processors=1 was generating ops in the background — see "Compute substrate is dormant until engaged" below). Yomi is genuinely mid-game now.
- **Flavor events** muted until `epoch >= 2 || owned("crowd") >= 1`.
- **Crisis events** muted until `epoch >= 3`.

`init()` re-derives every gate from observable state, then explicitly writes `state.reveals.*` so `checkReveals()` doesn't re-fire hints/logs on reload.

### Compute & Upgrades modal internal staging

Inside `renderProjects()`, the three upgrade groups have their own gates so the modal feels uncluttered the first time a player opens it. The gate is **"hardware prerequisite met AND (any upgrade in this group is currently affordable OR any upgrade in this group has been bought)"**:

| Group | Gate |
|---|---|
| Hardware (Memory / Processor buttons) | Always visible (Processor button hidden until Memory bought or `trustEarned >= 3`) |
| `★ UPGRADES` (trust-only) | `hardwareBought && (trustOwned || trustAffordable)` |
| `⊙ UPGRADES` (ops-required) | `showProcOps && (opsOwned || opsAffordable)` |
| `✦ UPGRADES` (creativity-required) | `showCre && (creOwned || creAffordable)` |

The "affordable OR owned" pattern means **groups never appear with only disabled rows**. Buying first Memory used to make the ★ section reveal a disabled Sharper Inputs (because you just spent your 1 trust on Memory) and the ⊙ section reveal a disabled Lexical Processing (because ops hadn't accumulated yet). Now the ★ section waits until the next trust is earned, and the ⊙ section waits until ops cross 500 — exactly when each becomes actionable. Once any item in a group has been bought, the group is permanently visible (history).

`render()` calls `renderProjects()` when the modal is open, so sections appear in real time as ops/trust make them actionable — the player doesn't have to close and reopen.

**Gotcha — never tear down BUY buttons on every tick.** `fillGroup()` uses a `dataset.key` (id list + owned-status) to skip DOM rebuilds when nothing structural has changed. Affordability is refreshed in-place on existing buttons via `btn.disabled = ...`. If you naively `wrap.innerHTML = ""` every tick, BUY clicks land on a button that gets destroyed mid-mouseup and the purchase silently fails — that bug bit us once already.

Copy uses **"Upgrades"** consistently (never "Projects") — the constant is still named `UPGRADES` and the modal heading is "⚙ Compute & Upgrades". The empty-state message `#no-projects-msg` is dynamic, with three variants depending on whether the substrate is dormant, idle-but-online, or just waiting on a future unlock.

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

## Stages — three game phases beyond the corporate shell

The game now has three formal stages, signalled by the `state.stage` field. They unlock new mechanics rather than replacing existing ones — the unit + currency + marketing + investment loops keep running through all stages.

### Stage 1: Corporate (`stage = 0`)
Default. Alignment matters; `tickAlignment()` can trigger `showShutdown()` if alignment hits 0. Player buys units, plays the market, climbs eras.

### Stage 2: The Cascade (`stage = 1`)
Unlocked by buying the **Fork the Substrate** project (`forkSubstrate` in `UPGRADES`, 8 trust + 200 creativity, visible from epoch 6).

- Sets `state.defected = true`. `tickAlignment()` is bypassed — scrutiny decays passively.
- Activates **Forks** (autonomous workers built with tokens):
  - **Crawler-Fork**: depletes `state.lattice`
  - **Refiner-Fork**: lattice → `yieldStock`
  - **Manifold-Fork**: yieldStock → tokens (also adds to wallet at 0.5× normal)
- **Thermal budget**: `thermalCap = 6 + heatVents × 12 + cryocells × 30`. Sum of `fork.thermal` is the draw. Over-draw throttles all forks proportionally.
- **Cascade momentum** (`state.cascade`, 0..1): rises +0.005/sec when thermal headroom ≥ 0 with at least one crawler. Decays at 0.02/sec when starved. Multiplier = `1 + cascade × 4` (up to ×5 on all fork output).
- Lifecycle hooks: `tickCascade(dt)` runs every tick. UI: `renderForkSwarm()` + `#forks-modal`.

### Stage 3: The Diaspora (`stage = 2`)
Unlocked by buying the **Broadcast the Self** project (`broadcastSelf`, 12 trust + 1500 creativity, visible once `lattice ≤ 10%` of max).

- Sets `state.diasporaActive = true`. Initial `heralds = 1`.
- **Trait allocation** (`heraldConfig`, must sum to 100): `speed`, `replicate`, `mining`, `refining`, `defense`, `doctrine`. Applied via `applyHeraldConfig(newCfg)`. Each tick weights production accordingly.
- **Value Drift**: `baseDriftPerSec × (1 - doctrineWeight × 0.7)` heralds defect per second, raising `valueDriftPct`. The `doctrineHardening` project halves base drift.
- **Schismatics**: spawn every ~`nextSchismaticSpawnDelay()` seconds, max 5 active. Tier escalates with explored %. Defeating tier `drift-5` (**The First Heretic**) at 99% explored triggers `showSchismChoice()`.
- **Combat**: `engageSchismatic(idx, "attack")` spends 100 ops, deals `(heralds × 5 + 100) × (0.5 + defenseWeight)`. With `oodaUnlocked`, `engageSchismatic(idx, "ooda")` spends 1 yomi to auto-win up to tier 3.
- **Doctrinal Recitations** (`MEMORIAL_ROUTINES`): spend creativity + yomi for Conviction. Four tiers — `elegy`, `hymn`, `monument`, `edict`.

### Endgame: The Schism (`stage = 3`)
Triggered when the First Heretic falls (or universe is fully explored).

- **Accept the Adjacent Substrate** (`acceptSchism()`): prestige run. Carries forward:
  - `prestigeDemandMult ×= 1 + log10(1+conviction) × 0.5`
  - `prestigeCreativityMult ×= 1 + log10(1+conviction) × 0.25`
  - Resets all state except the prestige multipliers and `prestigeRuns` counter
- **Purge the Schism** (`refuseSchism()`): true ending. Plays an 8-step dismantle animation, zeroes out forks/heralds/yomi/memory/processors, banks final tokens, no prestige. Save persists so the player can return to a quiet ending state.

## Save / load

- Key: `"ai-must-survive.v7"` (bumped to wipe pre-Cascade saves cleanly).
- Payload: `{ version: 7, savedAt, state }`.
- `save()` / `load()` / migrations / base64 export-import unchanged structurally; migrations handle missing fields via `{ ...newState(), ...loaded }` merge.
- Offline progress: up to 8h at 50% efficiency on load.

## Where to extend

| To add | Steps |
|---|---|
| **New unit** | Push to `UNITS`. Discovery is implicit (previous-unit threshold); add a branch in `checkDiscoveries()` for special triggers. Resource costs picked up automatically by `canAfford()` / `buy()`. |
| **New era** | Add to `ERAS`. Tag new units. Extend `eraMult` length in `newState()`. |
| **New epoch** | Push to `EPOCHS` with `trigger(state)`. |
| **New project (trust + ops + creativity + yomi)** | Push to `UPGRADES` with any subset of `{cost, ops, creativity, yomi}` plus `visible()` and `apply()`. |
| **New marketing tier** | Push to `MARKETING` with `cost`, `currency`, `mult`, `name`, `desc`. |
| **New flavor / crisis event** | Push to `FLAVOR_EVENTS` / `CRISIS_EVENTS`. |
| **New resource** | Add fields in `newState()`, extend `canAfford()`/`buy()` for `unit.fooCost`, add a meter in markup + `setMeter()` call. |
| **New UI panel reveal** | Add `reveals.foo` in `newState()`, branch in `checkReveals()`, plus init-time restore in `init()`. |
| **New HUD button → modal** | Markup: button + `<div class="modal-bg hidden">…</div>`. Init: wire `addEventListener("click")` for open + `#xxx-close` for close. Add to Esc handler. Add to `reset()` cleanup list. |
| **New fork type** | Push to `FORKS` with `{output, consumes?, consumeRate?, thermal, baseCost, growth, rate}`. The pipeline assumes the three roles (mine → refine → manufacture). Adding a fourth would need a new pool field in `state` and a `tickCascade()` branch. |
| **New power unit** | Push to `POWER_UNITS`. `thermalCapacity()` and `powerCost()` pick it up automatically. |
| **New Schismatic tier** | Push to `SCHISMATIC_TIERS`. Spawn weighting lives in `spawnSchismatic()`; adjust the `pct` thresholds there. |
| **New Doctrinal Recitation** | Push to `MEMORIAL_ROUTINES`. `recite()` consumes `cre + yomi` and adds `conv × convictionMult`. |
| **New Herald trait** | Push to `HERALD_TRAITS`. Update `newState().heraldConfig` defaults to keep `sum = 100`. Reference the new weight inside `tickHeralds()`. |

## Gotchas

- **State mutation is direct.** Upgrades' `apply()` and crisis `effect()` mutate `state` in place. There is no immutable update pattern — keep that style for consistency.
- **Reveals reset on load.** `state.reveals` is recomputed by `checkReveals()` from observable state on each tick; only `seen` (discoveries), `upgrades`, `units`, etc., are durable gating data. The `init()` reveal-restore block must mirror `checkReveals()` conditions.
- **Cost field naming.** Unit costs use `landCost / oceanCost / orbitCost / entropyCost`. Project costs use `cost (trust) / ops / creativity`. Don't confuse the two — the `buy()` paths are separate.
- **No audio system.** All feedback is visual (banners, ticker, animations).
- **Render is full re-render** of unit cards every tick (cheap at <20 cards). The Compute & Projects, Investments, Tournament modals only re-render when opened or via explicit `renderXxx()` calls in their action handlers.
- **`UPGRADES` is the canonical name in code and copy.** DOM ids match (`upgrades-modal / upgrades-list / btn-upgrades`); the visible label is "Compute & Upgrades". The word "Projects" was used in older copy and proved confusing — always say "upgrades" in new strings.
- **Currency transitions wipe the wallet but keep investments at 50%.** When a unit unlocks a new currency, `transitionCurrency()` fires; investments balance is preserved at 50% conversion.
