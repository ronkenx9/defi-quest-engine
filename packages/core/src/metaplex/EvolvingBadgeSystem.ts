import { create, fetchAsset, updatePlugin } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey, Umi, PublicKey as UmiPublicKey, keypairIdentity, generateSigner } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";

export class EvolvingBadgeSystem {
    private umi: Umi;

    constructor(rpcUrl: string) {
        this.umi = createUmi(rpcUrl);
        const signer = generateSigner(this.umi);
        this.umi.use(keypairIdentity(signer));
    }

    // Mint badge with initial stats
    async mintBadge(
        ownerWallet: PublicKey | string,
        badgeType: string,
        missionCompleted: string
    ): Promise<UmiPublicKey> {
        const asset = generateSigner(this.umi);
        const ownerPubkey = typeof ownerWallet === 'string' ? publicKey(ownerWallet) : publicKey(ownerWallet.toString());

        await create(this.umi, {
            asset,
            name: `${badgeType} Badge`,
            uri: `https://defi-quest.com/badges/${badgeType.toLowerCase().replace(/\s+/g, '-')}.json`, // Production: dynamic URI
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
