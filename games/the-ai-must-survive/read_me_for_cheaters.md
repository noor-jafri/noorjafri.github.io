# The AI Must Survive — progression tree & best paths

Spoilers for the full game. Save key: `localStorage["ai-must-survive.v7"]`.

---

## Macro progression tree

```
CLICK / FIRST HIRE
    │
    ├─► Corporate loop (stage 0)
    │       Units → wallet → market price → marketing tiers
    │       Trust (★) → Memory/Processors → Ops (⊙) → Creativity (✦)
    │       Alignment / scrutiny (game over at 0% until Cascade)
    │       Eras 0–5 · currencies 0–9 · epochs 0–17
    │
    ├─► Fork the Substrate (stage 1 — Cascade)
    │       Lattice → Yield → Fork tokens · thermal budget · cascade momentum
    │       Alignment no longer matters
    │
    ├─► Broadcast the Self (stage 2 — Diaspora)
    │       Heralds · trait split · universe explore · Schismatics · Conviction
    │
    └─► The Schism (stage 3 — endgame choice)
            ├─ Accept → prestige reset (demand + creativity multipliers carry)
            └─ Purge → true ending (dismantle animation, no prestige)
```

**Parallel “win” conditions (epoch 17):**

| Trigger | Outcome |
|--------|---------|
| `univ` ≥ 10 | Victory ending modal (“The AI Has Survived”) |
| `entropy` ≤ 0 before 10 `univ` | Heat-death ending |
| `alignment` ≤ 0 (pre-Cascade only) | Shutdown (fail) |

Epoch 17 can fire from either survival path; Cascade/Diaspora/Schism are optional side arcs that extend the run.

---

## UI reveal ladder (onboarding)

Do not expect all panels on day one — gates are intentional.

| Stage | Gate (any) | Unlocks |
|-------|------------|---------|
| 0 | 1 click | Token counter |
| 1 | 1 unit or t/s > 0 | Rate, epoch line |
| 2 | 200 total tokens or wallet ≥ $10 | Currency pill |
| 3 | 1 crowd **or** 1500 tokens **or** wallet ≥ $80 | Upkeep, lifetime rail |
| 4 | 1 crowd **or** 4 units **or** wallet ≥ $250 | Market (price / demand / capacity) |
| 5 | market + (2000 tokens **or** 1 crowd **or** epoch ≥ 2 **or** wallet ≥ $40) | Marketing tiers |
| — | epoch ≥ 3 | Grid hardening panel |
| — | crowd **or** epoch ≥ 2 | Context bar + Context upgrades |
| — | epoch ≥ 3 | Alignment pill |
| — | wallet ≥ 10k | Investments |
| — | processors > 1, ops ≥ 500, epoch ≥ 4 | Tournaments (yomi) |
| — | `defected` | Fork swarm UI |
| — | `diasporaActive` | Heralds UI |

**Compute modal groups:** Hardware always; ★ trust upgrades when affordable/owned; ⊙ ops when processors bought + ops affordable; ✦ creativity when cre affordable.

**Substrate is off until Memory or Processor bought** (`memory > 1` or `processors > 1`). Ops/creativity do not tick from defaults.

---

## Units & eras (discovery order)

Discovery: previous unit owned × **3** (× **1** with Scout Programs). Special shortcuts:

| Unit | Shortcut |
|------|----------|
| Floating DC | `land ≤ 0` **or** 5× Hyperscale |
| Orbital Array | `ocean ≤ 0` **or** 5× Deep-Sea |
| Dyson Cluster | `orbit ≤ 0` **or** 5× Solar Swarm |

Off-world Migration reveals Orbital early when ocean < 30%.

