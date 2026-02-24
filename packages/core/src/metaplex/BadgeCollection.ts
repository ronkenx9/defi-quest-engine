/**
 * DeFi Quest Engine - Metaplex Badge Collection
 * Defines the NFT achievement badge collection structure
 * 
 * @see https://developers.metaplex.com/
 */

// ============================================================================
// Badge Rarity Tiers
// ============================================================================

export enum BadgeRarity {
    COMMON = 'common',
    RARE = 'rare',
    EPIC = 'epic',
    LEGENDARY = 'legendary',
}

// ============================================================================
// Badge Types (mapped to mission types)
// ============================================================================

export enum BadgeType {
    // Swap-related
    FIRST_SWAP = 'first_swap',
    VOLUME_TRADER = 'volume_trader',
    SWAP_MASTER = 'swap_master',

    // Streak-related  
    STREAK_STARTER = 'streak_starter',     // 7 days
    STREAK_WARRIOR = 'streak_warrior',     // 30 days
    STREAK_LEGEND = 'streak_legend',       // 100 days

    // DeFi-specific
    DCA_INITIATE = 'dca_initiate',
    LIMIT_ORDER_PRO = 'limit_order_pro',

    // Jupiter Mobile Exclusive
    MOBILE_PIONEER = 'mobile_pioneer',         // First action on Jupiter Mobile
    MOBILE_WARRIOR = 'mobile_warrior',         // 10+ swaps on Jupiter Mobile
    GATEWAY_MASTER = 'gateway_master',         // 50+ actions via Jupiter Mobile

    // Special
    EARLY_ADOPTER = 'early_adopter',
    HACKATHON_PARTICIPANT = 'hackathon_participant',
}

// ============================================================================
// Badge Metadata
// ============================================================================

export interface BadgeMetadata {
    /** Unique badge type identifier */
    type: BadgeType;
    /** Display name */
    name: string;
    /** Badge description */
    description: string;
    /** Rarity tier */
    rarity: BadgeRarity;
    /** Image URI (Arweave/IPFS) */
    image: string;
    /** External URL for more info */
    externalUrl?: string;
    /** Additional attributes */
    attributes: BadgeAttribute[];
}

export interface BadgeAttribute {
    traitType: string;
    value: string | number;
}

// ============================================================================
// Badge Collection Config
// ============================================================================

export interface BadgeCollectionConfig {
    /** Collection name */
    name: string;
    /** Collection symbol */
    symbol: string;
    /** Collection description */
    description: string;
    /** Collection image */
    image: string;
    /** External URL */
    externalUrl: string;
    /** Seller fee basis points (royalties) */
    sellerFeeBasisPoints: number;
    /** Collection authority (mint authority) */
    authority: string;
}

// ============================================================================
// Default Collection Configuration
// ============================================================================

export const DEFAULT_COLLECTION_CONFIG: Omit<BadgeCollectionConfig, 'authority'> = {
    name: 'DeFi Quest Badges',
    symbol: 'DQBADGE',
    description: 'Achievement badges earned through DeFi Quest missions powered by Jupiter',
    image: 'https://defi-quest-home.netlify.app/badge-collection.png',
    externalUrl: 'https://defi-quest-home.netlify.app',
    sellerFeeBasisPoints: 0, // No royalties for achievement badges
};

// ============================================================================
// Badge Definitions
// ============================================================================

