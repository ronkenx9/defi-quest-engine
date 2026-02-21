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

const CORE_BADGES: Badge[] = [
    {
        id: 'red_pill',
        type: 'first_swap',
        name: 'The Red Pill',
        description: 'You took the first step. You initiated a swap and woke up from the simulation.',
        rarity: 'common',
        image: '/badges/red-pill.png',
        owned: false,
        attributes: [
            { traitType: 'Status', value: 'Awakened' },
            { traitType: 'Category', value: 'Trading' },
            { traitType: 'Points', value: 50 },
        ],
    },
    {
        id: 'system_glitch',
        type: 'volume_trader',
        name: 'System Glitch',
        description: 'You moved enough volume to cause a ripple in the code. The agents are watching.',
        rarity: 'rare',
        image: '/badges/system-glitch.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Anomaly' },
            { traitType: 'Volume', value: '$100+' },
            { traitType: 'Points', value: 200 },
        ],
    },
    {
        id: 'white_rabbit',
        type: 'streak_starter',
        name: 'White Rabbit',
        description: 'You followed the trail for 7 days straight. How deep does the rabbit hole go?',
        rarity: 'common',
        image: '/badges/white-rabbit.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Seeker' },
            { traitType: 'Streak', value: '7 Days' },
            { traitType: 'Points', value: 100 },
        ],
    },
    {
        id: 'operator',
        type: 'limit_order',
        name: 'The Operator',
        description: 'You bypassed the manual controls. Precision limit orders executed directly into the mainframe.',
        rarity: 'epic',
        image: '/badges/operator.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Hacker' },
            { traitType: 'Skill', value: 'Automation' },
            { traitType: 'Points', value: 300 },
        ],
    },
    {
        id: 'the_one',
        type: 'swap_master',
        name: 'The One',
        description: 'You have become The One. 100+ on-chain interactions. You see the code now.',
        rarity: 'legendary',
        image: '/badges/the-one.png',
        owned: false,
        attributes: [
            { traitType: 'Status', value: 'Awakened' },
            { traitType: 'Swaps', value: '100+' },
            { traitType: 'Points', value: 2000 },
        ],
    },
    {
        id: 'escape_sim',
        type: 'hackathon_participant',
        name: 'Escape Simulation',
        description: 'Matrix Hackathon 2026 Survivor. You built the tools to break free.',
        rarity: 'legendary',
        image: '/badges/escape.png',
        owned: false,
        attributes: [
            { traitType: 'Event', value: 'Matrix Hackathon' },
            { traitType: 'Role', value: 'Architect' },
            { traitType: 'Points', value: 1000 },
        ],
    },
];

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
        image: '/variants/variant-1.png',
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
        image: '/variants/variant-2.png',
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
        image: '/variants/variant-3.png',
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

import React from 'react';
import { Terminal, Code, Cpu, Zap } from 'lucide-react';

// ============================================================================
// Rarity Configuration for UI (with icons for BadgeGallery)
// ============================================================================

export const RARITY_CONFIG: Record<BadgeRarity, {
    color: string;
    bg: string;
    border: string;
    glow: string;
    icon: React.ReactNode;
    label: string;
}> = {
    common: {
        color: '#4ade80',
        bg: 'rgba(74, 222, 128, 0.08)',
        border: 'rgba(74, 222, 128, 0.3)',
        glow: '0 0 20px rgba(74, 222, 128, 0.15)',
        icon: <Terminal className="w-3 h-3" />,
        label: 'Initiate',
    },
    rare: {
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.08)',
        border: 'rgba(96, 165, 250, 0.3)',
        glow: '0 0 20px rgba(96, 165, 250, 0.15)',
        icon: <Code className="w-3 h-3" />,
        label: 'Hacker',
    },
    epic: {
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.08)',
        border: 'rgba(192, 132, 252, 0.3)',
        glow: '0 0 20px rgba(192, 132, 252, 0.15)',
        icon: <Cpu className="w-3 h-3" />,
        label: 'Operator',
    },
    legendary: {
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.08)',
        border: 'rgba(244, 63, 94, 0.3)',
        glow: '0 0 25px rgba(244, 63, 94, 0.2)',
        icon: <Zap className="w-3 h-3" />,
        label: 'Anomaly',
    },
};
