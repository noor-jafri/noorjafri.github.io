# Phase 2: Research Division

Phase 2 begins at **$200 lifetime revenue** — not the Phase 1 $500 checkpoint. A **Research** tab quietly unlocks (pulse animation, log message).

## Core Mechanic

Invest **token throughput** into research institutes. While researching:

1. Pick **one active topic** (four available, one at a time)
2. Set an **allocation slider** (0–50%) — that fraction of processed tokens goes to research points (RP) instead of cash
3. When RP reaches the level cost, the topic **levels up** and applies a **permanent mini-enhancement**
4. Each topic has **5 levels** with escalating RP costs

**Tradeoff:** higher allocation = faster research, less income. Tokens still count toward lifetime processed; only cash/revenue reflect the diverted portion.

## Research Topics

| Topic | Effect per level | RP costs (Lv 1→5) |
|-------|------------------|-------------------|
| **Better Solar Farms** | +0.25 regen/s per solar panel | 500 / 1.5K / 4K / 10K / 25K |
| **Better Nuclear Upgrades** | 2× power/plant per level, −15% meltdown odds, −8% op cost/plant | 800 / 2.5K / 6K / 15K / 40K |
| **Mini Model Version Updates** | +8% `valueMult` on active model | 1K / 3K / 8K / 20K / 50K |
| **Better Target Marketing** | Saturation factor 0.70 → 0.80 (+0.02/lv) | 600 / 2K / 5K / 12K / 30K |

At max level (5), solar panels gain +1.25 bonus regen each; nuclear output is **32×** base per plant (~2.8× safer, −40% upkeep); models get +40% token value; marketing repeats retain much more demand boost.

## UI

- **Sidebar:** RESEARCH button (5th tree)
- **Modal:** allocation slider + live diverted tok/s readout; 2×2 grid of research nodes with level, progress bar, ACTIVATE button
- **Terminal:** `RESEARCH: …` line when allocation is active

## Save

Save version **4**. Fields: `researchAlloc`, `activeResearch`, `researchProgress`, `researchSolar`, `researchNuclear`, `researchModel`, `researchMarketing`, `researchUnlocked`.
