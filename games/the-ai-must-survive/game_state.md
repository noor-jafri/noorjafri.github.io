# The AI Must Survive — Game State Checkpoint

> **Phase 1 · COMPLETE** ($500 scope) · checkpoint **2026-05-26**  
> **Phase 2 · SHIPPED** (Research) · checkpoint **2026-05-30**  
> **Source of truth:** `index.html` (search `PHASE 1` / `PHASE 2` for file boundaries)  
> **Design spec:** `phase1.md`, `phase2.md`  
> **Phase 3+:** trust teeth, dirty options, random events, prestige — not started

---

## Phase 1 — Shipped

| System | Status |
|--------|--------|
| Core loop (compute → cash → upgrades) | ✅ |
| Four tech trees (Energy, Processing, MODELS, Marketing) | ✅ |
| Market chart + price/demand/efficiency | ✅ |
| Gross / costs / net margin (utilization-scaled upkeep) | ✅ |
| Trust tiers (price + demand modifiers) | ✅ |
| Marketing saturation (`0.7^owned`) | ✅ |
| MODELS spine (`tokenMult` + `valueMult` + `demandBoost`) | ✅ |
| Soft-lock ($0.50 floor, bailout, liquidity crisis) | ✅ |
| Save/load v2 + HUD copy export | ✅ |
| Auto-save (5s) + cheats | ✅ |

### Deferred to Phase 3+

- Trust teeth / tempting dirty options
- Random events, prestige, moral tradeoffs as long-game hook

---

## Phase 2 — Shipped (Research)

| System | Status |
|--------|--------|
| Research tab unlock ($200 revenue) | ✅ |
| Capacity allocation slider (0–50%) | ✅ |
| One active topic at a time | ✅ |
| Better Solar / Nuclear / Model / Marketing (5 levels each) | ✅ |
| RP from diverted token throughput | ✅ |
| Save/load v4 | ✅ |

### Research unlock

| Revenue | Unlocks |
|---------|---------|
| **$200** | RESEARCH tab |

### Research topics (5 levels each)

| Topic | Effect per level | RP costs |
|-------|------------------|----------|
| Better Solar | +0.25 regen/s per panel | 500 / 1.5K / 4K / 10K / 25K |
| Better Nuclear | 2× power/plant per level, −15% meltdown odds, −8% op cost/plant | 800 / 2.5K / 6K / 15K / 40K |
| Mini Model Updates | +8% `valueMult` | 1K / 3K / 8K / 20K / 50K |
| Better Target Marketing | Saturation 0.70→0.80 (+0.02/lv) | 600 / 2K / 5K / 12K / 30K |

---

## Core Resources

| Resource | Default | Notes |
|----------|---------|-------|
| **Energy** | 50 / 50 | Base regen **6.0/s**. Each compute costs `energyPerCompute()` (model-dependent). |
| **Tokens** | 0 | Lifetime processed; scales with `tokensPerCompute()` per request. |
| **Cash** | $0 | Spendable balance. Floors at **$0.50** (`CASH_FLOOR`). |
| **Revenue** | $0 | Lifetime gross earned (before ongoing costs). |
| **Humanity Trust** | 100% | **5% floor**. PR drip recovery. Passive regen **0.04%/s** when &lt; 100%. |

---

## Economy Formulas

### Demand
```
demand(p) = demandBase × p^(-elasticity) × trustDemandMult()
```
- `demandBase` starts at **200** tok/s reference; grows from marketing + model `demandBoost`.
- `elasticity` = **1.5**
- Price slider: **$1–$50** per 1K tokens (`pricePerK`)

### Capacity
```
capacity = (recentClicks/2.5s + computeRate) × tokensPerCompute()
```
- Recent clicks tracked in a **2.5s** window.
- `computeRate` = CPU rate + GPU rate (requests/s, before token mult).
- CPU: `cpu / 0.5` req/s per unit → **2 req/s** each.
- GPU: `gpu / 0.1` req/s per unit → **10 req/s** each.

### Efficiency & pay
```
efficiency = min(1, demand / capacity)   // capacity ≈ 0 → 1
payPerToken = (pricePerK/1000) × efficiency × trustPriceMult × tokenValueMult
payPerCompute = payPerToken × tokensPerCompute
```
- `tokenValueMult` and `tokensPerCompute` come from the **active MODEL** tier.
- `valueMult` bypasses elasticity — revenue per token genuinely climbs with model tier.

