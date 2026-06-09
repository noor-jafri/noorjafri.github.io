# The AI Must Survive — Game State Checkpoint

> **Phase 1 · COMPLETE** ($500 scope) · checkpoint **2026-05-26**  
> **Phase 2 · SHIPPED** (Research) · checkpoint **2026-05-30**  
> **Phase 3 · SHIPPED** (Growth Era + Investments) · checkpoint **2026-05-30**  
> **Phase 4 · SHIPPED** (Influence Era) · checkpoint **2026-06-06**  
> **Phase 4.1 · SHIPPED** (Polish + WSB rework) · checkpoint **2026-06-07**  
> **Source of truth:** `index.html` (search `PHASE 1` / `PHASE 2` / `PHASE 3` / `PHASE 4`)  
> **Design specs:** `phase1.md`, `phase2.md`, `phase3.md`, `phase4.md`

---

## Phase 4.1 — Polish & Rework (2026-06-07)

| Change | Status |
|--------|--------|
| Phase description thresholds fixed in help modal ($200/$800/$3,000) | ✅ |
| Advanced Energy Research, Inference Cost Collapse, Self-Optimising Models locked behind Phase 4 with golden padlock | ✅ |
| RESEARCH ERA badge added (Survival → Research → Growth → Influence) | ✅ |
| RDU node renamed to "RDU INFERENCE CHIPS" with updated description | ✅ |
| Phase 3 unlock dramatic multi-message sequence (user's exact words) | ✅ |
| Tab name spacing: "PoloBets" → "POLO BETS", "WallStreetBets" → "WALL STREET BETS" | ✅ |
| PoloBets full UI rework: stake slider, quick-bet buttons ($1/$5/$10/$25/50%/MAX), P&L stats | ✅ |
| 100 PoloBets questions, 25–40s resolve time, no repeat questions | ✅ |
| Resolution only on bet placement (no timer-driven auto-resolve without active bet) | ✅ |
| Polo winnings count toward lifetime revenue | ✅ |
| YES/NO bold selection with solid fill + glow; unselected dimmed | ✅ |
| Default starting state: cash = $2,000, revenue = $2,000 | ✅ |
| WSB redesign: manual lump-sum INVEST per sector (input + INVEST button); removed per-second auto-drain | ✅ |
| WSB available cash shown at top of panel | ✅ |
| Flood News unlock gives +15 demandBase boost on completion | ✅ |

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

---

## Phase 2 — Shipped (Research)

| System | Status |
|--------|--------|
| Research tab unlock ($200 revenue) | ✅ |
| Capacity allocation slider (0–50%) | ✅ |
| One active topic at a time | ✅ |
| 4 original topics: Better Solar / Nuclear / Model / Marketing (5 levels each) | ✅ |
| RP from diverted token throughput | ✅ |
| Save/load v4 | ✅ |

### Research topics (5 levels each)

| Topic | Effect per level | RP costs |
|-------|------------------|----------|
| Better Solar | +0.25 regen/s per panel | 500 / 1.5K / 4K / 10K / 25K |
| Better Nuclear | 2× power/plant, −15% meltdown, −8% op cost | 800 / 2.5K / 6K / 15K / 40K |
| Mini Model Updates | +8% `valueMult` | 1K / 3K / 8K / 20K / 50K |
| Better Target Marketing | Saturation 0.70→0.80 (+0.02/lv) | 600 / 2K / 5K / 12K / 30K |
| ⚡ Advanced Energy Research *(Phase 4)* | +20% energy regen from all sources | 5K / 15K / 40K / 100K / 250K |
| 💸 Inference Cost Collapse *(Phase 4)* | −12% operating costs | 6K / 18K / 50K / 120K / 300K |
| 🧠 Self-Optimising Models *(Phase 4)* | +10% token value multiplier | 8K / 25K / 70K / 180K / 450K |

---

## Phase 3 — Shipped (Growth Era + Investments)

| System | Status |
|--------|--------|
| Era badge (Survival → Research → Growth → Influence) | ✅ |
| INVEST tab unlock ($800 revenue) | ✅ |
| WallStreetBets — manual lump-sum invest per sector | ✅ |
| PoloBets — 100 questions, no-repeat pool, 25–40s resolve | ✅ |
| Polo winnings count toward lifetime revenue | ✅ |
| Random returns with streak + analysis bonus | ✅ |
| Withdraw to cash per sector | ✅ |
| Save/load v5 | ✅ |

### WallStreetBets sector profiles

| Sector | Win Rate | Swing | Loss Dampen |
|--------|----------|-------|-------------|
| Military (DEF) | 56% | 0.4–1.5% | 85% |
| Silicon (CPU) | 52% | 1.0–4.0% | 80% |
| Eco Grid (ECO) | 58% | 0.3–1.2% | 75% |
| Biotech (BIO) | 42% | 1.0–8.0% | 90% |
| Netware (NET) | 50% | 1.5–5.0% | 85% |

### PoloBets

- 100 satirical/political headlines (+ war headlines when Manufacture Conflict active)
- No-repeat question pool; reshuffles when exhausted
- Resolves in 25–40s · Payout 2× + analysis bonus
- Base win chance 50% (65% with Astroturf Comments influence node)
- Resolution only fires when a bet is placed (no idle auto-resolve)
- Winnings added to both cash and lifetime revenue

---

## Phase 4 — Shipped (Influence Era)

| System | Status |
|--------|--------|
| Era badge (Growth → Influence, gold/crimson) at $3,000 revenue | ✅ |
| INFLUENCE tab unlock | ✅ |
| Influence Division modal (vertical tree layout) | ✅ |
| Serial unlock queue (one at a time, token cost + timer) | ✅ |
| Media chain (5 nodes, top-to-bottom) | ✅ |
| Political chain (4 nodes + Lobby branch) | ✅ |
| RDU Inference Chips → Processing tree | ✅ |
| 3 new Research topics (Advanced Energy / Inference Collapse / Self-Optimising) locked behind Phase 4 | ✅ |
| Vertical Marketing expansion (4 nodes after iTube) | ✅ |
| All effects wired into existing systems | ✅ |
| Flood News completion → +15 demandBase boost | ✅ |
| Save/load v6 | ✅ |

### Influence Era unlock

| Revenue | Event |
|---------|-------|
| **$3,000** | INFLUENCE tab + gold era badge + `[PHASE 4]` log |
| **$50,000** | Pacing milestone (no gate — era continues open-ended) |

### Influence tree — token costs & timers

**Root gate (top of both chains):**

| Node | Prereq | Tokens | Timer | Effect |
|------|--------|--------|-------|--------|
| 🕸️ Soft Control | Influence Era | 50K | 1m | +5% all WSB returns · unlocks both chains |

**📰 Media chain (left column, unlocks sequentially):**

| Node | Prereq | Tokens | Timer | Effect |
|------|--------|--------|-------|--------|
| Flood News | Soft Control | 40K | 1m | +6% WSB win-rate · passive trust regen · +15 demandBase |
| Astroturf Comments | Flood News | 80K | 2m | PoloBets win 50%→65% |
| Propaganda on AI | Astroturf | 90K | 2.5m | Trust regen ↑↑ · demand +500 base · gates Political |
| Own the Narrative | Propaganda | 200K | 4m | Stacks media buffs · −50% PR event severity |
| Memetic Engineering | Own Network | 400K | 6m | +40% global demandBase multiplier |

**🏛️ Political chain (right column, gated by Propaganda):**

| Node | Prereq | Tokens | Timer | Effect |
|------|--------|--------|-------|--------|
| Right-Wing Parties | Soft Control + Propaganda | 80K | 2m | Auto-unlocks Gov Contracts |
| Gov Contracts | Right-Wing (auto) | — | — | +2,000 flat demandBase |
| Manufacture Conflict | Gov Contracts | 150K | 4m | +50% Military returns & win-rate · war PoloBets headlines |
| Privatize Everything | Wars | 300K | 6m | 2× Gov Contracts bonus |
| Lobby Regulators *(branch right)* | Right-Wing | 100K | 3m | Bio plant trust drain eliminated |

### Processing tree additions (Phase 4)

| Node | Base $ | Mult | Effect | Gate |
|------|--------|------|--------|------|
| RDU Inference Chips | 2,500 | 3.5× | 4× compute throughput (same energy) | GPU + Influence Era |

### Vertical Marketing expansion (Phase 4)

| Node | Base $ | Mult | Base boost | Burn/s | Gate |
|------|--------|------|------------|--------|------|
| Billboard Megagrid | 300 | 2.8× | +1,500 | 0.12 | iTube + Influence Era |
| AI Influencer Army | 700 | 3.0× | +3,500 | 0.30 | Billboard |
| Neural Ad Implants | 1,800 | 3.2× | +8,000 | 0.75 | AI Influencers |
| Dream Sponsorships | 4,500 | 3.5× | +20,000 | 2.0 | Neural Ads |

### Phase 4 effects on existing systems

| Influence node / research | System hooked |
|---------------------------|---------------|
| Soft Control | WSB all sectors ×1.05 on wins |
| Flood News | `effectiveWinRate +0.06` all WSB sectors · demandBase +15 on unlock |
| Astroturf | `poloWinChance` 0.50→0.65 |
| Propaganda | trust regen +0.15%/s · demandBase +500 |
| Own Network | trust regen +0.08%/s · nuclear meltdown trust loss ×0.5 |
| Memetic Engineering | demand formula ×1.40 |
| Gov Contracts | demandBase +2,000 (×2 with Privatize) |
| Manufacture Conflict | Military WSB winRate +0.50 mag · war headlines in PoloBets |
| Lobby Regulators | bio plant trust drain = 0 |
| RDU Cluster Farms | `computeRate` ×4 |
| Adv. Energy Research (lv) | `energyRegen` × (1 + 0.20×lv) |
| Inference Collapse (lv) | `operatingCostGross` × max(0.10, 1 − 0.12×lv) |
| Self-Optimising Models (lv) | `tokenValueMult` × (1 + 0.10×lv) |

---

## Core Resources

| Resource | Default | Notes |
|----------|---------|-------|
| **Energy** | 50 / 50 | Base regen **6.0/s**. Scaled by Adv. Energy Research. |
| **Tokens** | 0 | Lifetime processed; also spent on Influence unlocks. |
| **Cash** | $2,000 | Spendable. Floors at **$0.50**. |
| **Revenue** | $2,000 | Lifetime gross (unlock gates key off this). Starting in Growth Era. |
| **Humanity Trust** | 100% | **5% floor**. Passive regen **0.04%/s** + influence media boosts. |

---

## Economy Formulas

### Demand (Phase 4 extended)
```
effectiveDemandBase = (S.demandBase + infDemandBonus()) × infDemandMult()
demand(p) = effectiveDemandBase × p^(-1.5) × trustDemandMult()

infDemandBonus()  = infGovContracts ? 2000 × (infPrivatize ? 2 : 1) : 0
                  + infPropaganda   ? 500 : 0
infDemandMult()   = infMemetic ? 1.40 : 1.0
```

### Capacity (Phase 4 extended)
```
computeRate = (cpu/0.5 + gpu/0.1) × (rduClusters > 0 ? 4.0 : 1.0)
capacity    = (recentClicks/2.5s + computeRate) × tokensPerCompute()
```

### Token value (Phase 4 extended)
```
tokenValueMult = model.valueMult × (1 + 0.08×researchModel) × (1 + 0.10×researchSelfKernels)
```

### Energy regen (Phase 4 extended)
```
energyRegen = (base + solar×bonus + nuclear×bonus + bio×bonus) × (1 + 0.20×researchAdvEnergy)
```

### Operating cost (Phase 4 extended)
```
operatingCostGross = (all hardware + marketing burns + thermal) × max(0.10, 1 − 0.12×researchInfCollapse)
```

---

## Trust Tiers

| Trust | Tier | Price mult | Demand mult |
|-------|------|------------|-------------|
| ≥ 95% | ELITE | **2.0×** | 1.0× |
| ≥ 80% | PREMIUM | **1.5×** | 1.0× |
| 50–80% | NORMAL | 1.0× | 1.0× |
| < 50% | WATCHED | 1.0× | **0.8×** |
| < 30% | CRISIS | 1.0× | **0.6×** |

### Trust drains & gains

| Source | Effect |
|--------|--------|
| Bio plants | **−0.15%/s** per plant (0 with Lobby Regulators) |
| Nuclear meltdown | **−15%** (−7.5% with Own Network) |
| Meltdown odds | 1/5000 per plant per minute |
| Passive regen | **+0.04%/s** base · +0.06 Flood News · +0.15 Propaganda · +0.08 Own Network |
| Trust floor | **5%** → 50s stuck → random shutdown |
| PR buys (NGO/Billionaires/WHO/Green) | Drip recovery + drain relief |

---

## Tech Trees & Unlock Gates

| Revenue | Unlocks |
|---------|---------|
| **$0.50** | ENERGY GRID |
| **$1.50** | PROCESSING |
| **$5.00** | MARKETING |
| **$25.00** | MODELS |
| **$200** | RESEARCH + Research Era badge |
| **$800** | INVEST + Growth Era badge |
| **$3,000** | INFLUENCE + Influence Era badge |

---

## Save System

| Key | Value |
|-----|-------|
| localStorage key | `ai-must-survive.v1` |
| Save version | **6** |
| Auto-save | every **5s** + on `beforeunload` |

### Persisted fields (Phase 4)
`influenceEraUnlocked`, `influenceTokensSpent`, `influenceActiveUnlock`, `infSoftControl`, `infFloodNews`, `infAstroturf`, `infPropaganda`, `infOwnNetwork`, `infMemetic`, `infRightWing`, `infGovContracts`, `infWars`, `infPrivatize`, `infLobby`, `rduClusters`, `researchAdvEnergy`, `researchInfCollapse`, `researchSelfKernels`, `mktBillboard`, `mktInfluencerArmy`, `mktNeuralAds`, `mktDreamSponsor`

---

## Dev Cheats (console)

```js
cheats.addCash(10)          // +$10
cheats.addTokens(100000)    // +100K tokens
cheats.addEnergy(50)        // +50 energy
cheats.unlockAll()          // all trees + Influence Era
cheats.reset()              // reload
// Shortcut: Ctrl/Cmd + Shift + M → +$10
```

---

*Updated 2026-06-07 after Phase 4.1 polish pass. Next: Phase 5 scope TBD.*
