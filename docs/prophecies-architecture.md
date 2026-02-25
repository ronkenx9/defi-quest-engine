# Prophecies Architecture

This document outlines the architectural flow of the Prophecies staking system in the DeFi Quest Engine.

## Staking Flow Sequence

When a user operator interacts with a prophecy and clicks the **STAKE** button:

### 1. Unified Interface Interface
The frontend UI (Matrix/Glitch aesthetic) captures the user's wallet signature, the specific Prophecy ID, the chosen outcome, and the XP amount.

### 2. Guard Validation (API Layer)
The request is sent to the `/api/prophecy/stake` endpoint:
- **Case-Insensitive Identity Check**: The system uses `ilike` to look up the user's wallet address in the `user_stats` table, handling any casing variations from different wallet providers.
- **Verification**: The engine confirms the user has sufficient **Total XP** to cover the stake.

### 3. Atomic Database Operations
If validation passes, the system performs an atomic set of updates:
- **XP Deduction**: The staked amount is deducted from the user's `total_points` in the `user_stats` table.
- **Ledger Record**: A new entry is inserted into the `prophecy_entries` table, linking the user's wallet to the specific prophecy and outcome.
- **Audit Trail**: The action is logged in the `activity_log` for tracking and transparency.

### 4. Visual Feedback
Upon successful database confirmation, the API returns the updated XP balance. The UI then refreshes to show the user's entry as "Linked" and provides immediate visual confirmation in the terminal console.

## Resolution & Payout
A separate resolution process monitors the source of truth (e.g., Polymarket or The Oracle). Once the event concludes:
- Winners are identified.
- Multiplied XP is calculated based on stake and odds.
- Rewards are distributed back to the victors' `user_stats`.
