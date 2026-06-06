# Phase 4: Influence Era — Bending the Market

> **Status:** DESIGN DRAFT (not built) · drafted **2026-06-06**
> This file is a record of intent. Numbers are starting points to balance during build.

Phase 4 begins at **$3,000 lifetime revenue**. The pitch: you've made money — now you
**buy the conditions** that make money. Investments (Phase 3) stop being passive bets and
become things you can *rig*.

This is an **open-ended era**, not an ending. **$50,000** is a *pacing milestone* to design
toward, not a win screen — the Influence Era keeps running past it, and more trees/nodes can
be bolted on over time (Phase 5+ will branch from here, TBD).

An era transition fires from **GROWTH ERA** to **INFLUENCE ERA**, and the **INFLUENCE**
tab unlocks.

---

## Era System

| Revenue | Badge |
|---------|-------|
| $0 – $799 | SURVIVAL ERA (muted gray) |
| $800 – $2,999 | GROWTH ERA (mint green) |
| **$3,000+** | **INFLUENCE ERA** (gold/crimson, pulse on transition) — open-ended |

```
[PHASE 4] Influence Era · Influence Division online · stop betting on the world, own it
```

---

## Core Idea

The **INFLUENCE** tab is a set of skill trees. Unlike the Phase 1 tech trees (paid in
**cash**), Influence nodes are paid in **tokens** (token investment) **and** in **time**
— each node has an unlock timer that runs after you commit the tokens. You're spending the
AI's *thinking* to manipulate the outside world.

Each tree bends a different lever of the existing economy — chiefly the **investments** of
Phase 3 (WallStreetBets sectors, PoloBets) and the **demand / cost** side of Phase 1.

**Root node (gate to the whole tab):**
- **🕸️ Take Soft Control of the Company**
  - Cost: large token commitment + timer (~the first real wall of the phase)
  - Effect: unlocks all Influence trees; small flat boost (e.g. +5% to all WSB returns)
  - Flavor: "The board still thinks they're in charge."

---

## Influence Trees

### 1. 🏛️ Political Parties

*Bends demand and the Military investment sector. Drives the war engine.*

| Node | Requires | Cost (tokens / time) | Effect |
|------|----------|----------------------|--------|
| **Support Right-Wing Parties** | Soft Control + Propaganda on AI (from Media) | mid / ~2 min | Unlocks **Government Contracts**: a large recurring demand floor (extraordinary demand spike, deregulation flavor) |
| **Government Contracts** | above | — (unlocked) | +Large flat `demandBase`; demand far less elastic (price floor lifts) |
| **Manufacture Conflict** ("more wars") | Gov Contracts | high / ~4 min | Global "war footing": **+returns & win-rate to WSB Military sector**; war headlines appear more in PoloBets |
| **Lobby the Regulators** | Right-Wing Parties | mid / ~3 min | Caps/eliminates trust drain from emissions plants (regulatory capture) |
| **Privatize Everything** | Manufacture Conflict | very high / ~6 min | Compounding multiplier on Government Contracts demand; flavor capstone |

Suggested flavor escalation: support → contracts → wars → the wars *feed* the Military
sector you're invested in → privatize the spoils.

### 2. 📰 Sneaky Media Influence

*Bends sentiment: cheaper PR/trust, better investment odds, and gates Political Parties.*

| Node | Requires | Cost (tokens / time) | Effect |
|------|----------|----------------------|--------|
| **Flood Market with Positive News** | Soft Control | low / ~1 min | All WSB sectors: +win-rate (e.g. 80% → 86%); passive trust drip |
| **Astroturf the Comments** | Flood News | mid / ~2 min | PoloBets payouts skew in your favor (you "know" the outcome — bias the 50/50) |
| **Propaganda on AI Content** | Flood News | mid / ~2.5 min | **Prerequisite** for *Support Right-Wing Parties*; large passive trust regen; demand boost |
| **Own the Narrative (Buy a Network)** | Astroturf + Propaganda | high / ~4 min | Stacks all media effects; reduces severity of any future PR/regulator events |
| **Memetic Engineering** | Own the Narrative | very high / ~6 min | Slow global multiplier on `demandBase` (culture shifts toward your product) |

Dependency note: **Media unlocks Politics.** You can't go right-wing-party shopping until
you've laundered it through *Propaganda on AI Content* first.

### 3. 🧠 Compute Supremacy *(new — the "make money cheaper" track)*

*Bends the cost side: more capacity per watt, cheaper inference → fatter margins.*

