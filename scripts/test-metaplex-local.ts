import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMetaplexAnchorIntegrator, PlayerProfileNFT, EvolvingBadgeSystem } from '@defi-quest/core';
import fs from 'fs';
import os from 'os';

async function main() {
    console.log("=== DeFi Quest Engine: Metaplex Core Integration Test ===");
    const rpcUrl = "http://localhost:8899";
    const connection = new Connection(rpcUrl, 'confirmed');

    // 1. Setup Mock User
    console.log("\n[1] Setting up mock user...");
    const userWallet = Keypair.generate();

    try {
        const signature = await connection.requestAirdrop(userWallet.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(signature);
        console.log(`✅ Airdropped 2 SOL to test user: ${userWallet.publicKey.toString()}`);
    } catch (e) {
        console.error("❌ Failed to airdrop. Is solana-test-validator running?");
        return;
    }

    // 2. Initialize Integrator
    console.log("\n[2] Initializing Metaplex Anchor Integrator...");
    const integrator = createMetaplexAnchorIntegrator({
        rpcEndpoint: rpcUrl,
        programId: "CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp", // Mock ID
        authorityKey: "" // Not needed for current logic
    });
    console.log("✅ Integrator initialized.");

    // 3. Simulate Event 1: First Reward Claim (Mints Profile & Badge)
    console.log(`\n[3] Simulating First Reward Claim for User: ${userWallet.publicKey.toString()}`);
    console.log("  → Simulating 500 XP gain from 'First Swap' mission");

    const event1 = {
        user: userWallet.publicKey.toString(),
        mission: Keypair.generate().publicKey.toString(), // Mock mission ID
        xp: 500,
        badgeType: 'Swap Novice'
    };

    try {
        const result1 = await integrator.onRewardClaimed(event1, null);
        console.log("✅ First Event Handled Successfully!");
        console.log(`  👤 Profile Updated (Minted): ${result1.profileUpdated}`);
        console.log(`  🏅 Badge Minted: ${result1.badgeMinted}`);
    } catch (e) {
        console.error("❌ First Event Failed:", e);
        return;
    }

    // 4. Simulate Event 2: Second Reward Claim (Updates Profile & Evolves Badge)
    console.log(`\n[4] Simulating Second Reward Claim (Evolution)`);
    console.log("  → Simulating 600 XP gain from 'Volume King' mission");

    const event2 = {
        user: userWallet.publicKey.toString(),
        mission: Keypair.generate().publicKey.toString(),
        xp: 600, // Total XP will now be 1100, which should trigger a level up/rarity change
        badgeType: 'Swap Novice' // Ensure it targets the same badge type
    };

    try {
        const result2 = await integrator.onRewardClaimed(event2, null);
        console.log("✅ Second Event Handled Successfully!");
        console.log(`  👤 Profile Updated: ${result2.profileUpdated}`);
        console.log(`  📈 Badge Upgraded: ${result2.badgeUpgraded}`);
    } catch (e) {
        console.error("❌ Second Event Failed:", e);
        return;
    }

    console.log("\n=== Test Completed Successfully! ===");
}

main().catch(console.error);
