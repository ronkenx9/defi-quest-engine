/**
 * DeFi Quest Engine - Core Badge Minter
 * Mints NFT achievement badges using Metaplex Core (mpl-core)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    create,
    fetchAsset,
    update,
    pluginAuthority,
    ruleSet
} from '@metaplex-foundation/mpl-core';
import {
    generateSigner,
    publicKey,
    Signer,
    createNoopSigner
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
        authorityPublicKey: string
    ) {
        const metadata = getBadgeMetadata(badgeType);
        const assetSigner = generateSigner(this.umi);

        // Define attributes plugin for programmable progress
        const attributesPlugin: any = {
            type: 'Attributes',
            attributeList: [
                { key: 'Type', value: badgeType },
                { key: 'Rarity', value: metadata.rarity },
                { key: 'Level', value: '1' },
                { key: 'XP', value: (metadata as any).xp?.toString() ?? '100' }
            ]
        };

        // Create the Core Asset
        return create(this.umi, {
            asset: assetSigner,
            name: metadata.name,
            uri: metadata.image,
            owner: publicKey(recipient),
            plugins: [attributesPlugin]
        });
    }

    /**
     * Update badge stats on-chain (Programmable NFT feature)
     */
    async levelUpBadge(assetAddress: string, newLevel: number) {
        const asset = await fetchAsset(this.umi, publicKey(assetAddress));

        // Update the Attributes plugin
        return update(this.umi, {
            asset: asset as any,
            plugins: [{
                type: 'Attributes',
                attributeList: [
                    // Logic to merge/update existing attributes
                    { key: 'Level', value: newLevel.toString() }
                ]
            }]
        } as any);
    }
}
