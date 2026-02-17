# DeFi Quest Engine - Deployment & Demo Guide

## 🚀 Tier 1 Tech Stack
This project is built with Solana's most advanced tools for maximum performance:
- **Jupiter V6 API**: Best-in-class swap execution.
- **Metaplex Core**: High-speed, low-cost programmable NFTs.
- **Solana Mobile Wallet Adapter**: Native mobile authentication (Compliance ready).
- **Bankrun**: Sub-second testing environment.
- **AI Agent Swarm**: Automated ecosystem activity simulation.

---

## 🤖 AI Agent Swarm Demo
Generate realistic activity and test your engine with AI agents:
```powershell
cd packages/ai-engine
npx tsx scripts/demo-swarm.ts
```
*Observe Degen Dave and Conservative Carol interacting with the engine in real-time.*

---

## 🧪 High-Speed Testing (Bankrun)
Run integration tests in milliseconds without a local validator:
```powershell
# Run all program tests using Bankrun
yarn test:bankrun
```

---

## 📦 Deployment Commands

### Player Portal (Vercel)
```powershell
cd packages/player-portal
npx vercel --prod
```
*Note: Ensure `JUPITER_API_KEY` is set in Vercel environment variables for V6 API access.*

### Solana Program (Anchor)
```powershell
anchor build
anchor deploy --provider.cluster devnet
```

---

## 🎥 Recording Demo Video (90s Script)
1. **(0-15s)** Intro: "DeFi Quest Engine gamifies Solana dApps using Metaplex Core and Jupiter V6."
2. **(15-35s)** AI Swarm: "Our AI Swarm (Degen Dave/Carol) simulates realistic user behavior 100x faster."
3. **(35-55s)** Mobile: "Full Mobile Wallet Adapter support for native mobile experiences."
4. **(55-75s)** Swaps: "Jupiter Quote-to-Swap flow with real-time XP calculation."
5. **(75-90s)** Outro: "The infrastructure for the next generation of on-chain engagement."