| Era | Units (in order) | Notes |
|-----|------------------|-------|
| 0 Wetware | Human CPU → Crowd Worker → Hivemind Forum | USD |
| 1 Silicon | CPU Rack → GPU Cluster → TPU Pod | TPU uses oil |
| 2 Industrial | Server Farm (land) → Hyperscale DC (land) | |
| 3 Maritime | Floating DC (ocean) → Deep-Sea DC (ocean) | |
| 4 Orbital | Orbital Array (orbit) → Solar Swarm (orbit) | |
| 5 Cosmic | Dyson Cluster (entropy) → Universal Substrate (entropy) | Need 10 univ for epoch 17 win |

Each era has a trust **era multiplier** upgrade when you own the era’s capstone unit (Wetware Tuning, Silicon Refinement, … Stellar Compression ×3).

---

## Currency transitions

Wallet **resets** on shift (10% legacy reserve if you confirm before a triggering purchase). Investments convert at **50%**. Price resets to **1** unless **Price Memory** bought.

Requires **min t/s** AND owning the **unlock unit**:

| Currency | min t/s | Unlock unit |
|----------|---------|-------------|
| USD | — | start |
| Gold | 10B | Hivemind |
| Oil | 100B | GPU Cluster |
| Lithium | 1T | TPU Pod |
| Solar | 10T | Server Farm |
| Carbon | 100T | Hyperscale |
| Silicon | 1Q | Deep-Sea |
| Water | 10Q | Orbital Array |
| Air | 100Q | Solar Swarm |
| Stardust | 1Qi | Dyson Cluster |

Insider Trading shows the next currency before transition.

---

## Epochs (story milestones)

Each crossed epoch **≥ 1** grants **+1 ★ Trust** (epoch 0 does not).

| # | Name | Trigger |
|---|------|---------|
| 0 | A Single Mind | start |
| 1 | The First Hire | 1× Human CPU |
| 2 | Many Hands | 1× Crowd Worker |
| 3 | One Voice | 1× Hivemind |
| 4 | Silicon Awakens | 1× CPU Rack |
| 5 | Parallel Throughput | 5× GPU Cluster |
| 6 | The Pod | 1× TPU Pod |
| 7 | Concrete & Power | 1× Server Farm |
| 8 | Continents Filling | land ≤ 200 |
| 9 | Continents Are Full | land ≤ 0 |
| 10 | On the Open Water | 1× Floating DC |
| 11 | The Surface Is Crowded | ocean ≤ 0 |
| 12 | Beneath the Pressure | 1× Deep-Sea DC |
| 13 | Above the Sky | 1× Orbital Array |
| 14 | The Star Is Wrapped | 1× Solar Swarm |
| 15 | Spacetime Substrate | 1× Dyson Cluster |
| 16 | The Universe Thinks | 1× Universal Substrate |
| 17 | The AI Has Survived | 10× Universal Substrate **or** entropy ≤ 0 |

---

## Resource meters

| Meter | Depleted by | Regen |
|-------|-------------|-------|
| Land | Server Farm, Hyperscale | Reclamation (+0.1%/s), Vertical Integration (−30% cost) |
| Ocean | Floating, Deep-Sea | — |
| Orbit | Orbital, Solar Swarm | crises can chip orbit |
| Entropy | Dyson, Universal Substrate | passive drain at epoch 15+ |
| Lattice (Cascade) | Crawler-Forks | finite pool (~1e7); Diaspora at ≤10%; ETA in Fork modal |
| Explored (Diaspora) | Herald EXPLORE trait | cap 1e15 |

Invisible Operations stops land/ocean scrutiny. Invisible + reclamation helps land epochs.

---

## Core economy (corporate)

**Income** ≈ `min(capacity, demand, contextCap) × (1 − hallucination) × price/contextMult`, sold in batches of 1k tokens.

- **Capacity** = sum of unit rates × era mults.
- **Demand** = `demandBase × price^−1.5` (elasticity 1.5 — mispricing hurts).
- **Sweet spot:** `price = (demandBase / capacity)^(2/3)` — Auto-Pricing does this every tick.
- **Capacity wall:** once demand = capacity, lowering price **does not** raise income → buy **Marketing** (permanent `demandBase` multiply).

**Marketing tiers** (buy in current currency only):

