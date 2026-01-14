/**
 * DeFi Quest Engine - Badge Display
 * Utility module for displaying and querying user badges
 */

import { Connection, PublicKey } from '@solana/web3.js';
import {
    BadgeType,
    BadgeRarity,
    BadgeMetadata,
    getBadgeMetadata,
    getRarityColor,
    getRarityGradient,
} from './BadgeCollection';

// ============================================================================
// Types
// ============================================================================

export interface DisplayBadge {
    /** Badge type */
    type: BadgeType;
    /** Badge metadata */
    metadata: BadgeMetadata;
    /** Mint address (if minted) */
    mintAddress?: string;
    /** Whether the user owns this badge */
    owned: boolean;
    /** Mint timestamp (if owned) */
    mintedAt?: Date;
    /** Display styling */
    style: {
        color: string;
        gradient: string;
        glow: string;
    };
}

export interface BadgeGalleryData {
    /** All badges (owned and unowned) */
    allBadges: DisplayBadge[];
    /** Only owned badges */
    ownedBadges: DisplayBadge[];
    /** Badges grouped by rarity */
    byRarity: Record<BadgeRarity, DisplayBadge[]>;
    /** Stats */
    stats: {
        totalOwned: number;
        totalAvailable: number;
        completionPercent: number;
        rarityBreakdown: Record<BadgeRarity, { owned: number; total: number }>;
    };
}

// ============================================================================
// Badge Display Manager
// ============================================================================

/**
 * Badge Display Manager
 * 
 * Provides utilities for displaying badges in the UI, including
 * styling information, gallery data, and badge queries.
 */
export class BadgeDisplay {
    private ownedBadges: Map<string, Map<BadgeType, { mintAddress?: string; mintedAt?: Date }>> = new Map();
    private connection: Connection | null = null;

    constructor(connection?: Connection) {
        this.connection = connection || null;
    }

    /**
     * Set owned badges for a wallet
     */
    setOwnedBadges(
        walletAddress: string,
        badges: Array<{ type: BadgeType; mintAddress?: string; mintedAt?: Date }>
    ): void {
        const badgeMap = new Map<BadgeType, { mintAddress?: string; mintedAt?: Date }>();
        for (const badge of badges) {
            badgeMap.set(badge.type, {
                mintAddress: badge.mintAddress,
                mintedAt: badge.mintedAt,
            });
        }
        this.ownedBadges.set(walletAddress, badgeMap);
    }

    /**
     * Get display data for a single badge
     */
    getBadgeDisplay(badgeType: BadgeType, walletAddress?: string): DisplayBadge {
        const metadata = getBadgeMetadata(badgeType);
        const ownedData = walletAddress
            ? this.ownedBadges.get(walletAddress)?.get(badgeType)
            : undefined;

        return {
            type: badgeType,
            metadata,
            mintAddress: ownedData?.mintAddress,
            owned: !!ownedData,
            mintedAt: ownedData?.mintedAt,
            style: this.getStyle(metadata.rarity, !!ownedData),
        };
    }

    /**
     * Get styling for a badge based on rarity and ownership
     */
    private getStyle(rarity: BadgeRarity, owned: boolean): DisplayBadge['style'] {
        const color = getRarityColor(rarity);
        const gradient = getRarityGradient(rarity);

        // Glow effect based on rarity (stronger for rarer badges)
        const glowIntensity = owned ? this.getGlowIntensity(rarity) : 0;
        const glow = owned
            ? `0 0 ${glowIntensity}px ${color}40, 0 0 ${glowIntensity * 2}px ${color}20`
            : 'none';

        return { color, gradient, glow };
    }

    private getGlowIntensity(rarity: BadgeRarity): number {
        switch (rarity) {
            case BadgeRarity.COMMON: return 8;
            case BadgeRarity.RARE: return 12;
            case BadgeRarity.EPIC: return 16;
            case BadgeRarity.LEGENDARY: return 24;
        }
    }

