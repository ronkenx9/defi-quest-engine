/**
 * DeFi Quest Engine - Badge Minter
 * Mints NFT achievement badges using Metaplex Core (mpl-core)
 * 
 * Uses Metaplex Umi framework for TypeScript interactions
 * @see https://developers.metaplex.com/core
 */

import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { EventEmitter } from 'eventemitter3';
import {
    BadgeType,
    BadgeRarity,
    BadgeMetadata,
    BadgeCollectionConfig,
    getBadgeMetadata,
    DEFAULT_COLLECTION_CONFIG,
} from './BadgeCollection';

// ============================================================================
// Types
// ============================================================================

export interface BadgeMinterConfig {
    /** Solana connection */
    connection: Connection;
    /** Collection address (if already created) */
    collectionAddress?: string;
    /** RPC endpoint */
    rpcEndpoint: string;
    /** Network */
    network: 'mainnet-beta' | 'devnet' | 'testnet';
}

export interface MintedBadge {
    /** Badge type */
    type: BadgeType;
    /** Mint address */
    mintAddress: string;
    /** Owner wallet address */
    ownerAddress: string;
    /** Transaction signature */
    signature: string;
    /** Timestamp */
    mintedAt: Date;
    /** Metadata */
    metadata: BadgeMetadata;
}

export interface BadgeMinterEvents {
    'badge:minting': { type: BadgeType; wallet: string };
    'badge:minted': { badge: MintedBadge };
    'badge:error': { error: Error; type: BadgeType };
}

export interface SignTransaction {
    (transaction: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction>;
}

// ============================================================================
// Badge Minter
// ============================================================================

/**
 * Badge Minter
 * 
 * Handles minting NFT achievement badges when users complete missions.
 * Uses Metaplex Core for efficient, low-cost NFTs on Solana.
 * 
 * @example
 * ```typescript
 * const minter = new BadgeMinter({
 *   connection,
 *   rpcEndpoint: 'https://api.devnet.solana.com',
 *   network: 'devnet',
 * });
 * 
 * await minter.initialize();
 * 
 * const badge = await minter.mintBadge(
 *   BadgeType.FIRST_SWAP,
 *   'userWalletAddress',
 *   signTransaction
 * );
 * ```
 */
export class BadgeMinter extends EventEmitter<BadgeMinterEvents> {
    private config: BadgeMinterConfig;
    private collectionConfig: BadgeCollectionConfig | null = null;
    private initialized = false;

    // Track minted badges per user (to prevent duplicates)
    private mintedBadges: Map<string, Set<BadgeType>> = new Map();

    constructor(config: BadgeMinterConfig) {
        super();
        this.config = config;
    }

    /**
     * Initialize the minter
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('[BadgeMinter] Initializing...', {
            network: this.config.network,
            hasCollection: !!this.config.collectionAddress,
        });

        // Load existing minted badges from storage
        this.loadMintedBadges();

        this.initialized = true;
        console.log('[BadgeMinter] Initialized successfully');
    }

    /**
     * Load minted badges from localStorage
     */
    private loadMintedBadges(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem('defi-quest-minted-badges');
            if (stored) {
                const data = JSON.parse(stored);
                for (const [wallet, badges] of Object.entries(data)) {
                    this.mintedBadges.set(wallet, new Set(badges as BadgeType[]));
                }
            }
        } catch (e) {
            console.error('[BadgeMinter] Failed to load minted badges:', e);
        }
    }

    /**
     * Save minted badges to localStorage
     */
    private saveMintedBadges(): void {
        if (typeof window === 'undefined') return;

        try {
            const data: Record<string, BadgeType[]> = {};
            for (const [wallet, badges] of this.mintedBadges.entries()) {
                data[wallet] = Array.from(badges);
            }
            localStorage.setItem('defi-quest-minted-badges', JSON.stringify(data));
        } catch (e) {
            console.error('[BadgeMinter] Failed to save minted badges:', e);
        }
    }

    /**
     * Check if user already has a specific badge
     */
    hasBadge(walletAddress: string, badgeType: BadgeType): boolean {
        const userBadges = this.mintedBadges.get(walletAddress);
        return userBadges?.has(badgeType) ?? false;
    }

    /**
     * Get all badges for a user
     */
    getUserBadges(walletAddress: string): BadgeType[] {
        const userBadges = this.mintedBadges.get(walletAddress);
        return userBadges ? Array.from(userBadges) : [];
    }