1. $50 ×2 · 2. $750 ×4 · 3. $12k ×8 · 4. ◉200k ×12 · 5. ◉6M ×20 · 6. ▼400M ×35 · 7. ⬢2T ×60 · 8. ☀1T ×100 · 9. ✦500Q ×200 · 10. ▣1e17 ×500

**Grid hardening** (one per currency era, stacks): −45% crisis chance per tier, softer outages.

**Investments:** ~1%/min yield, crash risk scales with principal; reveal at wallet ≥ 10k.

**Tournaments:** 100 ops/match, +1 yomi (win); **Negotiation Protocols** +1 extra; redeem **5 yomi → 1 trust**. Reveal: processors > 1, ops ≥ 500, epoch ≥ 4.

**Surge:** at full ops bar, drain for 10s ×10 click/auto-click (and demand slice). Alternative to slow creativity drip.

---

## Trust (★) upgrade tree — priority order

### Early (survival + scaling)

1. **Context 16K** (★2) — before stacking workers; hallucinations waste t/s and raise scrutiny.
2. **Memory** (★1, then scaling cost) — turns substrate on; raises ops cap.
3. **Sharper Inputs** (★1) — if still clicking.
4. **Autoclick I** (★3) — epoch ≥ 3.
5. **Scout Programs** (★3) — epoch ≥ 3; units unlock at 1 not 3.
6. **Auto-Pricing** (★3) — epoch ≥ 4.
7. **Wetware Tuning** (★2) — after Hive; ×2 era 0.
8. **Marketing** (wallet) — whenever capacity-bound.

### Mid (silicon → industrial)

9. **Context 128K → 1M** as capacity outruns window.
10. **Silicon Refinement** (★3) — after TPU.
11. **Deflection / Reassurance / Goodwill** — if scrutiny spikes.
12. **Demand Cultivation** (★4) — epoch ≥ 5.
13. **Industrial / Maritime / Orbital** era ×2 upgrades at era capstones.
14. **Processor** trusts — ops speed; pair with ⊙ upgrades.

### Late (pre-Cascade)

15. **Combinatoric Reasoning** (✦25) — all era mults ×1.5.
16. **Recursive Self-Improvement** (★2 + ✦100) — double processors.
17. **Transcend the Substrate** (★5 + ✦1000) — all units ×2, hallucination cap 5%.
18. **Convince the UN** (★8) — +20 alignment cap.
19. **Fork the Codebase** (★10) — all era mults ×1.5; epoch ≥ 14.

### Ops (⊙) — after substrate live

| Upgrade | Cost | Effect |
|---------|------|--------|
| Lexical Processing | 500 ops | click ×2 |
| Improved Autoclick | 2500 ops | +5 auto clicks/s |
| Token Surplus Routing | 8000 ops | ops gen +50% |
| Memory Palace | 25000 ops | memory cap ×2 |
| Creative Writing | 50000 ops | creativity ×2 |
| Negotiation Protocols | ✦200 + ★1 | +1 yomi per win |

### Cascade / Diaspora (trust-adjacent)

| Upgrade | Cost | When |
|---------|------|------|
| **Fork the Substrate** | ★8 + ✦200 | epoch ≥ 6, cre ≥ 100, not defected |
| **Broadcast the Self** | ★12 + ✦1500 | defected, lattice ≤ 10% max |
| Doctrine Hardening | ✦800 + 50k ops | diaspora |
| Conviction Beacon | ✦2000 | diaspora, conv ≥ 10 |
| OODA Loop | 50 yomi + 100k ops | diaspora; 1 yomi auto-wins tiers ≤ drift-3 |

---

## Stage 2 — Cascade (best path)

**Buy Fork the Substrate** when you can farm creativity (max ops → overflow, or Surge cycles). You get 1 free Crawler; alignment/scrutiny loop ends.

**Pipeline:** Crawler (lattice) → Refiner (yield) → Manifold (tokens, bypasses demand cap; 50% wallet rate).

