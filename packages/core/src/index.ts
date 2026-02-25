/**
 * DeFi Quest Engine - Core Package Entry Point
 * Exports all public APIs for the quest engine
 */

// ============================================================================
// Mission Types & Interfaces
// ============================================================================
// Enums (values)
export {
    MissionType,
    MissionStatus,
    ResetCycle,
    Difficulty,
    COMMON_TOKENS,
    DEFAULT_CONFIG,
} from './missions/MissionTypes';

// Types (type-only exports)
export type {
    TokenInfo,
    SwapRequirement,
    VolumeRequirement,
    StreakRequirement,
    PriceRequirement,
    RoutingRequirement,
    LimitOrderRequirement,
    DCARequirement,
    PredictionRequirement,
    StakingRequirement,
    MissionRequirement,
    Mission,
    MissionProgress,
    MissionReward,
    UserStats,
    MissionEvents,
    QuestEngineConfig,
    VerificationResult,
    ParsedSwapTransaction,
} from './missions/MissionTypes';

// ============================================================================
// Mission Engine
// ============================================================================
export { MissionEngine, missionEngine } from './missions/MissionEngine';
export { MissionVerifier } from './missions/MissionVerifier';
export {
    createSwapMission,
    createVolumeMission,
    createStreakMission,
    createLimitOrderMission,
    createDCAMission,
    createJupMission,
    SAMPLE_CAMPAIGN,
} from './missions/MissionTemplates';

// ============================================================================
// Progress Tracking
// ============================================================================
export { ProgressTracker, progressTracker } from './progress/ProgressTracker';
export type { ProgressSnapshot } from './progress/ProgressTracker';
export { StreakManager, streakManager } from './progress/StreakManager';
export type { StreakData, StreakEvents } from './progress/StreakManager';

// ============================================================================
// Rewards
// ============================================================================
export { RewardCalculator, rewardCalculator } from './rewards/RewardCalculator';
export type { RewardCalculation, RewardConfig } from './rewards/RewardCalculator';

// ============================================================================
// Storage
// ============================================================================
export { LocalStorageAdapter, localStorageAdapter } from './storage/LocalStorage';
export type { StorageData } from './storage/LocalStorage';

export { BackendSync } from './storage/BackendSync';
export type { SyncStatus, SyncOptions } from './storage/BackendSync';

// ============================================================================
// Jupiter Integration
// ============================================================================
export { WalletConnector } from './jupiter/WalletConnect';
export type { WalletInfo, WalletEvents, WalletConfig } from './jupiter/WalletConnect';

export { SwapVerifier } from './jupiter/SwapVerifier';
export type { SwapVerificationResult, PriceData } from './jupiter/SwapVerifier';

export { TransactionParser } from './jupiter/TransactionParser';
export type { TransactionFilter, TransactionPage } from './jupiter/TransactionParser';

// Jupiter Referral Program
export { ReferralManager, referralManager } from './jupiter/ReferralManager';
export type { ReferralConfig, ReferralStats } from './jupiter/ReferralManager';

// Jupiter Ultra Swap API
export { UltraSwapClient, ultraSwap } from './jupiter/UltraSwap';
export type {
    UltraSwapOrder,
    UltraRoutePlan,
    UltraExecuteResult,
    UltraOrderParams,
} from './jupiter/UltraSwap';

export { JupiterClient } from './jupiter/JupiterClient';

// Jupiter Mobile Adapter
export { JupiterMobileAdapter } from './jupiter/JupiterMobileAdapter';
export type {
    JupiterMobileConfig,
    MobileWalletState,
    JupiterMobileEvents,
} from './jupiter/JupiterMobileAdapter';

// ============================================================================
// Metaplex NFT Badge Integration
// ============================================================================
export {
    // Badge Collection
    // BadgeRarity, // Removed duplicate
    BadgeType,
    getBadgeMetadata,
    getBadgesByRarity,
    getRarityColor,
    getRarityGradient,
    DEFAULT_COLLECTION_CONFIG,
    BADGE_DEFINITIONS,
    // Badge Minter
    BadgeMinter,
    CoreBadgeMinter,
    missionToBadgeType,
    // Badge Display
    BadgeDisplay,
    badgeDisplay,
} from './metaplex';

export { CoreBadgeMinter as CoreMinter } from './metaplex/CoreBadgeMinter';

export type {
    BadgeMetadata,
    BadgeAttribute,
    BadgeCollectionConfig,
    BadgeMinterConfig,
    MintedBadge,
    BadgeMinterEvents,
    SignTransaction,
    DisplayBadge,
    BadgeGalleryData,
} from './metaplex';

