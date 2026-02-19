/**
 * DeFi Quest Engine - Metaplex-Anchor Integration
 * 
 * Wires Anchor program events to Metaplex NFT systems.
 * When users claim rewards on-chain, their NFTs evolve automatically.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';

// Import the new Metaplex systems
import { PlayerProfileNFT } from './PlayerProfileNFT';
import { EvolvingBadgeSystem } from './EvolvingBadgeSystem';
import { DASClient, createDASClient } from './DASClient';

export interface MetaplexAnchorConfig {
    rpcEndpoint: string;
    programId: string;
    authorityKey: string;
    heliusApiKey?: string;
}

/**
 * Event data from Anchor program RewardClaimedEvent
 */
export interface RewardClaimedEventData {
    user: string;
    mission: string;
    xp: number;
    tokenAmount?: number;
    badgeType?: string;
}

/**
 * Metaplex-Anchor Integrator
 * 
 * This class bridges the Anchor program with Metaplex Core NFTs.
 * When the Anchor program emits RewardClaimedEvent, we automatically:
 * 1. Create/update player profile NFT
 * 2. Create/upgrade badge NFT
 * 3. Update XP and level on-chain
 */
export class MetaplexAnchorIntegrator {
    private playerProfile: PlayerProfileNFT;
    private badgeSystem: EvolvingBadgeSystem;
    private dasClient: DASClient;
    private config: MetaplexAnchorConfig;

    constructor(config: MetaplexAnchorConfig) {
        this.config = config;
        this.playerProfile = new PlayerProfileNFT(config.rpcEndpoint);
        this.badgeSystem = new EvolvingBadgeSystem(config.rpcEndpoint);
        this.dasClient = createDASClient(
            config.rpcEndpoint,
            config.heliusApiKey
        );
    }

    /**
     * Handle RewardClaimedEvent from Anchor program
     * This is called when a user claims their mission reward
     */
    async onRewardClaimed(
        event: RewardClaimedEventData,
        authoritySigner: any
    ): Promise<{
        profileUpdated: boolean;
        badgeMinted: boolean;
        badgeUpgraded: boolean;
    }> {
        const results = {
            profileUpdated: false,
            badgeMinted: false,
            badgeUpgraded: false,
        };

        try {
            // Step 1: Find or create player profile
            let profileAddress = await this.findPlayerProfile(event.user);

            if (!profileAddress) {
                // Create new profile for first-time player
                console.log('[MetaplexAnchor] Creating new player profile for', event.user);
                profileAddress = (await this.playerProfile.mintProfile(
                    event.user,
                    'Player' + event.user.slice(0, 8) // Generate username
                )).toString();
                console.log('[MetaplexAnchor] Profile created:', profileAddress);
            } else {
                // Add XP to existing profile
                console.log('[MetaplexAnchor] Adding XP to existing profile:', profileAddress);
                await this.playerProfile.updateStats(
                    profileAddress,
                    event.xp
                );
                console.log('[MetaplexAnchor] XP added:', event.xp);
            }
            results.profileUpdated = true;

            // Step 2: Handle badge if provided
            if (event.badgeType) {
                // Check if user already has this badge type
                const existingBadge = await this.findUserBadgeByType(
                    event.user,
                    event.badgeType
                );

                if (existingBadge) {
                    // Upgrade existing badge
                    console.log('[MetaplexAnchor] Upgrading badge:', existingBadge);
                    await this.badgeSystem.upgradeBadge(
                        existingBadge,
                        event.xp
                    );
                    results.badgeUpgraded = true;
                    console.log('[MetaplexAnchor] Badge upgraded!');
                } else {
                    // Mint new badge
                    console.log('[MetaplexAnchor] Minting new badge:', event.badgeType);
                    await this.badgeSystem.mintBadge(
                        event.user,
                        event.badgeType,
                        event.mission
                    );
                    results.badgeMinted = true;
                    console.log('[MetaplexAnchor] Badge minted!');
                }
            }

            return results;

        } catch (error) {
            console.error('[MetaplexAnchor] Error handling reward claimed:', error);
            throw error;
        }
    }

    /**
     * Find player profile NFT for a wallet
     */
    async findPlayerProfile(walletAddress: string): Promise<string | null> {
        try {
            const profile = await this.dasClient.findPlayerProfile(walletAddress);
            return profile?.id || null;
        } catch (error) {
            console.error('[MetaplexAnchor] Error finding profile:', error);
            return null;
        }
    }

    /**
     * Find a specific badge type for a user
     */
    async findUserBadgeByType(
        walletAddress: string,
        badgeType: string
    ): Promise<string | null> {
        try {
            const badges = await this.dasClient.findPlayerBadges(walletAddress);
            const badge = badges.find(b =>
                b.content?.metadata?.name?.includes(badgeType)
            );
            return badge?.id || null;
        } catch (error) {
            console.error('[MetaplexAnchor] Error finding badge:', error);
            return null;
        }
    }

    /**
     * Get full player inventory (profile + all badges)
     */
    async getPlayerInventory(walletAddress: string): Promise<{
        profile: any;
        badges: any[];
    }> {
        const profile = await this.dasClient.findPlayerProfile(walletAddress);
        const badges = await this.dasClient.findPlayerBadges(walletAddress);

        return {
            profile,
            badges,
        };
    }

    /**
     * Get leaderboard from on-chain data
     */
    async getOnChainLeaderboard(collectionAddress: string, limit = 100) {
        return this.dasClient.getLeaderboard(collectionAddress, limit);
    }
}

/**
 * Factory function
 */
export function createMetaplexAnchorIntegrator(config: MetaplexAnchorConfig) {
    return new MetaplexAnchorIntegrator(config);
}

export default MetaplexAnchorIntegrator;