export const BADGE_DEFINITIONS: Record<BadgeType, Omit<BadgeMetadata, 'type'>> = {
    [BadgeType.FIRST_SWAP]: {
        name: 'The Red Pill',
        description: 'You took the first step. You initiated a swap and woke up from the simulation.',
        rarity: BadgeRarity.COMMON,
        image: '/nft-art/red-pill.png',
        attributes: [
            { traitType: 'Status', value: 'Awakened' },
            { traitType: 'Category', value: 'Trading' },
            { traitType: 'Points', value: 50 },
        ],
    },
    [BadgeType.VOLUME_TRADER]: {
        name: 'System Glitch',
        description: 'You moved enough volume to cause a ripple in the code. The agents are watching.',
        rarity: BadgeRarity.RARE,
        image: '/nft-art/system-glitch.png',
        attributes: [
            { traitType: 'Class', value: 'Anomaly' },
            { traitType: 'Volume', value: '$100+' },
            { traitType: 'Points', value: 200 },
        ],
    },
    [BadgeType.SWAP_MASTER]: {
        name: 'The One',
        description: 'You have become The One. 100+ on-chain interactions. You see the code now.',
        rarity: BadgeRarity.LEGENDARY,
        image: '/nft-art/the-one.png',
        attributes: [
            { traitType: 'Status', value: 'Awakened' },
            { traitType: 'Swaps', value: '100+' },
            { traitType: 'Points', value: 2000 },
        ],
    },
    [BadgeType.STREAK_STARTER]: {
        name: 'White Rabbit',
        description: 'You followed the trail for 7 days straight. How deep does the rabbit hole go?',
        rarity: BadgeRarity.COMMON,
        image: '/nft-art/white-rabbit.png',
        attributes: [
            { traitType: 'Class', value: 'Seeker' },
            { traitType: 'Streak', value: '7 Days' },
            { traitType: 'Points', value: 100 },
        ],
    },
    [BadgeType.STREAK_WARRIOR]: {
        name: 'Streak Warrior',
        description: 'Maintained a 30-day trading streak',
        rarity: BadgeRarity.RARE,
        image: 'https://defi-quest-home.netlify.app/badges/streak-warrior.png',
        attributes: [
            { traitType: 'Category', value: 'Streak' },
            { traitType: 'Days Required', value: 30 },
            { traitType: 'Points', value: 300 },
        ],
    },
    [BadgeType.STREAK_LEGEND]: {
        name: 'Streak Legend',
        description: 'Maintained a 100-day trading streak',
        rarity: BadgeRarity.LEGENDARY,
        image: 'https://defi-quest-home.netlify.app/badges/streak-legend.png',
        attributes: [
            { traitType: 'Category', value: 'Streak' },
            { traitType: 'Days Required', value: 100 },
            { traitType: 'Points', value: 1000 },
        ],
    },
    [BadgeType.DCA_INITIATE]: {
        name: 'DCA Initiate',
        description: 'Set up your first Dollar Cost Average position',
        rarity: BadgeRarity.RARE,
        image: 'https://defi-quest-home.netlify.app/badges/dca-initiate.png',
        attributes: [
            { traitType: 'Category', value: 'DeFi' },
            { traitType: 'Difficulty', value: 'Medium' },
            { traitType: 'Points', value: 150 },
        ],
    },
    [BadgeType.LIMIT_ORDER_PRO]: {
        name: 'The Operator',
        description: 'You bypassed the manual controls. Precision limit orders executed directly into the mainframe.',
        rarity: BadgeRarity.EPIC,
        image: '/nft-art/operator.png',
        attributes: [
            { traitType: 'Class', value: 'Hacker' },
            { traitType: 'Skill', value: 'Automation' },
            { traitType: 'Points', value: 300 },
        ],
    },
    [BadgeType.MOBILE_PIONEER]: {
        name: 'Mobile Pioneer',
        description: 'Completed your first action using Jupiter Mobile - the best gateway to on-chain',
        rarity: BadgeRarity.RARE,
        image: 'https://defi-quest-home.netlify.app/badges/mobile-pioneer.png',
        externalUrl: 'https://jup.ag/mobile',
        attributes: [
            { traitType: 'Category', value: 'Jupiter Mobile' },
            { traitType: 'Exclusive', value: 'Mobile Only' },
            { traitType: 'Difficulty', value: 'Easy' },
            { traitType: 'Points', value: 100 },
        ],
    },
    [BadgeType.MOBILE_WARRIOR]: {
        name: 'Mobile Warrior',
        description: 'Completed 10+ swaps through Jupiter Mobile. You play DeFi on the go.',
        rarity: BadgeRarity.EPIC,
        image: 'https://defi-quest-home.netlify.app/badges/mobile-warrior.png',
        externalUrl: 'https://jup.ag/mobile',
        attributes: [
            { traitType: 'Category', value: 'Jupiter Mobile' },
            { traitType: 'Exclusive', value: 'Mobile Only' },
            { traitType: 'Swaps Required', value: 10 },
            { traitType: 'Points', value: 300 },
        ],
    },
    [BadgeType.GATEWAY_MASTER]: {
        name: 'Gateway Master',
        description: 'Completed 50+ actions via Jupiter Mobile. The best gateway to on-chain is yours.',
        rarity: BadgeRarity.LEGENDARY,
        image: 'https://defi-quest-home.netlify.app/badges/gateway-master.png',
        externalUrl: 'https://jup.ag/mobile',
        attributes: [
            { traitType: 'Category', value: 'Jupiter Mobile' },
            { traitType: 'Exclusive', value: 'Mobile Only' },
            { traitType: 'Actions Required', value: 50 },
            { traitType: 'Points', value: 1000 },
        ],
    },
    [BadgeType.EARLY_ADOPTER]: {
        name: 'Early Adopter',
        description: 'Joined DeFi Quest during the launch phase',
        rarity: BadgeRarity.EPIC,
        image: 'https://defi-quest-home.netlify.app/badges/early-adopter.png',
        attributes: [
            { traitType: 'Category', value: 'Special' },
            { traitType: 'Edition', value: 'Limited' },
            { traitType: 'Points', value: 500 },
        ],
    },
    [BadgeType.HACKATHON_PARTICIPANT]: {
        name: 'Escape Simulation',
        description: 'Matrix Hackathon 2026 Survivor. You built the tools to break free.',
        rarity: BadgeRarity.LEGENDARY,
        image: '/nft-art/code-breaker.png',
        externalUrl: 'https://playsolana.com',
        attributes: [
            { traitType: 'Event', value: 'Matrix Hackathon' },
            { traitType: 'Role', value: 'Architect' },
            { traitType: 'Points', value: 1000 },
        ],
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get badge metadata by type
 */
export function getBadgeMetadata(type: BadgeType): BadgeMetadata {
    const definition = BADGE_DEFINITIONS[type];
    return {
        type,
        ...definition,
    };
}

/**
 * Get all badges of a specific rarity
 */
export function getBadgesByRarity(rarity: BadgeRarity): BadgeMetadata[] {
    return Object.entries(BADGE_DEFINITIONS)
        .filter(([_, def]) => def.rarity === rarity)
        .map(([type, def]) => ({
            type: type as BadgeType,
            ...def,
        }));
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: BadgeRarity): string {
    switch (rarity) {
        case BadgeRarity.COMMON:
            return '#888888';
        case BadgeRarity.RARE:
            return '#3b82f6';
        case BadgeRarity.EPIC:
            return '#a855f7';
        case BadgeRarity.LEGENDARY:
            return '#f59e0b';
    }
}

/**
 * Get rarity border gradient for UI
 */
export function getRarityGradient(rarity: BadgeRarity): string {
    switch (rarity) {
        case BadgeRarity.COMMON:
            return 'linear-gradient(135deg, #555555, #888888)';
        case BadgeRarity.RARE:
            return 'linear-gradient(135deg, #1d4ed8, #3b82f6)';
        case BadgeRarity.EPIC:
            return 'linear-gradient(135deg, #7c3aed, #a855f7)';
        case BadgeRarity.LEGENDARY:
            return 'linear-gradient(135deg, #d97706, #fbbf24)';
    }
}