    /**
     * Get full gallery data for a wallet
     */
    getGalleryData(walletAddress?: string): BadgeGalleryData {
        const allBadgeTypes = Object.values(BadgeType);
        const allBadges: DisplayBadge[] = allBadgeTypes.map(type =>
            this.getBadgeDisplay(type, walletAddress)
        );

        const ownedBadges = allBadges.filter(b => b.owned);

        // Group by rarity
        const byRarity: Record<BadgeRarity, DisplayBadge[]> = {
            [BadgeRarity.COMMON]: [],
            [BadgeRarity.RARE]: [],
            [BadgeRarity.EPIC]: [],
            [BadgeRarity.LEGENDARY]: [],
        };

        for (const badge of allBadges) {
            byRarity[badge.metadata.rarity].push(badge);
        }

        // Calculate stats
        const rarityBreakdown: Record<BadgeRarity, { owned: number; total: number }> = {
            [BadgeRarity.COMMON]: { owned: 0, total: 0 },
            [BadgeRarity.RARE]: { owned: 0, total: 0 },
            [BadgeRarity.EPIC]: { owned: 0, total: 0 },
            [BadgeRarity.LEGENDARY]: { owned: 0, total: 0 },
        };

        for (const badge of allBadges) {
            const rarity = badge.metadata.rarity;
            rarityBreakdown[rarity].total++;
            if (badge.owned) {
                rarityBreakdown[rarity].owned++;
            }
        }

        return {
            allBadges,
            ownedBadges,
            byRarity,
            stats: {
                totalOwned: ownedBadges.length,
                totalAvailable: allBadges.length,
                completionPercent: Math.round((ownedBadges.length / allBadges.length) * 100),
                rarityBreakdown,
            },
        };
    }

    /**
     * Get badges sorted by rarity (legendary first)
     */
    getBadgesSortedByRarity(walletAddress?: string): DisplayBadge[] {
        const gallery = this.getGalleryData(walletAddress);
        return [
            ...gallery.byRarity[BadgeRarity.LEGENDARY],
            ...gallery.byRarity[BadgeRarity.EPIC],
            ...gallery.byRarity[BadgeRarity.RARE],
            ...gallery.byRarity[BadgeRarity.COMMON],
        ];
    }

    /**
     * Generate CSS for badge card styling
     */
    static generateBadgeCardCSS(): string {
        return `
            .badge-card {
                position: relative;
                border-radius: 12px;
                padding: 16px;
                background: var(--dqe-card-bg, #14141f);
                transition: transform 0.2s, box-shadow 0.3s;
            }
            
            .badge-card:hover {
                transform: translateY(-4px);
            }
            
            .badge-card.owned {
                cursor: pointer;
            }
            
            .badge-card.locked {
                opacity: 0.5;
                filter: grayscale(0.8);
            }
            
            .badge-card.rarity-common {
                border: 2px solid #555555;
            }
            
            .badge-card.rarity-rare {
                border: 2px solid #3b82f6;
            }
            
            .badge-card.rarity-epic {
                border: 2px solid #a855f7;
            }
            
            .badge-card.rarity-legendary {
                border: 2px solid #f59e0b;
                animation: legendary-pulse 2s ease-in-out infinite;
            }
            
            @keyframes legendary-pulse {
                0%, 100% { box-shadow: 0 0 20px #f59e0b40; }
                50% { box-shadow: 0 0 30px #f59e0b60; }
            }
            
            .badge-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                object-fit: cover;
            }
            
            .badge-name {
                font-weight: 600;
                margin-top: 8px;
            }
            
            .badge-rarity {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        `;
    }

    /**
     * Get Solana Explorer URL for a minted badge
     */
    getExplorerUrl(mintAddress: string, network: string = 'devnet'): string {
        const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
        return `https://explorer.solana.com/address/${mintAddress}${cluster}`;
    }
}

/**
 * Export singleton instance
 */
export const badgeDisplay = new BadgeDisplay();
