/**
 * DeFi Quest Engine - Badge Forge
 * 
 * Burn 3 badges to roll for a higher rarity badge!
 * 
 * Roll tables:
 * - 3 common -> 70% rare, 30% stay common (fail)
 * - 3 rare -> 50% epic, 50% stay rare (fail)
 * - 3 epic -> 30% legendary, 70% stay epic (fail)
 * - On failure: Get 'Ashes of Hubris' badge
 * - On success: New badge with combined XP + multiplier
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { burnV1, fetchAsset } from '@metaplex-foundation/mpl-core';
import { generateSigner, publicKey } from '@metaplex-foundation/umi';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ForgeResult = 'success' | 'failure';

// Roll probabilities (percentage needed to succeed)
export const FORGE_RULES = {
    common: {
        target: 'rare',
        successRate: 70,
        xpMultiplier: 2,
    },
    rare: {
        target: 'epic',
        successRate: 50,
        xpMultiplier: 2.5,
    },
    epic: {
        target: 'legendary',
        successRate: 30,
        xpMultiplier: 3,
    },
};

export interface ForgeInput {
    badge1: string;
    badge2: string;
    badge3: string;
}

export interface ForgeResultData {
    success: boolean;
    result: ForgeResult;
    inputRarity: BadgeRarity;
    outputRarity: BadgeRarity;
    newBadgeAddress?: string;
    ashesBadgeAddress?: string;
    combinedXP: number;
    xpBonus: number;
    roll: number;
}

export class BadgeForge {
    private umi: any;
    private connection: Connection;
    private rpcEndpoint: string;

    constructor(rpcEndpoint: string) {
        this.rpcEndpoint = rpcEndpoint;
        this.connection = new Connection(rpcEndpoint);
        this.umi = createUmi(rpcEndpoint);
    }

    /**
     * Get rarity from badge metadata
     */
    private async getBadgeRarity(badgeAddress: string): Promise<BadgeRarity> {
        try {
            const asset = await fetchAsset(this.umi, publicKey(badgeAddress));
            const assetData = asset as any;
            const attrs = assetData?.attributes?.attributeList || [];

            const rarityAttr = attrs.find((a: any) => a.key === 'rarity');
            return (rarityAttr?.value as BadgeRarity) || 'common';
        } catch (error) {
            console.error('[BadgeForge] Error fetching badge:', error);
            return 'common';
        }
    }

    /**
     * Get badge XP
     */
    private async getBadgeXP(badgeAddress: string): Promise<number> {
        try {
            const asset = await fetchAsset(this.umi, publicKey(badgeAddress));
            const assetData = asset as any;
            const attrs = assetData?.attributes?.attributeList || [];

            const xpAttr = attrs.find((a: any) => a.key === 'badge_xp' || a.key === 'XP');
            return parseInt(xpAttr?.value) || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Roll for new badge (simulated - would use VRF in production)
     */
    private async rollForUpgrade(rarity: BadgeRarity): Promise<{ success: boolean; roll: number }> {
        const rule = FORGE_RULES[rarity];
        const roll = Math.floor(Math.random() * 100);

        return {
            success: roll < rule.successRate,
            roll,
        };
    }

    /**
     * Execute the forge
     * Burns 3 badges and rolls for a new one
     */
    async forge(
        input: ForgeInput,
        playerWallet: string,
        authoritySigner: any
    ): Promise<ForgeResultData> {
        const badges = [input.badge1, input.badge2, input.badge3];

        // Get rarities and XP from all badges
        const rarities: BadgeRarity[] = [];
        let totalXP = 0;

        for (const badge of badges) {
            const rarity = await this.getBadgeRarity(badge);
            rarities.push(rarity);
            totalXP += await this.getBadgeXP(badge);
        }

        // Determine input rarity (all must be same)
        const inputRarity = rarities[0];
        const allSame = rarities.every(r => r === inputRarity);

        if (!allSame) {
            throw new Error('All 3 badges must be the same rarity to forge!');
        }

        const rule = FORGE_RULES[inputRarity];
        if (!rule) {
            throw new Error('Cannot forge from legendary badges!');
        }

        console.log('[BadgeForge] Starting forge with 3x ' + inputRarity + ' badges');
        console.log('[BadgeForge] Combined XP: ' + totalXP);

        // Roll for upgrade
        const { success, roll } = await this.rollForUpgrade(inputRarity);

        // Burn all 3 badges
        for (const badge of badges) {
            try {
                await burnV1(this.umi, {
                    asset: publicKey(badge),
                    authority: authoritySigner,
                }).sendAndConfirm(this.umi);
                console.log('[BadgeForge] Burned badge: ' + badge);
            } catch (error) {
                console.error('[BadgeForge] Error burning badge:', error);
            }
        }

        const result: ForgeResultData = {
            success,
            result: success ? 'success' : 'failure',
            inputRarity,
            outputRarity: success ? rule.target : inputRarity,
            combinedXP: totalXP,
            xpBonus: success ? Math.floor(totalXP * rule.xpMultiplier) : 0,
            roll,
        };

        if (success) {
            // Mint new upgraded badge
            const newBadge = await this.mintForgeBadge(
                playerWallet,
                rule.target,
                result.xpBonus,
                authoritySigner
            );
            result.newBadgeAddress = newBadge;
            console.log('[BadgeForge] SUCCESS! New badge: ' + newBadge + ' (XP: ' + result.xpBonus + ')');
        } else {
            // Mint ashes badge
            const ashesBadge = await this.mintAshesBadge(
                playerWallet,
                inputRarity,
                authoritySigner
            );
            result.ashesBadgeAddress = ashesBadge;
            console.log('[BadgeForge] FAILED! Ashes badge: ' + ashesBadge);
        }

        return result;
    }

    /**
     * Mint the forged badge
     */
    private async mintForgeBadge(
        playerWallet: string,
        rarity: BadgeRarity,
        xp: number,
        authoritySigner: any
    ): Promise<string> {
        const assetSigner = generateSigner(this.umi);
        const now = Date.now().toString();
        const name = rarity.charAt(0).toUpperCase() + rarity.slice(1) + ' Forged Badge';

        await burnV1(this.umi, {
            asset: assetSigner.publicKey,
            authority: authoritySigner,
        }).sendAndConfirm(this.umi);

        // Note: Would use createV1 in real implementation
        // For now returning placeholder
        return assetSigner.publicKey.toString();
    }

    /**
     * Mint 'Ashes of Hubris' badge on failure
     */
    private async mintAshesBadge(
        playerWallet: string,
        failedRarity: BadgeRarity,
        authoritySigner: any
    ): Promise<string> {
        const assetSigner = generateSigner(this.umi);

        // Note: Would use createV1 in real implementation  
        return assetSigner.publicKey.toString();
    }

    /**
     * Calculate forge odds for UI
     */
    calculateOdds(rarity: BadgeRarity) {
        const rule = FORGE_RULES[rarity];
        if (!rule) return null;

        return {
            inputRarity: rarity,
            targetRarity: rule.target,
            successRate: rule.successRate + '%',
            failureRate: (100 - rule.successRate) + '%',
            xpMultiplier: rule.xpMultiplier + 'x',
        };
    }
}

/**
 * Factory function
 */
export function createBadgeForge(rpcUrl: string): BadgeForge {
    return new BadgeForge(rpcUrl);
}

export default BadgeForge;