// ============================================================================
// Main Quest Engine Class
// ============================================================================
import { EventEmitter } from 'eventemitter3';
import { MissionEngine } from './missions/MissionEngine';
import { StreakManager } from './progress/StreakManager';
import { RewardCalculator } from './rewards/RewardCalculator';
import { LocalStorageAdapter } from './storage/LocalStorage';
import { BackendSync } from './storage/BackendSync';
import { WalletConnector } from './jupiter/WalletConnect';
import { SwapVerifier } from './jupiter/SwapVerifier';
import { TransactionParser } from './jupiter/TransactionParser';
import {
    Mission,
    MissionProgress,
    MissionEvents,
    QuestEngineConfig,
    DEFAULT_CONFIG,
    ParsedSwapTransaction,
    UserStats,
} from './missions/MissionTypes';

export interface QuestEngineEvents extends MissionEvents {
    'engine:initialized': { config: QuestEngineConfig };
    'engine:error': { error: Error };
    'swap:detected': { swap: ParsedSwapTransaction };
}

/**
 * Main Quest Engine - Orchestrates all components
 */
export class QuestEngine extends EventEmitter<QuestEngineEvents> {
    private config: QuestEngineConfig;
    private missionEngine: MissionEngine;
    private streakManager: StreakManager;
    private rewardCalculator: RewardCalculator;
    private storage: LocalStorageAdapter;
    private backendSync: BackendSync;
    private wallet: WalletConnector;
    private swapVerifier: SwapVerifier | null = null;
    private transactionParser: TransactionParser | null = null;
    private swapWatcher: (() => void) | null = null;
    private initialized = false;

    constructor(config: Partial<QuestEngineConfig>) {
        super();

        // Merge with defaults
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        } as QuestEngineConfig;

        // Initialize components
        this.missionEngine = new MissionEngine();
        this.streakManager = new StreakManager(6); // 6 hour grace period
        this.rewardCalculator = new RewardCalculator();
        this.storage = new LocalStorageAdapter('dqe');
        this.backendSync = new BackendSync(this.storage);

        this.wallet = new WalletConnector({
            reownProjectId: this.config.reownProjectId,
            network: this.config.network || 'mainnet-beta',
            rpcUrl: this.config.solanaRpcUrl,
            appMetadata: this.config.appMetadata,
        });

