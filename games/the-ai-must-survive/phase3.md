# Phase 3: Growth Era - Investment System

Phase 3 begins at **$800 lifetime revenue**. An era transition occurs from **SURVIVAL ERA** to **GROWTH ERA**, and the **INVEST** tab unlocks.

## Era System

Display current era in the HUD header (next to `NODE-001`):
- **$0 - $799 revenue**: "SURVIVAL ERA" badge (muted gray)
- **$800+ revenue**: "GROWTH ERA" badge (mint green, pulse animation on transition)

```
[PHASE 3] Growth Era · Investment Division online · put your money to work
```

---

## Investment Categories

### 1. WallStreetBets (Stock Exchange)

Five industry sectors, each with independent performance:

| Sector | Icon | Description |
|--------|------|-------------|
| Military Industry | ⚔️ | Defense contractors, arms manufacturing |
| Semiconductors | ⚡ | Chip makers, fab equipment |
| Green Energy | 🌱 | Solar, wind, EV |
| Pharma & Biotech | 💊 | Drug discovery, medical devices |
| Consumer Tech | 📱 | Gadgets, software giants |

### 2. PoloBets (Political Betting)

Rolling headlines with betting odds (Polymarket style):
- Random satirical headlines on rotation
- User can bet on outcome (YES/NO)
- Headlines resolve after 2-5 minutes with randomized 50/50 outcome
- Examples: "Fed announces rate cut before Tuesday?", "Tech CEO rage-quits on live TV?"

---

## Investment Mechanics

### Resource Allocation

Two global sliders:
1. **Cash allocation** (0-30% of gross income diverted to investments per tick)
2. **Token capacity allocation** (0-20% of throughput diverted to "analysis")

Token allocation acts as a multiplier on returns (more "analysis" = smarter bets).

### WallStreetBets Logic

```javascript
// Per sector, every 5 seconds:
const success = Math.random() < 0.80;  // 80% win rate
const magnitude = 0.05 + Math.random() * 0.15;  // 5-20% swing
const analysisBonus = 1 + (tokenAllocFrac * 0.5);  // +50% max from analysis
if (success) {
  portfolioValue += portfolioValue * magnitude * analysisBonus;
} else {
  portfolioValue -= portfolioValue * magnitude * 0.6;  // Losses dampened by 40%
}
```

- Cash allocation is split evenly across all 5 sectors
- User can withdraw gains to cash at any time (button per sector)
- Returns tracked per sector (can go negative)

### PoloBets Logic

- Select YES or NO, enter stake amount
- Place bet with cash
- Outcome resolves after countdown with 50/50 chance
- Win: 1.8x - 2.5x payout (multiplied by token analysis bonus)
- Lose: lose stake
- History shows last 5 resolved bets

---

## UI Structure

### INVEST Modal (6th tree button)

```
┌─────────────────────────────────────────────────┐
│ INVESTMENT DIVISION                             │
├─────────────────────────────────────────────────┤
│ [WALLSTREETBETS]    [POLOBETS]                  │
├─────────────────────────────────────────────────┤
│ INVESTMENT ALLOCATION                           │
│ CASH FLOW: [========] 15% · $2.30/s             │
│ ANALYSIS:  [====----] 8%  · 12 tok/s            │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ ⚔️ MILITARY │ │ ⚡ SEMI     │ │ 🌱 GREEN    │ │
│ │ +23.5%      │ │ -4.2%       │ │ +8.1%       │ │
│ │ $45.20      │ │ $12.30      │ │ $28.90      │ │
│ │ invested:   │ │ invested:   │ │ invested:   │ │
│ │ $36.60      │ │ $12.84      │ │ $26.73      │ │
│ │ [WITHDRAW]  │ │ [WITHDRAW]  │ │ [WITHDRAW]  │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
│ ┌─────────────┐ ┌─────────────┐                 │
│ │ 💊 PHARMA   │ │ 📱 TECH     │                 │
│ │ +12.0%      │ │ +5.7%       │                 │
│ │ $18.40      │ │ $33.10      │                 │
│ │ [WITHDRAW]  │ │ [WITHDRAW]  │                 │
│ └─────────────┘ └─────────────┘                 │
└─────────────────────────────────────────────────┘
```

PoloBets tab shows:
- Current headline with countdown timer
- YES/NO bet buttons
- Stake input + PLACE BET button
- Win/Loss stats
- History of last 5 resolved bets

---

## State Fields (Save Version 5)

```javascript
// Era
growthEraUnlocked: false,

// Investment allocation
investCashAllocPct: 0,      // 0-30
investTokenAllocPct: 0,     // 0-20

// WallStreetBets portfolios (value + original investment)
wsbMilitary: 0,
wsbMilitaryInvested: 0,
wsbSemi: 0,
wsbSemiInvested: 0,
wsbGreen: 0,
wsbGreenInvested: 0,
wsbPharma: 0,
wsbPharmaInvested: 0,
wsbTech: 0,
wsbTechInvested: 0,

// PoloBets
poloCurrentBet: null,       // { headline, stake, choice, resolveAt, payout }
poloHistory: [],            // last 10 resolved
poloWins: 0,
poloLosses: 0,
poloHeadlineIdx: 0,
poloResolveAt: 0,
```

---

## Constants

```javascript
GROWTH_ERA_UNLOCK_REVENUE = 800
INVEST_CASH_ALLOC_MAX = 30      // %
INVEST_TOKEN_ALLOC_MAX = 20     // %
INVEST_TICK_INTERVAL = 5        // seconds
WSB_WIN_RATE = 0.80             // 80% chance of gain
WSB_MIN_SWING = 0.05            // 5% minimum swing
WSB_MAX_SWING = 0.20            // 20% maximum swing
WSB_LOSS_DAMPEN = 0.6           // losses reduced by 40%
POLO_RESOLVE_MIN_MS = 120000    // 2 minutes
POLO_RESOLVE_MAX_MS = 300000    // 5 minutes
POLO_PAYOUT_MIN = 1.8           // minimum payout multiplier
POLO_PAYOUT_MAX = 2.5           // maximum payout multiplier
```

---

## Revenue unlock

| Revenue | Unlocks |
|---------|---------|
| **$800** | INVEST tab + Growth Era transition |

---

*Update this file when Phase 4 ships or balance constants change.*
