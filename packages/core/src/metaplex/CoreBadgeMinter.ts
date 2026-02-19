/**
 * DeFi Quest Engine - Core Badge Minter
 * Mints NFT achievement badges using Metaplex Core (mpl-core)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createV1,
    fetchAsset,
    updatePluginV1,
} from '@metaplex-foundation/mpl-core';
import {
    generateSigner,
    publicKey,
} from '@metaplex-foundation/umi';
import { BadgeType, BadgeMetadata, getBadgeMetadata } from './BadgeCollection';

export interface CoreMinterConfig {
    rpcEndpoint: string;
    collectionAddress?: string;
    network: 'mainnet-beta' | 'devnet';
}

export class CoreBadgeMinter {
    private umi: any;
    private config: CoreMinterConfig;

    constructor(config: CoreMinterConfig) {
        this.config = config;
        this.umi = createUmi(config.rpcEndpoint);
    }

    /**
     * Mint a badge using Metaplex Core
     * @param badgeType Type of badge to mint
     * @param recipient Recipient wallet address
     * @param authoritySigner Signature provider (the user's wallet)
     */
    async mintBadge(
        badgeType: BadgeType,
        recipient: string,
        authoritySigner: any
    ) {
        const metadata = getBadgeMetadata(badgeType);
        const assetSigner = generateSigner(this.umi);

        // Define attributes plugin for programmable progress
        const attributesPlugin = {
            type: 'Attributes' as const,
            attributeList: [
                { key: 'Type', value: badgeType },
                { key: 'Rarity', value: metadata.rarity },
                { key: 'Level', value: '1' },
                { key: 'XP', value: String((metadata as any).xp ?? 100) }
            ]
        };

        // Create the Core Asset using createV1
        return createV1(this.umi, {
            asset: assetSigner,
            name: metadata.name,
            uri: metadata.image,
            owner: publicKey(recipient),
            plugins: [attributesPlugin as any],
        }).sendAndConfirm(this.umi);
    }

    /**
     * Update badge stats on-chain (Programmable NFT feature)
     */
    async levelUpBadge(
        assetAddress: string,
        newLevel: number,
        authoritySigner: any
    ) {
        // Build attribute updates
        const attributeList = [
            { key: 'Level', value: String(newLevel) }
        ];

        return updatePluginV1(this.umi, {
            asset: publicKey(assetAddress),
            authority: authoritySigner,
            plugin: {
                type: 'Attributes',
                attributeList,
            } as any,
        }).sendAndConfirm(this.umi);
    }
}