        // Forward mission events
        this.forwardEvents();
    }

    /**
     * Initialize the quest engine
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Initialize wallet connector
            await this.wallet.initialize();

            // Initialize Supabase sync
            this.backendSync.initialize(this.config);

            // Load stored data
            this.loadStoredData();

            // Set up swap verification
            const connection = this.wallet.getConnection();
            if (connection) {
                this.swapVerifier = new SwapVerifier(connection);
                this.transactionParser = new TransactionParser(connection);
            }

            // Set up wallet event listeners
            this.setupWalletListeners();

            this.initialized = true;
            this.emit('engine:initialized', { config: this.config });
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Initialization failed');
            this.emit('engine:error', { error: err });
            throw err;
        }
    }

    /**
     * Load data from storage
     */
    private loadStoredData(): void {
        const data = this.storage.exportAll();

        // Import missions
        if (data.missions.length > 0) {
            this.missionEngine.importData({
                missions: data.missions,
                progress: data.progress,
            });
        }

        // Import streaks
        if (data.streaks.length > 0) {
            this.streakManager.importData(data.streaks);
        }

        // Import rewards
        if (data.rewards.claimedRewards) {
            this.rewardCalculator.importData(data.rewards);
        }
    }

    /**
     * Save data to storage
     */
    private saveData(): void {
        const missionData = this.missionEngine.exportData();

        this.storage.saveMissions(missionData.missions);
        this.storage.saveAllProgress(missionData.progress);
        this.storage.saveStreaks(this.streakManager.exportData());
        this.storage.saveRewards(this.rewardCalculator.exportData());
        this.storage.setLastSync();
    }

    /**
     * Forward events from sub-components
     */
    private forwardEvents(): void {
        // Forward mission events
        this.missionEngine.on('mission:started', (data) => this.emit('mission:started', data));
        this.missionEngine.on('mission:progress', (data) => this.emit('mission:progress', data));
        this.missionEngine.on('mission:completed', (data) => {
            this.saveData();
            this.emit('mission:completed', data);
        });
        this.missionEngine.on('mission:claimed', (data) => {
            this.saveData();
            this.emit('mission:claimed', data);
        });

        // Forward streak events
        this.streakManager.on('streak:incremented', (data) => this.emit('streak:updated', data));
        this.streakManager.on('streak:broken', (data) => this.emit('streak:broken', data));
    }

    /**
     * Set up wallet event listeners
     */
    private setupWalletListeners(): void {
        this.wallet.on('wallet:connected', ({ wallet }) => {
            this.backendSync.setWallet(wallet.address);
            this.startSwapWatcher(wallet.address);
            this.backendSync.startSync();
        });

        this.wallet.on('wallet:disconnected', () => {
            this.stopSwapWatcher();
            this.backendSync.stopSync();
            this.backendSync.setWallet(null);
        });

        this.wallet.on('wallet:accountChanged', ({ wallet }) => {
            this.stopSwapWatcher();
            this.backendSync.setWallet(wallet.address);
            this.startSwapWatcher(wallet.address);
        });
    }

    /**
     * Start watching for swaps
     */
    private startSwapWatcher(walletAddress: string): void {
        if (!this.swapVerifier) return;

        this.swapWatcher = this.swapVerifier.watchSwaps(
            walletAddress,
            async (swap) => {
                this.emit('swap:detected', { swap });
                await this.processSwap(swap);
            },
            { pollInterval: 10000 }
        );
    }

    /**
     * Stop watching for swaps
     */
    private stopSwapWatcher(): void {
        if (this.swapWatcher) {
            this.swapWatcher();
            this.swapWatcher = null;
        }
    }

    /**
     * Process a detected swap
     */
    private async processSwap(swap: ParsedSwapTransaction): Promise<void> {
        // Update streak
        this.streakManager.recordActivity(swap.walletAddress);

        // Process through mission engine
        await this.missionEngine.processTransaction(swap.walletAddress, swap);

        // Save data
        this.saveData();
    }

    // ============================================================================
    // Public API
    // ============================================================================

    /**
     * Connect wallet
     */
    async connectWallet(): Promise<WalletConnector['getWallet'] extends () => infer R ? R : never> {
        return this.wallet.connect();
    }

    /**
     * Disconnect wallet
     */
    async disconnectWallet(): Promise<void> {
        return this.wallet.disconnect();
    }

    /**
     * Get wallet info
     */
    getWallet() {
        return this.wallet.getWallet();
    }

    /**
     * Check if wallet is connected
     */
    isConnected(): boolean {
        return this.wallet.isConnected();
    }

    /**
     * Set external wallet info
     */
    setWallet(wallet: WalletInfo | null): void {
        this.wallet.setWallet(wallet);
    }

    /**
     * Register missions
     */
    registerMissions(missions: Mission[]): void {
        this.missionEngine.registerMissions(missions);
        this.saveData();
    }

    /**
     * Get all missions
     */
    getMissions(): Mission[] {
        return this.missionEngine.getAllMissions();
    }

    /**
     * Get active missions
     */
    getActiveMissions(): Mission[] {
        return this.missionEngine.getActiveMissions();
    }

    /**
     * Get user progress for all missions
     */
    getUserProgress(walletAddress?: string): MissionProgress[] {
        const address = walletAddress || this.wallet.getAddress();
        if (!address) return [];
        return this.missionEngine.getAllUserProgress(address);
    }

    /**
     * Start a mission for the connected user
     */
    startMission(missionId: string): MissionProgress | null {
        const address = this.wallet.getAddress();
        if (!address) return null;

        const progress = this.missionEngine.startMission(address, missionId);
        if (progress) this.saveData();
        return progress;
    }

    /**
     * Claim reward for a completed mission
     */
    claimReward(missionId: string) {
        const address = this.wallet.getAddress();
        if (!address) return null;

        const reward = this.missionEngine.claimReward(address, missionId);
        if (reward) this.saveData();
        return reward;
    }

    /**
     * Get user stats
     */
    getUserStats(walletAddress?: string): UserStats | null {
        const address = walletAddress || this.wallet.getAddress();
        if (!address) return null;
        return this.missionEngine.calculateUserStats(address);
    }

    /**
     * Get leaderboard
     */
    async getLeaderboard(limit: number = 10): Promise<UserStats[]> {
        // Try to get from backend first
        const backendLeaderboard = await this.backendSync.getLeaderboard(limit);
        if (backendLeaderboard.length > 0) {
            return backendLeaderboard;
        }

        // Fall back to local data
        return this.missionEngine.getLeaderboard(limit);
    }

    /**
     * Get streak data
     */
    getStreak(walletAddress?: string) {
        const address = walletAddress || this.wallet.getAddress();
        if (!address) return null;
        return this.streakManager.getStreak(address);
    }

    /**
     * Manually verify a swap transaction
     */
    async verifySwap(signature: string) {
        if (!this.swapVerifier) {
            throw new Error('Swap verifier not initialized');
        }
        return this.swapVerifier.verifySwap(signature);
    }

    /**
     * Get recent transactions
     */
    async getRecentTransactions(limit: number = 10) {
        const address = this.wallet.getAddress();
        if (!address || !this.transactionParser) return [];

        const result = await this.transactionParser.getRecentTransactions(address, limit);
        return result.transactions;
    }

    /**
     * Force sync with backend
     */
    async sync(): Promise<boolean> {
        return this.backendSync.sync();
    }

    /**
     * Get sync status
     */
    getSyncStatus() {
        return this.backendSync.getStatus();
    }

    /**
     * Export all data
     */
    exportData() {
        return this.storage.exportAll();
    }

    /**
     * Destroy the engine (cleanup)
     */
    destroy(): void {
        this.stopSwapWatcher();
        this.backendSync.stopSync();
        this.removeAllListeners();
    }
}

