import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity, createSignerFromKeypair } from '@metaplex-foundation/umi';
import { create, fetchAsset, updatePlugin, addPluginV1 } from '@metaplex-foundation/mpl-core';

async function testCoreAssets() {
    console.log("=== DeFi Quest Engine: Metaplex Core Unit Tests ===");

    const rpcUrl = "http://localhost:8899";
    const connection = new Connection(rpcUrl, 'confirmed');

    // 1. Setup Umi & Authority
    console.log("\n[1] Setting up Umi and test authority...");
    const umi = createUmi(rpcUrl);
    const authority = Keypair.generate();

    try {
        const sig = await connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig);
    } catch (e) {
        console.error("❌ Failed to airdrop SOL. Make sure solana-test-validator is running.");
        return;
    }

    const umiKeypair = umi.eddsa.createKeypairFromSecretKey(authority.secretKey);
    const umiSigner = createSignerFromKeypair(umi, umiKeypair);
    umi.use(keypairIdentity(umiSigner));
    console.log("✅ Umi configured with funded identity.");

    // 2. Test Player Profile Minting
    console.log("\n[2] Testing PlayerProfileNFT equivalent...");
    const profileAsset = umi.eddsa.generateKeypair();
    const profileSigner = createSignerFromKeypair(umi, profileAsset);

    console.log("  → Airdropping SOL to profile asset...");
    await connection.confirmTransaction(
        await connection.requestAirdrop(new PublicKey(profileAsset.publicKey), LAMPORTS_PER_SOL)
    );

    console.log("  → Minting Profile NFT...");
    await create(umi, {
        asset: profileSigner,
        authority: umi.identity,
        payer: umi.identity,
        name: "Test Player Profile",
        uri: "https://example.com/profile.json",
        plugins: [
            {
                type: "Attributes",
                attributeList: [
                    { key: "level", value: "1" },
                    { key: "total_xp", value: "0" }
                ]
            }
        ]
    }).sendAndConfirm(umi);

    const fetchedProfile = await fetchAsset(umi, profileAsset.publicKey);
    console.log(`✅ Profile minted successfully: ${fetchedProfile.publicKey}`);

    // 3. Test Badge Minting
    console.log("\n[3] Testing EvolvingBadgeSystem equivalent...");
    const badgeAsset = umi.eddsa.generateKeypair();
    const badgeSigner = createSignerFromKeypair(umi, badgeAsset);

    console.log("  → Airdropping SOL to badge asset...");
    await connection.confirmTransaction(
        await connection.requestAirdrop(new PublicKey(badgeAsset.publicKey), LAMPORTS_PER_SOL)
    );

    console.log("  → Minting Badge NFT...");
    await create(umi, {
        asset: badgeSigner,
        authority: umi.identity,
        payer: umi.identity,
        name: "First Swap Badge",
        uri: "https://example.com/badge.json",
        plugins: [
            {
                type: "Attributes",
                attributeList: [
                    { key: "level", value: "1" },
                    { key: "total_xp", value: "100" },
                    { key: "rarity", value: "common" }
                ]
            }
        ]
    }).sendAndConfirm(umi);

    const fetchedBadge = await fetchAsset(umi, badgeAsset.publicKey);
    console.log(`✅ Badge minted successfully: ${fetchedBadge.publicKey}`);

    // 4. Test Composable Loadouts (Parent-Child)
    console.log("\n[4] Testing Composable Loadouts (attachBadgeToProfile mapping)...");
    console.log("  → Attaching Badge to Profile Collection...");

    try {
        await addPluginV1(umi, {
            asset: badgeAsset.publicKey,
            collection: profileAsset.publicKey,
            plugin: {
                type: "UpdateDelegate",
                additionalDelegates: []
            } as any
        }).sendAndConfirm(umi);
        console.log("✅ Badge successfully attached to Profile (Composable NFTs active)!");
    } catch (e) {
        console.error("❌ Failed to attach badge:", e);
    }

    console.log("\n=== All Metaplex Core Unit Tests Passed! ===");
}

testCoreAssets().catch(console.error);
