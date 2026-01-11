/**
 * DeFi Quest Engine - LocalStorage Adapter
 * Client-side persistence layer
 */

import {
    Mission,
    MissionProgress,
    UserStats,
    QuestEngineConfig,
} from '../missions/MissionTypes';
import { StreakData } from '../progress/StreakManager';
import { RewardCalculation } from '../rewards/RewardCalculator';
import { ProgressSnapshot } from '../progress/ProgressTracker';

const STORAGE_KEYS = {
    MISSIONS: 'defi_quest_missions',
    PROGRESS: 'defi_quest_progress',
    STREAKS: 'defi_quest_streaks',
    REWARDS: 'defi_quest_rewards',
    USER_STATS: 'defi_quest_user_stats',
    CONFIG: 'defi_quest_config',
    LAST_SYNC: 'defi_quest_last_sync',
} as const;

export interface StorageData {
    missions: Mission[];
    progress: Record<string, MissionProgress[]>;
    streaks: StreakData[];
    rewards: {
        claimedRewards: Record<string, RewardCalculation[]>;
        firstCompletions: string[];
    };
    userStats: Record<string, UserStats>;
    lastSync: number;
}

export class LocalStorageAdapter {
    private prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix;
    }

    /**
     * Get prefixed key
     */
    private getKey(key: string): string {
        return this.prefix ? `${this.prefix}_${key}` : key;
    }

    /**
     * Check if localStorage is available
     */
    isAvailable(): boolean {
        try {
            const test = '__storage_test__';
            window.localStorage.setItem(test, test);
            window.localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================================
    // Generic Operations
    // ============================================================================

    /**
     * Get item from storage
     */
    get<T>(key: string, defaultValue: T): T {
        if (!this.isAvailable()) return defaultValue;

        try {
            const item = window.localStorage.getItem(this.getKey(key));
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    /**
     * Set item in storage
     */
    set<T>(key: string, value: T): boolean {
        if (!this.isAvailable()) return false;

        try {
            window.localStorage.setItem(this.getKey(key), JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Remove item from storage
     */
    remove(key: string): boolean {
        if (!this.isAvailable()) return false;

        try {
            window.localStorage.removeItem(this.getKey(key));
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================================
    // Missions
    // ============================================================================

    /**
     * Get all stored missions
     */
    getMissions(): Mission[] {
        return this.get<Mission[]>(STORAGE_KEYS.MISSIONS, []);
    }

    /**
     * Save missions
     */
    saveMissions(missions: Mission[]): boolean {
        return this.set(STORAGE_KEYS.MISSIONS, missions);
    }

    /**
     * Add or update a mission
     */
    saveMission(mission: Mission): boolean {
        const missions = this.getMissions();
        const index = missions.findIndex((m) => m.id === mission.id);

        if (index >= 0) {
            missions[index] = mission;
        } else {
            missions.push(mission);
        }

        return this.saveMissions(missions);
    }

    // ============================================================================
    // Progress
    // ============================================================================

    /**
     * Get progress for all users
     */
    getAllProgress(): Record<string, MissionProgress[]> {
        return this.get<Record<string, MissionProgress[]>>(STORAGE_KEYS.PROGRESS, {});
    }

    /**
     * Get progress for a specific user
     */
    getUserProgress(walletAddress: string): MissionProgress[] {
        const allProgress = this.getAllProgress();
        return allProgress[walletAddress] || [];
    }

    /**
     * Save progress for a user
     */
    saveUserProgress(walletAddress: string, progress: MissionProgress[]): boolean {
        const allProgress = this.getAllProgress();
        allProgress[walletAddress] = progress;
        return this.set(STORAGE_KEYS.PROGRESS, allProgress);
    }

    /**
     * Save all progress
     */
    saveAllProgress(progress: Record<string, MissionProgress[]>): boolean {
        return this.set(STORAGE_KEYS.PROGRESS, progress);
    }

    // ============================================================================
    // Streaks
    // ============================================================================

    /**
     * Get all streak data
     */
    getStreaks(): StreakData[] {
        return this.get<StreakData[]>(STORAGE_KEYS.STREAKS, []);
    }

    /**
     * Save all streak data
     */
    saveStreaks(streaks: StreakData[]): boolean {
        return this.set(STORAGE_KEYS.STREAKS, streaks);
    }

    // ============================================================================
    // Rewards
    // ============================================================================

    /**
     * Get reward data
     */
    getRewards(): StorageData['rewards'] {
        return this.get<StorageData['rewards']>(STORAGE_KEYS.REWARDS, {
            claimedRewards: {},
            firstCompletions: [],
        });
    }

    /**
     * Save reward data
     */
    saveRewards(rewards: StorageData['rewards']): boolean {
        return this.set(STORAGE_KEYS.REWARDS, rewards);
    }

    // ============================================================================
    // User Stats
    // ============================================================================

    /**
     * Get all user stats
     */
    getAllUserStats(): Record<string, UserStats> {
        return this.get<Record<string, UserStats>>(STORAGE_KEYS.USER_STATS, {});
    }

    /**
     * Get stats for a specific user
     */
    getUserStats(walletAddress: string): UserStats | null {
        const allStats = this.getAllUserStats();
        return allStats[walletAddress] || null;
    }

    /**
     * Save stats for a user
     */
    saveUserStats(walletAddress: string, stats: UserStats): boolean {
        const allStats = this.getAllUserStats();
        allStats[walletAddress] = stats;
        return this.set(STORAGE_KEYS.USER_STATS, allStats);
    }

    // ============================================================================
    // Sync Management
    // ============================================================================

    /**
     * Get last sync timestamp
     */
    getLastSync(): number {
        return this.get<number>(STORAGE_KEYS.LAST_SYNC, 0);
    }

    /**
     * Update last sync timestamp
     */
    setLastSync(timestamp: number = Date.now()): boolean {
        return this.set(STORAGE_KEYS.LAST_SYNC, timestamp);
    }

    // ============================================================================
    // Bulk Operations
    // ============================================================================

    /**
     * Export all data
     */
    exportAll(): StorageData {
        return {
            missions: this.getMissions(),
            progress: this.getAllProgress(),
            streaks: this.getStreaks(),
            rewards: this.getRewards(),
            userStats: this.getAllUserStats(),
            lastSync: this.getLastSync(),
        };
    }

    /**
     * Import all data
     */
    importAll(data: Partial<StorageData>): boolean {
        let success = true;

        if (data.missions) {
            success = success && this.saveMissions(data.missions);
        }
        if (data.progress) {
            success = success && this.saveAllProgress(data.progress);
        }
        if (data.streaks) {
            success = success && this.saveStreaks(data.streaks);
        }
        if (data.rewards) {
            success = success && this.saveRewards(data.rewards);
        }
        if (data.userStats) {
            for (const [wallet, stats] of Object.entries(data.userStats)) {
                success = success && this.saveUserStats(wallet, stats);
            }
        }
        if (data.lastSync) {
            success = success && this.setLastSync(data.lastSync);
        }

        return success;
    }

    /**
     * Clear all stored data
     */
    clearAll(): void {
        for (const key of Object.values(STORAGE_KEYS)) {
            this.remove(key);
        }
    }

    /**
     * Get storage size in bytes
     */
    getStorageSize(): number {
        if (!this.isAvailable()) return 0;

        let size = 0;
        for (const key of Object.values(STORAGE_KEYS)) {
            const item = window.localStorage.getItem(this.getKey(key));
            if (item) {
                size += item.length * 2; // UTF-16 encoding
            }
        }
        return size;
    }
}

// Default instance - renamed to avoid shadowing global localStorage
export const localStorageAdapter = new LocalStorageAdapter('dqe');
