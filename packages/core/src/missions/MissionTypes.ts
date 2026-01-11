/**
 * DeFi Quest Engine - Mission Types
 * Comprehensive type definitions for all mission types
 */

// ============================================================================
// Core Enums
// ============================================================================

/** Types of missions supported by the engine */
export enum MissionType {
    SWAP = 'swap',
    VOLUME = 'volume',
    STREAK = 'streak',
    PRICE = 'price',
    ROUTING = 'routing',
    LIMIT_ORDER = 'limit_order',  // Jupiter Trigger API
    DCA = 'dca',                  // Jupiter Recurring API
}

/** Mission status states */
export enum MissionStatus {
    LOCKED = 'locked',
    ACTIVE = 'active',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CLAIMED = 'claimed',
    EXPIRED = 'expired',
}

/** Reset cycle for recurring missions */
export enum ResetCycle {
    NONE = 'none',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
}

/** Difficulty levels for UI display */
export enum Difficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
    LEGENDARY = 'legendary',
}

// ============================================================================
// Token & Swap Types
// ============================================================================

/** Token reference for swap missions */
export interface TokenInfo {
    mint: string;
    symbol: string;
    decimals: number;
    name?: string;
    logoUri?: string;
}

/** Common Solana token mints for convenience */
export const COMMON_TOKENS = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
} as const;

// ============================================================================
// Mission Requirement Types
// ============================================================================

/** Requirements for swap missions */
export interface SwapRequirement {
    type: 'swap';
    inputToken?: TokenInfo;
    outputToken?: TokenInfo;
    minInputAmount?: number;  // In token units (not lamports)
    minOutputAmount?: number;
    exactMatch?: boolean;     // If true, requires exact token pair
}

/** Requirements for volume missions */
export interface VolumeRequirement {
    type: 'volume';
    minVolumeUsd: number;
    tokenFilter?: string[];   // Optional: only count volume for these tokens
    timeWindowHours?: number; // Optional: volume within this window
}

/** Requirements for streak missions */
export interface StreakRequirement {
    type: 'streak';
    requiredDays: number;
    actionType: 'swap' | 'any';
    minActionValue?: number;  // Min USD value per action
    gracePeriodHours?: number; // Allow late completion within grace period
}

/** Requirements for price-based missions */
export interface PriceRequirement {
    type: 'price';
    token: TokenInfo;
    condition: 'above' | 'below';
    targetPrice: number;      // USD price
    action: 'buy' | 'sell';
    minAmount?: number;
}

/** Requirements for routing missions */
export interface RoutingRequirement {
    type: 'routing';
    routeType: 'best' | 'direct' | 'multi-hop';
    minHops?: number;
    maxSlippage?: number;     // Percentage
    usedDexes?: string[];     // Required DEXes in route
}

/** Requirements for limit order missions (Jupiter Trigger API) */
export interface LimitOrderRequirement {
    type: 'limit_order';
    inputToken?: TokenInfo;
    outputToken?: TokenInfo;
    minOrdersCreated?: number;  // Number of limit orders to create
    minOrdersExecuted?: number; // Number of orders that successfully executed
    minOrderValueUsd?: number;  // Minimum value per order
}

/** Requirements for DCA missions (Jupiter Recurring API) */
export interface DCARequirement {
    type: 'dca';
    inputToken?: TokenInfo;
    outputToken?: TokenInfo;
    minPositionsCreated?: number; // Number of DCA positions to set up
    minCyclesCompleted?: number;  // Number of DCA cycles completed
    minTotalValueUsd?: number;    // Total value across all DCA orders
    minDurationDays?: number;     // Minimum DCA duration
}

/** Union type for all requirements */
export type MissionRequirement =
    | SwapRequirement
    | VolumeRequirement
    | StreakRequirement
    | PriceRequirement
    | RoutingRequirement
    | LimitOrderRequirement
    | DCARequirement;

// ============================================================================
// Reward Types
// ============================================================================

/** Reward configuration for a mission */
export interface MissionReward {
    points: number;
    multiplier?: number;      // Bonus multiplier (e.g., 1.5x for first completion)
    tokenReward?: {
        token: TokenInfo;
        amount: number;
    };
    achievementId?: string;   // Achievement to unlock
    nftMetadata?: {           // Optional NFT reward
        name: string;
        description: string;
        image: string;
    };
}

