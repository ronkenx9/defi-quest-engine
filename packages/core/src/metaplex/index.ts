/**
 * DeFi Quest Engine - Metaplex Integration
 * Re-exports all Metaplex badge-related modules
 */

// Badge Collection (types, definitions, helpers)
export {
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


// Evolving Badge System (Metaplex Track Requirement: NFTs that evolve on-chain)
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
    EvolvingBadgeRarity,
    BadgeState,
    EvolutionResult,
} from './EvolvingBadge';


// NEW: Player Profile NFT
export {
    PlayerProfileNFT,
} from './PlayerProfileNFT';

// NEW: Authority Keypair Utility
export {
    getAuthorityKeypairBytes,
    attachAuthorityToUmi,
    createAuthorizedUmi,
} from './createAuthorityFromEnv';


// NEW: Evolving Badge System (v2)
export {
    EvolvingBadgeSystem,
} from './EvolvingBadgeSystem';


// NEW: Composable NFTs
export {
    ComposableNFTs,
    createComposableNFTs,
    CHARACTER_CLASSES,
    EQUIPMENT_SLOTS,
} from './ComposableNFTs';

export type {
    CharacterClass,
    CharacterData,
    EquipmentData,
    EquipmentSlot,
    EquipmentStats,
    LoadoutData,
} from './ComposableNFTs';


// NEW: DAS API Client
export {
    DASClient,
    createDASClient,
} from './DASClient';

export type {
    DASAsset,
    DASResponse,
} from './DASClient';


// Metaplex-Anchor Integrator
export {
    MetaplexAnchorIntegrator,
    createMetaplexAnchorIntegrator,
} from './MetaplexAnchorIntegrator';

export type {
    MetaplexAnchorConfig,
    RewardClaimedEventData,
} from './MetaplexAnchorIntegrator';
