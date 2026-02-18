/**
 * DeFi Quest Engine - Metaplex Integration
 * Re-exports all Metaplex badge-related modules
 */

// Badge Collection (types, definitions, helpers)
export {
    BadgeRarity,
    BadgeType,
    getBadgeMetadata,
    getBadgesByRarity,
    getRarityColor,
    getRarityGradient,
    DEFAULT_COLLECTION_CONFIG,
    BADGE_DEFINITIONS,
} from './BadgeCollection';

export type {
    BadgeMetadata,
    BadgeAttribute,
    BadgeCollectionConfig,
} from './BadgeCollection';


// Badge Minter
export {
    BadgeMinter,
    missionToBadgeType,
} from './BadgeMinter';

export { CoreBadgeMinter } from './CoreBadgeMinter';

export type {
    BadgeMinterConfig,
    MintedBadge,
    BadgeMinterEvents,
    SignTransaction,
} from './BadgeMinter';


// Badge Display
export {
    BadgeDisplay,
    badgeDisplay,
} from './BadgeDisplay';

export type {
    DisplayBadge,
    BadgeGalleryData,
} from './BadgeDisplay';


// Evolving Badge System (Metaplex Track Requirement: "NFTs that evolve on-chain")
export {
    EvolvingBadge,
    createEvolvingBadge,
    previewEvolution,
    calculateRarity,
    calculateLevel,
    LEVEL_THRESHOLDS,
    XP_PER_LEVEL,
    RARITY_MULTIPLIERS,
} from './EvolvingBadge';

export type {
    BadgeRarity,
    BadgeState,
    EvolutionResult,
} from './EvolvingBadge';