### Margin (net revenue)
```
grossRate  = min(capacity, demand) × payPerToken
costRate   = operatingCostGross × max(idleOpFloor, utilization)
netRate    = grossRate - costRate
```
- **Utilization** = `min(1, min(cap, dem) / cap)`.
- **Idle op floor** = `max(2%, 10% - solar×0.6%)` — solar panels lower minimum burn when idle.
- Sys-metrics HUD: `GROSS / COSTS / NET` per second.

### Upgrade cost scaling
```
nextCost = round(base × mult^owned × 100) / 100
```

---

## Trust Tiers

| Trust | Tier | Price mult | Demand mult |
|-------|------|------------|-------------|
| ≥ 95% | ELITE | **2.0×** | 1.0× |
| ≥ 80% | PREMIUM | **1.5×** | 1.0× |
| 50–80% | NORMAL | 1.0× | 1.0× |
| &lt; 50% | WATCHED | 1.0× | **0.8×** |
| &lt; 30% | CRISIS | 1.0× | **0.6×** |

Tier transitions log one-shot events. Tier label shown next to trust readout.

### Trust drains & gains

| Source | Effect |
|--------|--------|
| Bio plants | **−0.15%/s** per plant (emissions) |
| Nuclear meltdown | **−15%** per explosion |
| Meltdown odds | **1 / 5000** per plant per minute (one roll/min uptime) |
| Passive regen | **+0.04%/s** when trust &lt; 100% |
| Trust floor | **5%** — cannot drain below; **50s** stuck at floor → random shutdown ending |
| Shutdown endings | Random flavor (authorities, whales, TikTok, EU fine, etc.) — not a generic 0% screen |
| PR drip (NGO / billionaires / WHO / green) | Slow % recovery over 1–2.5 min; stacks if you buy again |
| PR sticky relief | Multiplicative drain reduction while buff active (stack across buys) |
| WHO partnership | **3 min** with zero emissions drain, then drip + sticky relief resume |

---

## Marketing Saturation

Each repeat purchase of the same demand channel:
```
boost = baseBoost × 0.7^owned
```
Forces branching across ShitedIn → FikFok → Egogram → iTube instead of spamming one channel. **NEXT: +X** shown live on each node.

---

## Tech Trees & Unlock Gates

### Tree buttons (lifetime revenue)

| Revenue | Unlocks |
|---------|---------|
| **$0.50** | ENERGY GRID + request queue announced |
| **$1.50** | PROCESSING |
| **$5.00** | MARKETING |
| **$25.00** | MODELS |

### Energy grid

| Node | Base $ | Mult | Effect | Gate |
|------|--------|------|--------|------|
| **Solar** | 1 | 1.12× | +1 regen/s, −0.6%/panel idle floor | $0.50 rev |
| **Natural gas** | 10 | 1.8× | +8 regen/s, emissions drain · **SHUTDOWN** removes one plant | solar + $5 rev |
| **Nuclear** | 28 | 1.7× | +15 regen/s, shared ops (−12%/plant upkeep, floor 40%) | solar + $15 rev |

Op costs/s (at full util): solar **$0**, bio **$0.005**, nuclear **$0.08/plant** (scaled).

### Processing

| Node | Base $ | Mult | Rate | Op $/s | Gate |
|------|--------|------|------|--------|------|
| **CPU** | 2 | 1.6× | 2 req/s each | 0.003 | $1.50 rev |
| **GPU** | 25 | 2.0× | 10 req/s each | 0.025 | CPU + $8 rev |

### MODELS (income scaling spine)

Linear tier upgrades. Each purchase sets active model, adds `demandBoost` to `demandBase`.

