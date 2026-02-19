import { create, fetchAsset, updatePlugin, addPluginV1 } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { generateSigner, publicKey, Umi, PublicKey as UmiPublicKey, keypairIdentity } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";

export class PlayerProfileNFT {
    private umi: Umi;

    constructor(rpcUrl: string) {
        this.umi = createUmi(rpcUrl);
        // Attach a generated identity so Umi can pay for transactions by default
        const signer = generateSigner(this.umi);
        this.umi.use(keypairIdentity(signer));
    }

    // Mint player profile when user first connects
    async mintProfile(playerWallet: PublicKey | string, username: string): Promise<UmiPublicKey> {
        const asset = generateSigner(this.umi);
        const ownerPubkey = typeof playerWallet === 'string' ? publicKey(playerWallet) : publicKey(playerWallet.toString());

        await create(this.umi, {
            asset,
            name: `Player: ${username}`,
            uri: "https://defi-quest.com/profiles/metadata.json", // In production, this would be actual metadata
            owner: ownerPubkey,
            plugins: [
                {
                    type: "Attributes",
                    attributeList: [
                        { key: "level", value: "1" },
                        { key: "total_xp", value: "0" },
                        { key: "missions_completed", value: "0" },
                        { key: "rank", value: "Novice" },
                        { key: "created_at", value: Date.now().toString() }
                    ]
                }
            ]
        }).sendAndConfirm(this.umi);

        return asset.publicKey;
    }

    // Update profile after mission completion
    async updateStats(profileAddress: PublicKey | string, xpGained: number) {
        const assetPubkey = typeof profileAddress === 'string' ? publicKey(profileAddress) : publicKey(profileAddress.toString());
        const asset = await fetchAsset(this.umi, assetPubkey);

        // Safely extract attributes plugin data
        let currentAttributes: { key: string, value: string }[] = [];
        if ('plugins' in asset) {
            const attrsPlugin = (asset as any).plugins?.find((p: any) => p.type === 'Attributes');
            if (attrsPlugin && 'attributeList' in attrsPlugin) {
                currentAttributes = attrsPlugin.attributeList as any;
            }
        }

        const currentXP = parseInt(currentAttributes.find(a => a.key === "total_xp")?.value || "0");
        const missions = parseInt(currentAttributes.find(a => a.key === "missions_completed")?.value || "0");

        const newXP = currentXP + xpGained;
        const newLevel = Math.floor(newXP / 1000) + 1;
        const newRank = this.calculateRank(newLevel);

        await updatePlugin(this.umi, {
            asset: assetPubkey,
            plugin: {
                type: "Attributes",
                attributeList: [
                    ...currentAttributes.filter(a => !['level', 'total_xp', 'missions_completed', 'rank'].includes(a.key)),
                    { key: "level", value: newLevel.toString() },
                    { key: "total_xp", value: newXP.toString() },
                    { key: "missions_completed", value: (missions + 1).toString() },
                    { key: "rank", value: newRank }
                ]
            }
        }).sendAndConfirm(this.umi);

        return { newLevel, newXP, newRank };
    }

    // Attach a badge to a profile as a child NFT
    async attachBadgeToProfile(
        profileAddress: PublicKey | string,
        badgeAddress: PublicKey | string
    ) {
        const profilePubkey = typeof profileAddress === 'string' ? publicKey(profileAddress) : publicKey(profileAddress.toString());
        const badgePubkey = typeof badgeAddress === 'string' ? publicKey(badgeAddress) : publicKey(badgeAddress.toString());

        await addPluginV1(this.umi, {
            asset: badgePubkey,
            collection: profilePubkey,
            plugin: {
                type: "UpdateDelegate",
                additionalDelegates: []
            } as any
        }).sendAndConfirm(this.umi);

        console.log("Badge attached to profile as child NFT");
    }

    private calculateRank(level: number): string {
        if (level >= 50) return "Legendary";
        if (level >= 25) return "Master";
        if (level >= 10) return "Expert";
        if (level >= 5) return "Adept";
        return "Novice";
    }
}