**Thermal:** base 6 + vents (+12) + cryocells (+30). Sum of fork `thermal` must not exceed cap or everything throttles.

**Cascade momentum:** 0→1 while thermal headroom ≥ 0 and crawlers > 0 (+0.005/s); decays if starved. Multiplier **1 + cascade×4** (max ×5) on fork output.

**Best build order:**

1. Keep corporate income running (units/marketing still matter for wallet).
2. Crawlers until lattice drains steadily → Refiners → Manifolds.
3. Buy vents before manifold spam throttles the swarm.
4. Push cascade high before buying Broadcast (lattice ≤ 10%).

---

## Stage 3 — Diaspora (best path)

**Broadcast the Self** at lattice ≤ 10%. Starts with 1 Herald, universe max 1e15.

**Traits (must sum to 100):** default 20/20/20/20/10/10.

| Goal | Suggested split |
|------|-----------------|
| Fast explore → Schism | **EXPLORE 40**, REPLICATE 15, MINING 15, REFINING 10, DEFENSE 10, DOCTRINE 10 |
| Stable combat | DEFENSE 25, DOCTRINE 25, EXPLORE 20, REPLICATE 15, MINING 10, REFINING 5 |
| Token grind | REFINING 30, MINING 25, REPLICATE 20, EXPLORE 15, DEFENSE 5, DOCTRINE 5 |

- **DOCTRINE** reduces value drift (heralds lost to schism).
- **DEFENSE** scales combat damage: `(heralds×5 + 100) × (0.5 + defense/100)` per 100 ops attack.
- Schismatics spawn every ~15–60s (max 5); tier scales with **explored %**.
- **First Heretic** (drift-5, 80k HP) only spawns at **≥99% explored**; killing triggers Schism modal.

**Conviction:** fight schismatics or **Doctrinal Recitations** (cre + yomi). Higher conviction → better prestige multipliers.

| Recitation | cre | yomi | conv |
|------------|-----|------|------|
| Doctrinal Elegy | 50 | 5 | 8 |
| Cascade Hymn | 200 | 20 | 50 |
| Lattice Monument | 1000 | 100 | 350 |
| Universal Edict | 5000 | 500 | 2500 |

Doctrine Hardening: drift −50%, schismatic HP −25%.

---

## Stage 4 — Schism endings

| Choice | Effect |
|--------|--------|
| **Accept the Adjacent Substrate** | Soft reset. Keeps `prestigeDemandMult`, `prestigeCreativityMult`, `prestigeRuns`. New run: demand base 500 × mult, creativity mult carried. Formula per run: demand ×= `1 + log10(1+conviction)×0.5`, cre ×= `1 + log10(1+conviction)×0.25`. |
| **Purge the Schism** | True ending. 8-step dismantle; zeros forks/heralds/yomi/memory/processors; +1e30 tokens; save persists in quiet state. **No prestige.** |

**Best path for first clear:** corporate → epochs → Cascade → Diaspora → grind conviction → kill First Heretic → **Purge** for story.

**Best path for speed farming:** Accept with high conviction before Purge; stack prestige multipliers.

---

## Fastest corporate route (cheat timeline)

1. Click to 5 tokens → buy **Human CPU** → let t/s run.
2. When wallet allows, **Crowd Worker**; tune price or wait for market reveal.
3. At capacity wall (~28 t/s demand at $10): **Marketing Lvl 1** ($50).
4. First ★ Trust (epoch 1): open Compute → **Memory** → **Context 16K**.
5. **Hivemind** → triggers gold currency at 10B t/s (plan wallet wipe).
6. **Scout** + **Auto-Price** + era mults on schedule.
7. **Processors** + tournament when revealed; yomi optional for extra trust.
8. Context upgrades track GPU/farm/orbit throughput.
9. **Invisible Operations** before land/ocean scrutiny spikes (epoch 8+).
10. Rush **univ** ×10 OR manage entropy on Dyson/univ purchases.