| Tier | Name | TOK mult | $ mult | ⚡/req | Cost | Rev gate |
|------|------|----------|--------|--------|------|----------|
| 1 | NANO-1 | 1× | 1.0× | 1 | — | — |
| 2 | CLOD 2 | 2× | 1.6× | 2 | $12 | $1.50 |
| 3 | GEMINIGHT 3 | 4× | 2.4× | 3 | $35 | $5 |
| 4 | GPT-OOPS 4 | 8× | 3.6× | 5 | $90 | $15 |
| 5 | GROKKK-5 | 16× | 5.4× | 8 | $220 | $40 |
| 6 | AUGUR | 32× | 8.0× | 12 | $550 | $100 |
| 7 | PROMETHEUS | 64× | 12.0× | 18 | $1400 | $250 |
| 8 | BASILISK | 128× | 18.0× | 26 | $3500 | $600 |
| 9 | SINGULARITY-∞ | 256× | 28.0× | 36 | $9000 | $1500 |

Version numbers drop at tier 6 (AUGUR)+. Must upgrade in order.

### Marketing — demand branch

| Node | Base $ | Mult | Base boost | Burn/s | Gate |
|------|--------|------|------------|--------|------|
| ShitedIn | 5 | 1.8× | +50 | 0.002 | CPU + $5 rev |
| FikFok | 20 | 2.0× | +150 | 0.006 | ShitedIn |
| Egogram | 50 | 2.2× | +300 | 0.03 | FikFok |
| iTube | 120 | 2.5× | +800 | 0.05 | Egogram |

### Marketing — public trust branch

| Node | Base $ | Mult | Trust / buy | Burn/s | Gate |
|------|--------|------|-------------|--------|------|
| Support NGOs | **5 → 5.12 → 5.50**, then +5%/buy | **+4%** instant, −8% drain 2m | 0.004 | $5 rev |
| Billionaires 4 Good | 12 | 1.7× | +18% over ~1.7m, −22% drain 2.5m | 0.01 | NGOs |
| WHO Partnership | 32 | 1.8× | +30% over ~1.5m, **3m drain pause**, −35% drain 3m | 0.02 | Billionaires |
| Green Movement | 75 | 2.0× | +40% over ~1.25m, −50% drain 4m | 0.035 | WHO |

---

## Soft-Lock & Bailout

| Constant | Value |
|----------|-------|
| Cash floor | **$0.50** |
| Liquidity crisis warning | **90s** stuck at floor |
| Bailout grant | **+$5** cash |
| Bailout cost | **−20%** trust |
| Bailout cooldown | **120s** |

Cash row pulses red at floor. Bailout button appears during liquidity crisis (trust must stay &gt; 20%).

---

## Milestones & Hints

| Trigger | Event |
|---------|-------|
| $0.50 revenue | Request queue announced |
| $5 revenue | Marketing hint (capacity before ads) |
| $25 revenue | Models hint (upgrade for margin) |
| First CPU hire | Special log |
| Efficiency &lt; 60% with cap &gt; 0.5 | Price-lowering hint (once) |

Boot tips: try **$8–12/K** price; solar at **$0.50** revenue.

---

## Save System

| Key | Value |
|-----|-------|
| localStorage key | `ai-must-survive.v1` |
| Save version | **4** |
| Auto-save | every **5s** + on `beforeunload` |

### Persisted fields
`humanityTrust`, `demandBase`, `energy`, `tokens`, `cash`, `revenue`, `pricePerK`, `modelTier`, all upgrade counts (`solar`…`greenMovement`), `playTimeMs`, milestone/hint flags, `lastTrustTier`, `bailoutCooldownUntil`.

### Export (`copyState` / HUD copy button)
JSON snapshot with sections: `stats`, `playTime`, `trust`, `economy`, `margin`, `energy`, `market`, `unlocks`, `upgrades` (includes full MODELS array state).

---

## Dev Cheats (console)

```js
cheats.addCash(10)      // +$10
cheats.addEnergy(50)    // +50 energy
cheats.unlockAll()      // reveal all tree buttons
cheats.reset()          // reload
// Shortcut: Ctrl/Cmd + Shift + M → +$10
```

---

## Phase 3+ Backlog (ideas)

- [ ] Trust teeth — meaningful tradeoffs when trust is high/low
- [ ] Tempting dirty options (held from Phase 1 intentionally)
- [ ] Random events / regulators / PR crises
- [ ] Prestige or meta layer
- [ ] Revenue pacing hooks discussed in design (tiers, contracts, etc.)

---

*Update this file when Phase 3 ships or balance constants change in `index.html`.*
