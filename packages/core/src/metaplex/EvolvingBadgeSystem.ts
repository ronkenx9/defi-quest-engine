import { create, fetchAsset, updatePlugin, burn } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey, Umi, PublicKey as UmiPublicKey, keypairIdentity, generateSigner } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";

import { createAuthorizedUmi } from "./createAuthorityFromEnv";
import { getBadgeImage } from "./nftArt";

export class EvolvingBadgeSystem {
    private umi: Umi;
    private hasAuthority: boolean;

    constructor(rpcUrl: string) {
        const { umi, hasAuthority } = createAuthorizedUmi(rpcUrl);
        this.umi = umi;
        this.hasAuthority = hasAuthority;
    }

    // New: Forge a superior badge by burning ingredients
    async forgeEvolvedBadge(
        ownerWallet: PublicKey | string,
        ingredients: { mintAddress?: string, name: string }[],
        resultType: string
    ): Promise<UmiPublicKey> {
        if (!this.hasAuthority) {
            console.warn('[Forge] No authority keypair found. Minting will likely fail.');
        }

        // 1. Burn the ingredients if they have mint addresses
        for (const ingredient of ingredients) {
            if (ingredient.mintAddress && ingredient.mintAddress !== 'mock-mint-address') {
                try {
                    console.log(`[Forge] Burning ingredient: ${ingredient.mintAddress}`);
                    const assetToBurn = await fetchAsset(this.umi, publicKey(ingredient.mintAddress));
                    await burn(this.umi, {
                        asset: assetToBurn,
                    }).sendAndConfirm(this.umi);
                } catch (e) {
                    console.error(`[Forge] Failed to burn ingredient ${ingredient.mintAddress}:`, e);
                }
            }
        }

        // 2. Mint the new evolved badge
        const asset = generateSigner(this.umi);
        const ownerPubkey = typeof ownerWallet === 'string' ? publicKey(ownerWallet) : publicKey(ownerWallet.toString());

        // Define evolved metadata
        const metadata = {
            name: resultType,
            symbol: "EVO",
            description: `A powerful stabilized entity forged from soul fragments.`,
            image: `https://defi-quest.vercel.app/badges/${resultType.toLowerCase().replace(/ /g, '-')}.png`,
            attributes: [
                { trait_type: "State", value: "Evolved" },
                { trait_type: "Rarity", value: "Epic" }, // Success forges are Epic
                { trait_type: "Origin", value: "The Forge" }
            ]
        };

        const dynamicUri = `data:application/json;utf8,${encodeURIComponent(JSON.stringify(metadata))}`;

        await create(this.umi, {
            asset,
            name: resultType,
            uri: dynamicUri,
            owner: ownerPubkey,
            plugins: [
                {
                    type: "Attributes",
                    attributeList: [
                        { key: "forge_level", value: "2" },
                        { key: "rarity", value: "epic" },
                        { key: "stabilized_at", value: Date.now().toString() }
                    ]
                }
            ]
        }).sendAndConfirm(this.umi);

        console.log(`[Forge] Successfully minted evolved badge: ${asset.publicKey.toString()}`);
        return asset.publicKey;
    }

