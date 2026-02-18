# DeFi Quest Engine - Option B: Full On-Chain Integration

This document explains how to use the full on-chain integration (Option B) that connects:
1. **OverseerAI** → **Anchor Program** (register missions)
2. **SwapExecutor** → **Anchor Program** (submit proof)
3. **Anchor Program** → **Supabase** (Indexer syncs events)

## Quick Start

### 1. Configure Environment Variables

Create or update your `.env.local`:

```bash
# Solana RPC
SOLANA_RPC_URL=https://api.devnet.solana.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# (Optional) Ollama for AI generation
OLLAMA_URL=http://localhost:11434

# (Optional) AI Personality: strategos, curator, oracle
AI_PERSONALITY=curator

# Authority keypair (see below)
AUTHORITY_KEYPAIR_PATH=~/.config/solana/devnet.json
```

### 2. Get Your Authority Keypair

The authority is the wallet that will sign mission registration transactions:

```bash
# Generate a new keypair (for devnet)
solana-keygen new -o ~/.config/solana/devnet.json

# Or use existing
cp ~/.config/solana/id.json ~/.config/solana/devnet.json
```

### 3. Deploy the Anchor Program

```bash
cd programs/defi_quest
anchor deploy --provider.cluster devnet
```

### 4. Run the Orchestrator Demo

```bash
cd defi-quest-engine
npx ts-node scripts/run-orchestrator.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     QuestOrchestrator                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  OverseerAI  │  │ SwapExecutor │  │     AnchorIndexer     │ │
│  │              │  │              │  │                       │ │
│  │ generates    │  │ executes     │  │ watches               │ │
│  │ mission      │  │ swap         │  │ on-chain              │ │
│  └──────┬───────┘  └──────┬───────┘  │ events                │ │
│         │                  │          └───────────┬───────────┘ │
│         ▼                  ▼                      ▼             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Anchor Program                          │   │
│  │  • register_mission()   • start_mission()              │   │
│  │  • submit_proof()       • claim_reward()               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                     emits events                               │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Supabase                              │   │
│  │  • missions table                                        │   │
│  │  • mission_progress table                               │   │
│  │  • user_stats table                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Dashboard                             │   │
│  │  • Shows REAL missions from Supabase                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## API Usage

### Create and Register a Mission

```typescript
import { createOrchestrator } from '@defi-quest/core';
import { Keypair } from '@solana/web3.js';

// Load your authority keypair
const authority = Keypair.fromSecretKey(yourSecretKey);

// Create orchestrator
const orchestrator = await createOrchestrator(authority);

// Start (initializes indexer)
await orchestrator.start();

// Create mission (auto-registers on Solana)
const { mission, signature } = await orchestrator.createMission(
  5,    // player level
  'degen'  // player style
);

console.log('Mission:', mission.name);
console.log('On-chain TX:', signature);

// Stop when done
await orchestrator.stop();
```

### Execute Swap with Proof

```typescript
import { Keypair } from '@solana/web3.js';

// User's wallet
const userWallet = Keypair.generate();

// Execute swap and submit proof
const result = await orchestrator.executeMissionSwap(
  {
    inputToken: 'SOL',
    outputToken: 'USDC',
    amount: 0.1,
    slippageBps: 50,
  },
  userWallet,
  'mission_id_123'  // mission to complete
);

console.log('Swap:', result.swap.success);
console.log('Proof:', result.proofSignature);
```

### Direct Indexer Usage

```typescript
import { createIndexer } from '@defi-quest/core';

const indexer = createIndexer();

// Start watching events
await indexer.start();

// Events are automatically synced to Supabase:
// - MissionRegisteredEvent → missions table
// - MissionStartedEvent → mission_progress table  
// - MissionCompletedEvent → mission_progress table
// - RewardClaimedEvent → user_stats table

// Later...
await indexer.stop();
```

## Tables Synced by Indexer

The indexer automatically syncs these tables:

| Event | Table | Action |
|-------|-------|--------|
| MissionRegistered | `missions` | Insert/Update |
| MissionStarted | `mission_progress` | Insert |
| MissionCompleted | `mission_progress` | Update status |
| RewardClaimed | `user_stats` | Update XP |

## Troubleshooting

### "Missing Supabase configuration"
Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

### "No IDL found"
The IDL is loaded from `target/idl/defi_quest.json`. Build the Anchor program first:
```bash
anchor build
```

### "Program not initialized"
Run the initialization:
```typescript
const isInitialized = await orchestrator.isProgramInitialized();
if (!isInitialized) {
  await orchestrator.initializeProgram();
}
```

### RPC Errors
Make sure your RPC URL is correct and has sufficient rate limits. For devnet:
```
https://api.devnet.solana.com
```

## Production Checklist

- [ ] Deploy Anchor program to mainnet
- [ ] Use mainnet RPC (Helius, Alchemy, etc.)
- [ ] Set up proper authority keypair (use HSM in production)
- [ ] Configure Supabase with RLS policies
- [ ] Add error handling and retry logic
- [ ] Set up monitoring for indexer