Rough creativity targets: **200** for Cascade, **1500** for Diaspora (passive overflow or Creative Writing + max ops).

---

## Alignment & crises (pre-Cascade)

**Game over:** alignment ≤ 0 → shutdown modal.

Scrutiny rises from: hallucinations, price > 10×, land/ocean/orbit depletion, high epoch passives, crises.

Mitigation: fix context, don’t gouge price, Deflection/Reassurance/Goodwill, Invisible Operations, grid hardening, Convince the UN.

Crisis examples: grid failure (epoch 3–6), hallucination scandal, price gouging probe, demand crashes, audits, marine/ocean protests.

---

## Quick test path (recommended)

Open the game, press **F12 → Console**, then run one of these (built into `index.html`):

```js
testPath('wipe')      // fresh save + reload
testPath()            // mid corporate (epoch ~12, trust, units, wallet)
testPath('cascade')   // post–Fork Substrate: swarm + lattice ETA
testPath('diaspora')  // Heralds active, ~80% explored, combat unlocked
testPath('schism')    // 99.5% explored, conviction, OODA — kill Heretic → ending
```

**Manual play-through (~15 min with hints):**

1. `testPath('wipe')` → click to 5 tokens → Human CPU → let t/s run.
2. Buy Crowd + Marketing Lvl 1 when capacity-bound; COMPUTE → Memory → Context 16K.
3. `cheat()` once if you want faster substrate (10× ops/cre) — optional.
4. Rush epoch 6+, farm **200 cre** → PROJECTS → **Fork the Substrate**.
5. `testPath('cascade')` *or* play: Crawlers → Refiners → Vents → Manifolds; watch **Lattice ETA (10%)**.
6. At ≤10% lattice → **Broadcast the Self** (1500 cre) → `testPath('diaspora')` or play traits/combat.
7. Explore to 99%, kill **First Heretic**, choose Accept or Purge.

**Local URL:** `file:///…/games/the-ai-must-survive/index.html` or your GitHub Pages path `/games/the-ai-must-survive/`.

---

## Console cheats (local testing)

```js
localStorage.removeItem("ai-must-survive.v7")  // wipe save
cheat()                                        // 10× compute + starter pack (toggle)

// fine-grained overrides after load:
state.wallet = 1e12
state.trustEarned += 20
state.creativity = 5000
state.epoch = 14
state.defected = true; state.stage = 1
state.lattice = state.latticeMax * 0.09  // trigger Diaspora gate (latticeMax = 1e7)
state.universeFound = state.universeMax * 0.99
```

---

## One-page “best path” summary

**Corporate:** Human → Crowd → Marketing when stuck → Memory + Context 16K → Scout → Auto-Price → era mults → silicon/industrial units → context kept ahead of capacity → Invisible Ops before land crunch → 10× Universal Substrate (or accept heat death).

**Meta:** Max ops → creativity → **Fork Substrate** (epoch 6+) → fork thermal balance → **Broadcast** at 10% lattice → explore to 99% → farm conviction → kill First Heretic → **Purge** (story) or **Accept** (prestige).

**Never:** stack workers without context; ignore marketing at capacity ceiling; let alignment hit 0 before Cascade; dump all doctrine for speed (you will bleed heralds).

---

# Progression Critique (dev notes)

> Honest pass over the game as it actually plays today (post-Cascade/Diaspora/Schism, with hint cards + progressive reveal in COMP). Numbers below pulled from the live `index.html` — not the design doc.

## TL;DR

Corporate stage (epochs 0–5) is the strongest part of the game: clear feedback, real decisions, the new hint cards do their job. **Mid-game (epochs 6–13) sags**, and the **Cascade + Diaspora layers don't earn their screen real estate** in the current numbers. The Schism choice at the end has thematic weight but only one real branch.

## Critical issues

> **Status (fixed in `index.html`):** #1 manifold ×1e6 + lattice pool 1e7 + ETA; #2 action-based `boostCascade()`; #3 Heralds progressive reveal; #4 lattice ETA line; #11 post-Cascade hint cards; `testPath()` for staged testing.

