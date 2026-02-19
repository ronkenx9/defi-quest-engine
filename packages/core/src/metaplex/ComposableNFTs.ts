/**
 * DeFi Quest Engine - Composable NFTs for Game Loadouts
 * 
 * Metaplex Track Requirement: Composable NFTs for Game Loadouts
 * 
 * This module creates parent-child relationships:
 * - Character NFTs (parent) that can equip items
 * - Equipment NFTs (children) that attach to characters
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
    createCollectionV1,
    createV1,
    fetchAsset,
    fetchCollection,
} from '@metaplex-foundation/mpl-core';
import {
    generateSigner,
    publicKey,
} from '@metaplex-foundation/umi';

// ============================================================================
// Types
// ============================================================================

export type CharacterClass = 'WARRIOR' | 'MAGE' | 'ROGUE' | 'RANGER' | 'HEALER';

export interface CharacterData {
    address: string;
    name: string;
    class: CharacterClass;
    level: number;
    equippedItems: string[];
}

export interface EquipmentData {
    address: string;
    name: string;
    slot: EquipmentSlot;
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    stats: EquipmentStats;
    equippedTo?: string;
}

export type EquipmentSlot = 'WEAPON' | 'ARMOR' | 'HELMET' | 'BOOTS' | 'ACCESSORY';

export interface EquipmentStats {
    attack?: number;
    defense?: number;
    speed?: number;
    magic?: number;
    health?: number;
}

export interface LoadoutData {
    character: CharacterData;
    equipment: EquipmentData[];
    totalStats: EquipmentStats;
}

// ============================================================================
// Constants
// ============================================================================

export const CHARACTER_CLASSES: Record<CharacterClass, { name: string; baseStats: EquipmentStats }> = {
    WARRIOR: { name: 'Warrior', baseStats: { attack: 10, defense: 8, health: 15 } },
    MAGE: { name: 'Mage', baseStats: { magic: 12, defense: 4, health: 8 } },
    ROGUE: { name: 'Rogue', baseStats: { attack: 8, speed: 12, health: 10 } },
    RANGER: { name: 'Ranger', baseStats: { attack: 8, speed: 8, health: 10 } },
    HEALER: { name: 'Healer', baseStats: { magic: 10, health: 12, defense: 5 } },
};

export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['WEAPON', 'ARMOR', 'HELMET', 'BOOTS', 'ACCESSORY'];

// ============================================================================
// ComposableNFTs Class
// ============================================================================

export class ComposableNFTs {
    private umi: any;
    private connection: Connection;
    private rpcEndpoint: string;

    constructor(rpcEndpoint: string) {
        this.rpcEndpoint = rpcEndpoint;
        this.connection = new Connection(rpcEndpoint);
        this.umi = createUmi(rpcEndpoint);
    }

    /**
     * Create a Character NFT (acts as parent for equipment)
     */
    async createCharacter(
        name: string,
        characterClass: CharacterClass,
        ownerPublicKey: string,
        authoritySigner: any
    ): Promise<string> {
        const classData = CHARACTER_CLASSES[characterClass];
        const collectionSigner = generateSigner(this.umi);

        await createCollectionV1(this.umi, {
            collection: collectionSigner,
            name: name + ' (' + classData.name + ')',
            uri: 'https://defi-quest.com/characters/' + characterClass.toLowerCase() + '.json',
            plugins: [
                {
                    type: 'Attributes',
                    attributeList: [
                        { key: 'Class', value: characterClass },
                        { key: 'Level', value: '1' },
                        { key: 'XP', value: '0' },
                        { key: 'Attack', value: String(classData.baseStats.attack || 0) },
                        { key: 'Defense', value: String(classData.baseStats.defense || 0) },
                        { key: 'Health', value: String(classData.baseStats.health || 0) },
                        { key: 'Magic', value: String(classData.baseStats.magic || 0) },
                        { key: 'Speed', value: String(classData.baseStats.speed || 0) },
                    ],
                } as any,
            ],
        }).sendAndConfirm(this.umi);

        return collectionSigner.publicKey.toString();
    }

    /**
     * Create Equipment NFT and link to character
     */
    async createEquipment(
        name: string,
        slot: EquipmentSlot,
        stats: EquipmentStats,
        rarity: EquipmentData['rarity'],
        characterAddress: string,
        ownerPublicKey: string,
        authoritySigner: any
    ): Promise<string> {
        const assetSigner = generateSigner(this.umi);

        await createV1(this.umi, {
            asset: assetSigner,
            name: name,
            uri: 'https://defi-quest.com/equipment/' + slot.toLowerCase() + '.json',
            owner: publicKey(ownerPublicKey),
            collection: publicKey(characterAddress),
            plugins: [
                {
                    type: 'Attributes',
                    attributeList: [
                        { key: 'Slot', value: slot },
                        { key: 'Rarity', value: rarity },
                        { key: 'Attack', value: String(stats.attack || 0) },
                        { key: 'Defense', value: String(stats.defense || 0) },
                        { key: 'Speed', value: String(stats.speed || 0) },
                        { key: 'Magic', value: String(stats.magic || 0) },
                        { key: 'Health', value: String(stats.health || 0) },
                        { key: 'Equipped', value: 'true' },
                    ],
                } as any,
            ],
        }).sendAndConfirm(this.umi);

        return assetSigner.publicKey.toString();
    }

    /**
     * Get character loadout
     */
    async getCharacterLoadout(characterAddress: string): Promise<LoadoutData | null> {
        try {
            const character = await fetchCollection(this.umi, publicKey(characterAddress));
            const charData = character as any;
            const attrs = charData?.attributes?.attributeList || [];

            const getAttr = (key: string) =>
                attrs.find((a: any) => a.key === key)?.value || '0';

            const charClass = getAttr('Class') as CharacterClass;
            const classData = CHARACTER_CLASSES[charClass];

            return {
                character: {
                    address: characterAddress,
                    name: character.name,
                    class: charClass,
                    level: parseInt(getAttr('Level')) || 1,
                    equippedItems: [],
                },
                equipment: [],
                totalStats: classData?.baseStats || { attack: 0, defense: 0, health: 0 },
            };
        } catch (error) {
            console.error('[ComposableNFTs] Failed to fetch loadout:', error);
            return null;
        }
    }
}

export function createComposableNFTs(rpcUrl: string): ComposableNFTs {
    return new ComposableNFTs(rpcUrl);
}

export default ComposableNFTs;