    /**
     * Mint a badge NFT for a user
     * 
     * @param badgeType - Type of badge to mint
     * @param walletAddress - Recipient wallet address
     * @param signTransaction - Function to sign transaction (from wallet adapter)
     * @returns Minted badge details
     */
    async mintBadge(
        badgeType: BadgeType,
        walletAddress: string,
        signTransaction: SignTransaction
    ): Promise<MintedBadge> {
        // Check if already minted
        if (this.hasBadge(walletAddress, badgeType)) {
            throw new Error(`Badge ${badgeType} already minted for ${walletAddress}`);
        }

        this.emit('badge:minting', { type: badgeType, wallet: walletAddress });

        try {
            const metadata = getBadgeMetadata(badgeType);

            // In production, this would:
            // 1. Create Umi instance with wallet signer
            // 2. Build Core NFT create instruction with metadata
            // 3. Send and confirm transaction
            // 4. Return mint address and signature

            // For hackathon demo, we simulate the minting process
            // Real implementation would use @metaplex-foundation/mpl-core
            const mintResult = await this.simulateMint(walletAddress, metadata, signTransaction);

            // Record the minted badge
            if (!this.mintedBadges.has(walletAddress)) {
                this.mintedBadges.set(walletAddress, new Set());
            }
            this.mintedBadges.get(walletAddress)!.add(badgeType);
            this.saveMintedBadges();

            const mintedBadge: MintedBadge = {
                type: badgeType,
                mintAddress: mintResult.mintAddress,
                ownerAddress: walletAddress,
                signature: mintResult.signature,
                mintedAt: new Date(),
                metadata,
            };

            this.emit('badge:minted', { badge: mintedBadge });
            console.log('[BadgeMinter] Badge minted:', mintedBadge);

            return mintedBadge;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Minting failed');
            this.emit('badge:error', { error: err, type: badgeType });
            throw err;
        }
    }

    /**
     * Simulate minting (for development/demo)
     * In production, replace with actual Metaplex Core minting
     */
    private async simulateMint(
        walletAddress: string,
        metadata: BadgeMetadata,
        _signTransaction: SignTransaction
    ): Promise<{ mintAddress: string; signature: string }> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate mock addresses (in production, these come from the actual mint)
        const mockMintAddress = this.generateMockAddress();
        const mockSignature = this.generateMockSignature();

        console.log('[BadgeMinter] Simulated mint:', {
            wallet: walletAddress,
            badge: metadata.name,
            rarity: metadata.rarity,
            mintAddress: mockMintAddress,
        });

        return {
            mintAddress: mockMintAddress,
            signature: mockSignature,
        };
    }

    /**
     * Generate mock Solana address (for demo)
     */
    private generateMockAddress(): string {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 44; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Generate mock signature (for demo)
     */
    private generateMockSignature(): string {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        for (let i = 0; i < 88; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Build the actual Metaplex Core mint instruction
     * 
     * This is the production implementation structure.
     * Requires @metaplex-foundation/mpl-core and @metaplex-foundation/umi
     */
    // private async buildMintInstruction(
    //     walletAddress: string,
    //     metadata: BadgeMetadata
    // ): Promise<Transaction> {
    //     // import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
    //     // import { create, fetchAsset } from '@metaplex-foundation/mpl-core';
    //     
    //     // const umi = createUmi(this.config.rpcEndpoint);
    //     // 
    //     // const asset = generateSigner(umi);
    //     // 
    //     // const createIx = create(umi, {
    //     //     asset,
    //     //     name: metadata.name,
    //     //     uri: await this.uploadMetadata(metadata),
    //     //     owner: publicKey(walletAddress),
    //     //     collection: this.config.collectionAddress 
    //     //         ? { publicKey: publicKey(this.config.collectionAddress) }
    //     //         : undefined,
    //     // });
    //     //
    //     // return createIx.build(umi);
    // }

    /**
     * Get Solana Explorer URL for a badge
     */
    getExplorerUrl(mintAddress: string): string {
        const cluster = this.config.network === 'mainnet-beta' ? '' : `?cluster=${this.config.network}`;
        return `https://explorer.solana.com/address/${mintAddress}${cluster}`;
    }

    /**
     * Get total badges minted
     */
    getTotalMinted(): number {
        let total = 0;
        for (const badges of this.mintedBadges.values()) {
            total += badges.size;
        }
        return total;
    }

    /**
     * Get badge rarity distribution
     */
    getRarityDistribution(): Record<BadgeRarity, number> {
        const distribution: Record<BadgeRarity, number> = {
            [BadgeRarity.COMMON]: 0,
            [BadgeRarity.RARE]: 0,
            [BadgeRarity.EPIC]: 0,
            [BadgeRarity.LEGENDARY]: 0,
        };

        for (const badges of this.mintedBadges.values()) {
            for (const badgeType of badges) {
                const metadata = getBadgeMetadata(badgeType);
                distribution[metadata.rarity]++;
            }
        }

        return distribution;
    }
}

/**
 * Map mission completion to badge type
 */
export function missionToBadgeType(missionType: string, value?: number): BadgeType | null {
    switch (missionType) {
        case 'swap':
            return BadgeType.FIRST_SWAP;
        case 'volume':
            if (value && value >= 100) return BadgeType.VOLUME_TRADER;
            return null;
        case 'streak':
            if (value && value >= 100) return BadgeType.STREAK_LEGEND;
            if (value && value >= 30) return BadgeType.STREAK_WARRIOR;
            if (value && value >= 7) return BadgeType.STREAK_STARTER;
            return null;
        case 'dca':
            return BadgeType.DCA_INITIATE;
        case 'limit_order':
            return BadgeType.LIMIT_ORDER_PRO;
        default:
            return null;
    }
}