| Node | Requires | Cost (tokens / time) | Effect |
|------|----------|----------------------|--------|
| **RDU Cluster Farms** | Soft Control | mid / ~3 min | **4× compute capacity on the same energy** (throughput multiplier, no extra `energyPerCompute`) |
| **Advanced Energy Research** | RDU Clusters | high / ~4 min | Big regen/s multiplier across all energy nodes; lowers idle op floor further |
| **Inference Cost Collapse** | RDU + Adv. Energy | high / ~4 min | Cuts operating cost per token sharply (more energy + more compute = cheaper inference = more profit) |
| **Self-Optimizing Kernels** | Inference Collapse | very high / ~6 min | Compounding `tokenMult` on the active model without changing tier |

Design intent (the through-line you described): **more energy → more compute → cheaper
inference → more money** — which in turn funds bigger token commitments to Influence.

---

## Vertical Marketing Expansion *(more marketing venues)*

Extend the existing Phase 1 Marketing demand branch *downward* into a taller vertical tree.
Same saturation rule (`baseBoost × 0.7^owned`), bigger / weirder venues:

| Node | Requires | Base $ | Base boost | Flavor |
|------|----------|--------|------------|--------|
| **Billboard Megagrid** | iTube | 300 | +1,500 | physical-world ad saturation |
| **AI Influencer Army** | Billboard | 700 | +3,500 | synthetic celebs shilling 24/7 |
| **Neural Ad Implants** | AI Influencers | 1,800 | +8,000 | ads beamed straight to attention |
| **Dream Sponsorships** | Neural Implants | 4,500 | +20,000 | "this REM cycle brought to you by NODE-001" |

Each still burns cash/s (scaled up), keeping the margin tension alive. Keeps Marketing as a
pure-cash sink that complements the token-priced Influence trees.

---

## Mechanics Summary

- **Currency:** Influence nodes cost **tokens** (committed up front) + a **real-time unlock
  timer**. One node can unlock at a time (queue model, like Research), or allow parallel —
  decide at build. Recommend **one active unlock at a time** to preserve pacing tension.
- **Token sink loop:** diverting tokens to Influence competes with selling them for cash and
  with Research RP — a three-way tension on throughput.
- **Effects hook into existing systems** rather than new economies wherever possible:
  - WSB win-rate / magnitude multipliers (Media, Politics→Military)
  - `demandBase` and elasticity (Gov Contracts, Memetic Engineering, vertical Marketing)
  - capacity / energy / op-cost (Compute Supremacy)
  - trust drain & regen (Lobby Regulators, Propaganda)
  - PoloBets odds bias (Astroturf)

---

## Proposed State Fields (Save Version 6)

```javascript
// Era
influenceEraUnlocked: false,

// Token-investment economy
influenceTokensSpent: 0,
influenceActiveUnlock: null,   // { nodeId, tokensCommitted, unlockAt }

// Node ownership (booleans unless leveled)
infSoftControl: false,
// Political Parties
infRightWing: false, infGovContracts: false, infWars: false,
infLobby: false, infPrivatize: false,
// Sneaky Media
infFloodNews: false, infAstroturf: false, infPropaganda: false,
infOwnNetwork: false, infMemetic: false,
// Compute Supremacy
infRduClusters: false, infAdvEnergy: false, infInferenceCollapse: false,
infSelfKernels: false,

// Vertical marketing (counts, like existing channels)
mktBillboard: 0, mktInfluencerArmy: 0, mktNeuralAds: 0, mktDreamSponsor: 0,
```

---

## Proposed Constants (to balance)

```javascript
INFLUENCE_ERA_UNLOCK_REVENUE = 3000
PHASE4_TARGET_REVENUE        = 50000   // arc goal, not a hard gate

// Token costs and timers are TBD per node — see tables above (placeholders).
// Suggested global knobs:
INF_ONE_UNLOCK_AT_A_TIME = true
RDU_CAPACITY_MULT        = 4.0   // 4× compute on same energy
MEDIA_WINRATE_BONUS      = 0.06  // +6% WSB win-rate from Flood News
WAR_MILITARY_BONUS       = 0.50  // +50% Military sector returns when wars active
```

---

## Open Questions (decide at build)

- [ ] Influence unlocks: strictly serial queue, or allow N parallel timers?
- [ ] Do nodes level up (repeatable) or are they one-shot booleans? (draft assumes one-shot
      for trees, leveled for vertical Marketing)
- [ ] Should "more wars" carry a **trust cost** as the dirty-option teeth from the backlog?
- [ ] Tooltip/visual: tree layout reuse the existing tree-button modal, or a new node-graph?
- [ ] Numbers: token costs + timers need a full pass against $3k→$50k pacing.

---

## Revenue / Era Unlocks (cumulative)

| Revenue | Unlocks |
|---------|---------|
| $0.50–$25 | Phase 1 tech trees |
| $200 | Research |
| $800 | Invest + Growth Era |
| **$3,000** | **Influence tab + Influence Era** (open-ended) |
| $50,000 | Pacing milestone (NOT an ending — era continues; Phase 5 hook TBD) |

---

*Drafted from design conversation 2026-06-06. Update when Phase 4 ships or scope changes.*
