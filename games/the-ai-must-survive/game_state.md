# The AI Must Survive - Game State & Mechanics

## Core Resources
*   **Energy**: Capped at 50 (by default). Base regeneration is 3.0/sec. Computing a token costs 1 Energy.
*   **Tokens**: Lifetime tokens processed.
*   **Cash**: Spendable balance earned by processing tokens.
*   **Revenue**: Lifetime total cash earned.

## Market Dynamics
*   **Price**: Adjustable from $1 to $50 per 1K tokens.
*   **Demand**: Calculated as `demandBase * price^(-elasticity)`. Base demand is 200 tok/s at $1/K, and elasticity is 1.5. Higher prices exponentially reduce demand.
*   **Capacity**: The throughput you can provide, calculated from recent player clicks (over a 2.5s rolling window) plus any automated Wetware Operator rates.
*   **Efficiency**: The paid fraction per request, min(1, Demand / Capacity). If you overprice, demand drops below capacity, causing some clicks to go unpaid. 
*   **Optimal Price**: The game calculates an optimal price where Capacity meets Demand perfectly.

## Upgrades (Shop)
1.  **Solar Panel**
    *   **Effect**: +1.0 Energy regeneration per second.
    *   **Cost Scaling**: Base cost $1.00, multiplies by 1.5x per purchase.
    *   **Unlock Condition**: Reaching $1.00 lifetime revenue.
2.  **Hire Wetware Operator**
    *   **Effect**: Automates compute clicks. Adds ~2 clicks/sec per unit.
    *   **Cost Scaling**: Base cost $2.00, multiplies by 1.6x per purchase.
    *   **Unlock Condition**: Reaching $3.00 lifetime revenue.

## Progression Milestones
*   **$0.50 Revenue**: Request queue announced.
*   **$1.00 Revenue**: Solar panels unlock, shop UI appears.
*   **$3.00 Revenue**: Wetware operator (hiring) unlocks.
*   **$8.00 Revenue**: Marketing tree unlocks.
*   **First Hire**: Special log message triggers.
*   **Efficiency Hint**: A hint about lowering the price is shown if capacity > 0.5 and efficiency drops below 60%.

## Humanity Trust
*   **Starting value**: 100%.
*   **Drains from**: Natural Bio emissions (-0.5%/s per plant), Nuclear explosions (-25% each, 1% chance/min per plant).
*   **Game over**: Trust reaches 0%.
*   **Recovery**: Public Trust marketing branch (see below).

## Marketing Tree
Unlocks at **$8.00 lifetime revenue**. Two independent branches:

### Demand Branch (left)
Increases `demandBase` — more market demand at every price point.
1.  **ShitedIn** — +50 demand. Entry node ($5 base, 1.8× scaling).
2.  **FikFok** — +150 demand. Requires ShitedIn ($20 base).
3.  **Egogram** — +300 demand. Requires FikFok ($50 base).
4.  **iTube** — +800 demand. Requires Egogram ($120 base).

### Public Trust Branch (right)
One-time trust boosts per purchase (capped at 100%).
1.  **Support NGOs** — +3% trust. Entry node ($8 base, 1.8× scaling).
2.  **Billionaires for Good** — +5% trust. Requires NGOs ($25 base).
3.  **WHO Partnership** — +8% trust. Requires Billionaires ($60 base).
4.  **Green Movement** — +12% trust. Requires WHO ($150 base).

## Save Data Structure
The game state exports a JSON format containing:
*   `playTime`: Total play time across sessions.
*   `economy`: Cash, lifetime revenue, tokens processed, price set, and pay per compute.
*   `energy`: Current energy, max energy, regen rate.
*   `market`: Demand, capacity, player/wetware throughput, efficiency, and optimal price.
*   `unlocks`: Status of the request queue, shop panel, solar panel, and wetware operator (including progress to unlock).
*   `upgrades`: Quantities of solar panels, wetware operators, demand marketing, and public trust marketing owned.