    // Mint badge with initial stats
    async mintBadge(
        ownerWallet: PublicKey | string,
        badgeType: string,
        missionCompleted: string
    ): Promise<UmiPublicKey> {
        // ... rest of the file
        const asset = generateSigner(this.umi);
        const ownerPubkey = typeof ownerWallet === 'string' ? publicKey(ownerWallet) : publicKey(ownerWallet.toString());

        // Load metadata from manifest safely
        let badgeMeta = {
            name: `${badgeType} Badge`,
            symbol: "QUEST",
            description: `DeFi Quest Engine Achievement Badge: ${badgeType}`,
            image: getBadgeImage(badgeType),
            properties: { category: "image" }
        };

        try {
            // Attempt to load the manifest from the admin dashboard (monorepo friendly path)
            const manifest = require("../../../../admin-dashboard/public/nft-metadata/manifest.json");
            if (manifest && manifest.badges && manifest.badges[badgeType]) {
                const data = manifest.badges[badgeType];
                badgeMeta = {
                    name: data.name,
                    symbol: data.symbol || "QUEST",
                    description: data.description,
                    image: `https://defi-quest.vercel.app${data.image}`, // Use full public URL
                    properties: { category: "image", ...data.properties }
                };
            }
        } catch (e) {
            console.warn(`Could not load manifest for badge ${badgeType}`, e);
        }

        const offchainMetadata = {
            ...badgeMeta,
            properties: {
                ...badgeMeta.properties,
                creators: [{ address: this.umi.identity.publicKey.toString(), share: 100 }]
            }
        };
        const dynamicUri = `data:application/json;utf8,${encodeURIComponent(JSON.stringify(offchainMetadata))}`;

        await create(this.umi, {
            asset,
            name: `${badgeType} Badge`,
            uri: dynamicUri,
            owner: ownerPubkey,
            plugins: [
                {
                    type: "Attributes",
                    attributeList: [
                        { key: "badge_level", value: "1" },
                        { key: "badge_xp", value: "100" },
                        { key: "rarity", value: "common" },
                        { key: "missions_with_badge", value: "1" },
                        { key: "first_earned", value: Date.now().toString() },
                        { key: "last_upgraded", value: Date.now().toString() }
                    ]
                },
                {
                    type: "FreezeDelegate",
                    frozen: false
                },
                {
                    type: "Royalties",
                    basisPoints: 0,
                    creators: [{ address: this.umi.identity.publicKey, percentage: 100 }],
                    ruleSet: { type: "None" }
                }
            ]
        }).sendAndConfirm(this.umi);

        return asset.publicKey;
    }

    // Level up badge when player completes another mission
    async upgradeBadge(badgeAddress: PublicKey | string, xpGained: number) {
        const assetPubkey = typeof badgeAddress === 'string' ? publicKey(badgeAddress) : publicKey(badgeAddress.toString());
        const asset = await fetchAsset(this.umi, assetPubkey);

        let currentAttributes: { key: string, value: string }[] = [];
        if ('plugins' in asset) {
            const attrsPlugin = (asset as any).plugins?.find((p: any) => p.type === 'Attributes');
            if (attrsPlugin && 'attributeList' in attrsPlugin) {
                currentAttributes = attrsPlugin.attributeList as any;
            }
        }

        const currentXP = parseInt(currentAttributes.find(a => a.key === "badge_xp")?.value || "0");
        const currentLevel = parseInt(currentAttributes.find(a => a.key === "badge_level")?.value || "1");
        const missions = parseInt(currentAttributes.find(a => a.key === "missions_with_badge")?.value || "0");

        const newXP = currentXP + xpGained;
        const newLevel = Math.floor(newXP / 500) + 1;
        const newRarity = this.calculateRarity(newLevel);

        await updatePlugin(this.umi, {
            asset: assetPubkey,
            plugin: {
                type: "Attributes",
                attributeList: [
                    ...currentAttributes.filter(a => !['badge_level', 'badge_xp', 'rarity', 'missions_with_badge', 'last_upgraded'].includes(a.key)),
                    { key: "badge_level", value: newLevel.toString() },
                    { key: "badge_xp", value: newXP.toString() },
                    { key: "rarity", value: newRarity },
                    { key: "missions_with_badge", value: (missions + 1).toString() },
                    { key: "last_upgraded", value: Date.now().toString() }
                ]
            }
        }).sendAndConfirm(this.umi);

        return { newLevel, newXP, newRarity };
    }

    calculateRarity(level: number): string {
        if (level >= 10) return "legendary";
        if (level >= 7) return "epic";
        if (level >= 4) return "rare";
        return "common";
    }
}