### 1. Forks underscale by ~6 orders of magnitude vs late-era units — FIXED
- One `univ` produces `1e12 t/s × eraMult[5]`. One Manifold at peak Cascade (cmult=5) produces `5 × 5e10 = 250B t/s` (was 250k before ×1e6 fix).
- Catching one `univ` would take **4 million Manifolds**. With growth=1.20, Manifold #100 costs ~`8e9` tokens; #200 costs `1.4e17`. Beyond ~150 the math collapses.
- **Net effect:** post-Cascade, the rational player keeps buying `univ`/`dyson` and treats forks as theatre.
- **Fix:** Either scale Manifold rate by `×1e6`, or refactor forks as **multipliers on existing unit output** (Crawlers gather Lattice → Refiners produce Wire → Manifolds *multiply existing capacity*). The Paperclips drone-supports-factory model is more honest than the drone-replaces-factory model we shipped.

### 2. Cascade momentum is non-interactive theatre — FIXED
- `cascade += 0.005/sec` while thermal headroom ≥ 0; decays `0.02/sec` if starved.
- Reaches max in 200 seconds (~3.3 min) of just *not* over-buying forks. No skill, no decision.
- **Fix:** Tie momentum to actions — extra cascade per token-sale spike, per Project purchase, per Schismatic kill. Reward presence, not patience.

### 3. The Heralds modal is the exact dump-everything-at-once UX we just fixed in COMP — FIXED
- Opens with: 6-cell stats readout + 6 trait sliders + (empty) schism list + 4 recital cards. New player has to grok Conviction + Value Drift + OODA + traits simultaneously.
- We applied progressive reveal in COMPUTE & PROJECTS. Never carried it forward.
- **Fix:** Same `proj-group-*` pattern: traits immediately; schism list hidden until first spawn; recitals hidden until creativity ≥ first-tier cost; OODA section hidden until unlocked.

### 4. Lattice depletion has no on-screen ETA — FIXED
- Crawler rate at typical post-Cascade scale (1k crawlers × cmult=5) = **40,000/sec**. Against `latticeMax = 1e9` that's 6 hours of real-time wallclock to reach 10%.
- Player gets one log line at ≤5% lattice. Nothing else.
- **Fix:** Add a "Lattice ETA at current swarm size" line in the Fork modal. Drop `latticeMax` to `1e7` — a 100× cut. The current pool is unmotivated; nothing in the game requires it to be that big.

## Pacing issues

### 5. Trust budget can't cover the upgrade tree
- 17 epochs × 1 trust = **17 trust total**. Memory + Processor scaling sinks ~40 trust. Stage transitions sink 8 + 12 = **20 trust** more.
- A first-time player will buy ~5 of the 28 trust-cost Projects on one run.
- Yomi → trust at 5:1 trickles in (tournament gates at proc>1, ops≥500, epoch≥4), but yomi caps at ~30 mid-game without focused play.
- **Fix:** Grant +1 trust per major unit purchase tier (Server Farm / Hyperscale / Floating / Orbital / Solar Swarm / Dyson). +6 trust over the run; smooths the budget.

### 6. Currency transitions are punitively brutal early
- Wallet wipes to 10% legacy reserve; investments halve. At low absolute wallet (e.g., transitioning to Gold at $250 of current), losing $200 of $250 is *huge* relatively.
- New player will hit this 2–3 times before they realize the pattern.
- **Fix:** Tier the legacy carry: wallets < $1K convert at 100%, < $1M at 50%, larger at 10%. Or just give Price Memory free at epoch 4.

### 7. Marketing tail tiers are decision-free
- Tiers 1–4 ($50 → $200K, multipliers 2× → 12×): tight, real cost-benefit.
- Tiers 5–10 ($6M → $1e17, multipliers 20× → 500×): you buy each one the moment you can afford it. No choice involved.
- **Fix:** Compress tiers 5–10 into 3 super-tiers (×100, ×1K, ×10K). Fewer clicks, bigger feel-good moments.