// Default export
export default QuestEngine;

// ============================================================================
// Anchor Program Client
// ============================================================================
export {
    AnchorQuestClient,
    QUEST_PROGRAM_ID,
    CONFIG_SEED,
    MISSION_SEED,
    PROGRESS_SEED,
    getConfigPda,
    getMissionPda,
    getProgressPda,
    anchorMissionToMission,
} from './anchor/AnchorClient';

export type {
    AnchorMission,
    AnchorUserProgress,
    MissionRequirementAnchor,
    MissionRewardAnchor,
} from './anchor/AnchorClient';
// ============================================================================
// Anchor Event Indexer
// ============================================================================
export {
    AnchorIndexer,
    createIndexer,
} from './anchor/Indexer';

export type {
    IndexerConfig,
    MissionEventData,
    ProgressEventData,
} from './anchor/Indexer';
// ============================================================================
// Quest Orchestrator - Main Integration
// ============================================================================
export {
    QuestOrchestrator,
    createOrchestrator,
} from './QuestOrchestrator';

export type {
    OrchestratorConfig,
    MissionRegistration,
    SwapWithProof,
    OrchestratorStats,
} from './QuestOrchestrator';

// ============================================================================
// NEW: Advanced Metaplex Features (Metaplex Track)
// ============================================================================

// Player Profile NFT
export {
    PlayerProfileNFT,
} from './metaplex/PlayerProfileNFT';


// Evolving Badge System v2
export {
    EvolvingBadgeSystem,
} from './metaplex/EvolvingBadgeSystem';


// Composable NFTs
export {
    ComposableNFTs,
    createComposableNFTs,
    CHARACTER_CLASSES,
    EQUIPMENT_SLOTS,
} from './metaplex/ComposableNFTs';

export type {
    CharacterClass,
    CharacterData,
    EquipmentData,
    EquipmentSlot,
    EquipmentStats,
    LoadoutData,
} from './metaplex/ComposableNFTs';


// DAS API Client
export {
    DASClient,
    createDASClient,
} from './metaplex/DASClient';

export type {
    DASAsset,
    DASResponse,
} from './metaplex/DASClient';


// Metaplex-Anchor Integrator
export {
    MetaplexAnchorIntegrator,
    createMetaplexAnchorIntegrator,
} from './metaplex/MetaplexAnchorIntegrator';

export type {
    MetaplexAnchorConfig,
    RewardClaimedEventData,
} from './metaplex/MetaplexAnchorIntegrator';


// ============================================================================
// Gamification Features
// ============================================================================

export {
    DoubleOrNothing,
    createDoubleOrNothing,
    MAX_DOUBLE_CHAIN,
    WIN_CHANCE,
} from './gamification/DoubleOrNothing';

export type {
    DoubleOrNothingResult,
    PlayerGambleStats,
} from './gamification/DoubleOrNothing';

export {
    BadgeForge,
    createBadgeForge,
    FORGE_RULES,
} from './gamification/BadgeForge';

export type {
    ForgeResultData,
} from './gamification/BadgeForge';

// ============================================================================
// Jupiter Oracle
// ============================================================================
export { PriceOracle } from './jupiter/PriceOracle';