// ============================================================================
// Mission Definition
// ============================================================================

/** Complete mission definition */
export interface Mission {
    id: string;
    name: string;
    description: string;
    type: MissionType;
    status: MissionStatus;
    difficulty: Difficulty;

    // Requirements
    requirement: MissionRequirement;

    // Rewards
    reward: MissionReward;

    // Timing
    resetCycle: ResetCycle;
    startDate?: Date;
    endDate?: Date;

    // UI
    icon?: string;
    category?: string;
    order?: number;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    isActive: boolean;

    // Prerequisites
    prerequisites?: string[]; // IDs of missions that must be completed first
}

// ============================================================================
// Progress Types
// ============================================================================

/** Progress tracking for a user on a mission */
export interface MissionProgress {
    missionId: string;
    walletAddress: string;

    // Progress
    currentValue: number;
    targetValue: number;
    progressPercent: number;

    // Streak-specific
    streakDays?: number;
    lastActivityDate?: Date;
    streakBroken?: boolean;

    // Status
    status: MissionStatus;
    startedAt: Date;
    completedAt?: Date;
    claimedAt?: Date;

    // Transactions
    relatedTransactions: string[]; // Transaction signatures
}

/** User statistics aggregate */
export interface UserStats {
    walletAddress: string;
    totalPoints: number;
    totalMissionsCompleted: number;
    totalVolumeUsd: number;
    longestStreak: number;
    currentStreak: number;
    rank?: number;
    achievements: string[];
    joinedAt: Date;
    lastActiveAt: Date;
}

// ============================================================================
// Event Types
// ============================================================================

/** Events emitted by the mission engine */
export interface MissionEvents {
    'mission:started': { mission: Mission; walletAddress: string };
    'mission:progress': { mission: Mission; progress: MissionProgress };
    'mission:completed': { mission: Mission; progress: MissionProgress };
    'mission:claimed': { mission: Mission; reward: MissionReward };
    'streak:updated': { walletAddress: string; streakDays: number };
    'streak:broken': { walletAddress: string; previousStreak: number };
    'leaderboard:updated': { topUsers: UserStats[] };
}

// ============================================================================
// Configuration Types
// ============================================================================

/** Quest Engine configuration */
export interface QuestEngineConfig {
    // API Configuration
    jupiterApiUrl?: string;
    solanaRpcUrl?: string;

    // Supabase
    supabaseUrl: string;
    supabaseKey: string;

    // Reown/WalletConnect
    reownProjectId: string;
    appMetadata?: {
        name: string;
        description: string;
        url: string;
        icons: string[];
    };

    // Storage
    useLocalStorage?: boolean;
    syncInterval?: number; // Milliseconds

    // Features
    enableNotifications?: boolean;
    enableLeaderboard?: boolean;

    // Network
    network?: 'mainnet-beta' | 'devnet' | 'testnet';
}

/** Default configuration values */
export const DEFAULT_CONFIG: Partial<QuestEngineConfig> = {
    jupiterApiUrl: 'https://quote-api.jup.ag/v6',
    solanaRpcUrl: 'https://api.devnet.solana.com',
    useLocalStorage: true,
    syncInterval: 30000, // 30 seconds
    enableNotifications: true,
    enableLeaderboard: true,
    network: 'devnet',
};

// ============================================================================
// Verification Types
// ============================================================================

/** Result of transaction verification */
export interface VerificationResult {
    success: boolean;
    missionId: string;
    transactionSignature?: string;
    progressDelta?: number;
    error?: string;
    timestamp: Date;
}

/** Parsed swap transaction data */
export interface ParsedSwapTransaction {
    signature: string;
    timestamp: Date;
    walletAddress: string;
    inputToken: TokenInfo;
    outputToken: TokenInfo;
    inputAmount: number;
    outputAmount: number;
    inputAmountUsd: number;
    outputAmountUsd: number;
    route: {
        dexes: string[];
        hops: number;
        slippage: number;
    };
    fee: number;
    success: boolean;
}