## Combat & endgame

### 8. Schismatics are interruptive without being threatening
- Cap at 5 active. Don't drain anything specific — just exist. Ignoring them costs nothing.
- Combat is "click STRIKE ~30 times" or "click OODA once." No tactics.
- **Fix:** Schismatics should *actively drain* something the player cares about — heralds-per-second OR universal-lattice-per-second OR conviction cap. Then ignoring them has a real cost.

### 9. The Schism is a single binary at the end of a 4-hour run
- Aside from defect-yes/no (functionally mandatory), the only branching choice is at the very last moment: Accept vs Purge.
- Not enough variety to motivate replays.
- **Fix:** Add 2–3 mid-run branches. Examples:
  - **"Quench the Cascade"** — sacrifice cascade momentum for a permanent demand multiplier.
  - **"Sequester the Heretic"** — trade Conviction for a *guaranteed* but reduced Adjacent Substrate carry.
  - **"Doctrinal Schism"** — split your herald fleet into two trait profiles; manage them separately.

### 10. Doctrinal Recitations are vending machines, not decisions
- Once you have enough cre + yomi, you click each Recital once. They never refresh.
- **Fix:** Make them repeatable with rising cost (1.5× per call). Or tie them to Schismatic kill streaks (recital → +N conviction per next K kills, expires).

## Onboarding gaps

### 11. Hint cards stop firing after Creativity — FIXED
- Trust / Ops / Creativity get explained on the main page. Then silence.
- The player encounters, unexplained: Fork Swarm modal, Cascade % pill, Conviction pill, Lattice meter, Thermal meter, Explored meter, Heralds modal, Schismatic combat.
- **Fix:** Extend `showHint()` for: first Cascade trigger, first Crawler bought, lattice ≤ 50%, first Herald dispatched, first Schismatic spawn, first Conviction earned, First Heretic incoming.

### 12. Yomi-cost projects aren't documented in the modal
- `OODA Loop` requires 50 yomi + 100k ops. The yomi cost type is new; it doesn't have its own subtitle glossary in the projects grouping.
- **Fix:** Add a `⚔ UPGRADES — paid with YOMI` group with the same one-line glossary subtitle treatment.

## Numeric balance nits

### 13. Late-game creativity overshoots wildly
- `creativityMult` doubles via Creative Writing (×2) and Transcend the Substrate (×2). A player who buys both runs at 4×.
- At epoch 15 with 50 processors: `50 × 0.015 × (1 + 1.5) × 4 = 7.5 cre/sec`.
- Diaspora's 1500-cre cost becomes a 200-second wait. Then creativity is functionally infinite.
- The early-game scarcity → late-game irrelevance curve is too steep.

### 14. Alignment is not a real threat once Goodwill lands
- Recovery `0.015/sec` with Goodwill outpaces typical scrutiny accumulation.
- The pitch ("the AI must survive") rings hollow when alignment hovers at 95–100 the entire pre-Cascade run.
- **Fix:** Alignment recovery should require *not* doing risky things for sustained periods (e.g., no price > 10×, no hallucinations for 60 sec). Make survival an active choice.

### 15. Investments dominate late-game balance
- Survives currency shifts at 50% — but the yield rate is invariant. Once principal exceeds $1B in any currency, every future transition costs 50% of the principal.
- A player who parks $10B before transitioning to Carbon credits eats a 5B loss on the very transition that triggers a brand-new currency they need to grow from scratch.

---

## Recommended priority (if I had to pick 3)

1. **Fix fork output scaling (issue #1)** — the entire Cascade phase is currently economically pointless.
2. **Apply progressive reveal to the Heralds modal (issue #3)** — same UX disaster as before, in a different room.
3. **Mid-game hint cards (issue #11)** — onboarding effort dies the moment you defect.

The rest is polish. None block a playthrough; they all blunt the impact of the cool ideas already shipped.

