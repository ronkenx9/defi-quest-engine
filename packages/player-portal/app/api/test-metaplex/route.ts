import { NextResponse } from 'next/server';
import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMetaplexAnchorIntegrator } from '@defi-quest/core';

export async function GET() {
    try {
        console.log("=== DeFi Quest Engine: Metaplex Core Integration Test ===");
        const rpcUrl = "http://localhost:8899";
        const connection = new Connection(rpcUrl, 'confirmed');

        const logs: string[] = [];
        const log = (msg: string) => { console.log(msg); logs.push(msg); };

        log("\n[1] Setting up mock user...");
        const userWallet = Keypair.generate();

        try {
            const signature = await connection.requestAirdrop(userWallet.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction({
                signature,
                ...(await connection.getLatestBlockhash())
            });
            log(`✅ Airdropped 2 SOL to test user: ${userWallet.publicKey.toString()}`);
        } catch (e) {
            log(`❌ Failed to airdrop: ${e}`);
            return NextResponse.json({ success: false, logs, error: "Is solana-test-validator running?" }, { status: 500 });
        }

        log("\n[2] Initializing Metaplex Anchor Integrator...");
        const integrator = createMetaplexAnchorIntegrator({
            rpcEndpoint: rpcUrl,
            programId: "CQdZXfVD8cNn2kRB9YAacrhrGb8ZvgPrxwapu2rdfdtp",
            authorityKey: ""
        });

        // HACK FOR LOCAL TESTING: 
        // The default Umi instances in the classes generate a random zero-balance signer. 
        // We need to overwrite them with the funded userWallet so they can pay for transactions.
        const { createSignerFromKeypair, keypairIdentity } = require('@metaplex-foundation/umi');

        const umiSecretKey = userWallet.secretKey;
        const setUmiSigner = (umiInstance: any) => {
            const umiKeypair = umiInstance.eddsa.createKeypairFromSecretKey(umiSecretKey);
            const umiSigner = createSignerFromKeypair(umiInstance, umiKeypair);
            umiInstance.use(keypairIdentity(umiSigner));
        };

        setUmiSigner((integrator as any).playerProfile.umi);
        setUmiSigner((integrator as any).badgeSystem.umi);

        log("✅ Integrator initialized and funded for testing.");

        log(`\n[3] Simulating First Reward Claim for User: ${userWallet.publicKey.toString()}`);
        log("  → Simulating 500 XP gain from 'First Swap' mission");

        const event1 = {
            user: userWallet.publicKey.toString(),
            mission: Keypair.generate().publicKey.toString(),
            xp: 500,
            badgeType: 'Swap Novice'
        };

        let result1;
        try {
            result1 = await integrator.onRewardClaimed(event1, null);
            log("✅ First Event Handled Successfully!");
            log(`  👤 Profile Updated (Minted): ${result1.profileUpdated}`);
            log(`  🏅 Badge Minted: ${result1.badgeMinted}`);
        } catch (e) {
            log(`❌ First Event Failed: ${e}`);
            return NextResponse.json({ success: false, logs, error: String(e) }, { status: 500 });
        }

        log(`\n[4] Simulating Second Reward Claim (Evolution)`);
        log("  → Simulating 600 XP gain from 'Volume King' mission");

        const event2 = {
            user: userWallet.publicKey.toString(),
            mission: Keypair.generate().publicKey.toString(),
            xp: 600,
            badgeType: 'Swap Novice'
        };

        let result2;
        try {
            result2 = await integrator.onRewardClaimed(event2, null);
            log("✅ Second Event Handled Successfully!");
            log(`  👤 Profile Updated: ${result2.profileUpdated}`);
            log(`  📈 Badge Upgraded: ${result2.badgeUpgraded}`);
        } catch (e) {
            log(`❌ Second Event Failed: ${e}`);
            return NextResponse.json({ success: false, logs, error: String(e) }, { status: 500 });
        }

        log("\n=== Test Completed Successfully! ===");
        return NextResponse.json({ success: true, logs, result1, result2 });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
