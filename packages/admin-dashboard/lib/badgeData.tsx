/**
 * Badge Data - Shared Badge Definitions
 * Used by both player-portal and admin-dashboard
 * Contains Matrix-themed badge definitions with AI Forge variants
 */

// ============================================================================
// Types
// ============================================================================

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type BadgeType = string;

export interface BadgeAttribute {
    traitType: string;
    value: string | number;
}

export interface Badge {
    id: string;
    type: BadgeType;
    name: string;
    description: string;
    rarity: BadgeRarity;
    image: string;
    owned: boolean;
    mintedAt?: string;
    mintAddress?: string;
    attributes: BadgeAttribute[];
}

// ============================================================================
// Matrix Badge Registry - Core Badges
// ============================================================================

import manifest from '../public/nft-metadata/manifest.json';

// ============================================================================
// Matrix Badge Registry - Core Badges (Dynamically loaded from manifest)
// ============================================================================

const CORE_BADGES: Badge[] = Object.entries(manifest.badges).map(([id, data]) => {
    // Determine rarity safely
    const rarityObj = data.attributes.find(a => a.trait_type === 'Rarity');
    const rarityStr = rarityObj ? String(rarityObj.value).toLowerCase() : 'common';

    // Map attributes
    const attributes = data.attributes.map(attr => ({
        traitType: attr.trait_type === 'XP' ? 'Points' : attr.trait_type,
        value: attr.value
    }));

    return {
        id,
        type: data.properties.category,
        name: data.name,
        description: data.description,
        rarity: rarityStr as BadgeRarity,
        image: data.image,
        owned: false, // Default to false
        attributes
    };
});

// ============================================================================
// AI Forge Variants
// ============================================================================

export const AI_FORGE_VARIANTS: Badge[] = [
    {
        id: 'neo_variant',
        type: 'ai_forge_variant',
        name: 'Phasing Neo',
        description: 'A rare variant where the subject exists across multiple lines of code simultaneously.',
        rarity: 'legendary',
        image: '/nft-art/zion.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Anomaly' },
            { traitType: 'Origin', value: 'Overseer AI' },
            { traitType: 'Points', value: 2500 },
        ],
    },
    {
        id: 'oracle_variant',
        type: 'ai_forge_variant',
        name: 'Glitched Oracle',
        description: 'The Oracle, seen through a system error. Predictive power intensified.',
        rarity: 'epic',
        image: '/nft-art/oracle.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Prophet' },
            { traitType: 'Origin', value: 'Overseer AI' },
            { traitType: 'Points', value: 1500 },
        ],
    },
    {
        id: 'agent_variant',
        type: 'ai_forge_variant',
        name: 'Sentient Agent',
        description: 'An agent that has developed a sense of self. Higher consciousness override.',
        rarity: 'legendary',
        image: '/nft-art/agent-smith.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Override' },
            { traitType: 'Origin', value: 'Overseer AI' },
            { traitType: 'Points', value: 3000 },
        ],
    },
];

// ============================================================================
// Badge Registry - Core + AI Forge
// ============================================================================

/** Get all badge definitions with AI Forge variants */
export function getAllBadges(): Badge[] {
    return [...CORE_BADGES, ...AI_FORGE_VARIANTS];
}

/** Get badge by ID */
export function getBadgeById(id: string): Badge | undefined {
    const allBadges = getAllBadges();
    return allBadges.find(b => b.id === id);
}

/** Get badges by rarity */
export function getBadgesByRarity(rarity: BadgeRarity): Badge[] {
    const allBadges = getAllBadges();
    return allBadges.filter(b => b.rarity === rarity);
}

// ============================================================================
// Rarity Configuration for UI
// ============================================================================

import { Terminal, Code, Cpu, Zap } from 'lucide-react';

export const RARITY_CONFIG: Record<BadgeRarity, {
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    label: string;
}> = {
    common: {
        color: '#4ade80',
        bg: 'rgba(74, 222, 128, 0.1)',
        border: '#4ade80',
        icon: <Terminal className="w-3 h-3" />,
        label: 'Initiate',
    },
    rare: {
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.1)',
        border: '#60a5fa',
        icon: <Code className="w-3 h-3" />,
        label: 'Hacker',
    },
    epic: {
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.1)',
        border: '#c084fc',
        icon: <Cpu className="w-3 h-3" />,
        label: 'Operator',
    },
    legendary: {
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.1)',
        border: '#f43f5e',
        icon: <Zap className="w-3 h-3" />,
        label: 'Anomaly',
    },
};
