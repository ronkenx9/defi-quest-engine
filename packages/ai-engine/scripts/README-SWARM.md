# AI Agent Swarm - Quick Start

## Prerequisites

1. **Start local Solana validator** (in a new terminal):
```bash
solana-test-validator --reset
```

2. **Configure localnet**:
```bash
solana config set --url localhost
```

3. **Fund your wallet** (optional):
```bash
solana airdrop 100
```

## Run the Swarm

```bash
cd packages/ai-engine
npx tsx scripts/demo-swarm.ts
```

## What the Swarm Does

1. **Creates 4 AI Agents**: Degen Dave, Conservative Carol, Whale William, Active Alice
2. **Each agent**: Gets airdropped 2 SOL, makes real swaps via Jupiter, earns XP
3. **Statistics tracked**: Swaps, success rate, volume, XP earned

## For Hackathon Demo

Run for 30-60 minutes before demo to generate 500+ on-chain transactions.

## Troubleshooting

- Cannot connect: Make sure solana-test-validator is running
- Airdrop failed: Run validator with --reset first
- No quote: Normal for some pairs, agents skip and retry
