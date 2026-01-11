/**
 * DeFi Quest Engine - Backend Sync (Supabase)
 * Synchronizes local data with Supabase backend
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    Mission,
    MissionProgress,
    UserStats,
    QuestEngineConfig,
} from '../missions/MissionTypes';
import { StreakData } from '../progress/StreakManager';
import { RewardCalculation } from '../rewards/RewardCalculator';
import { LocalStorageAdapter, StorageData } from './LocalStorage';

export interface SyncStatus {
    lastSync: Date | null;
    isSyncing: boolean;
    lastError: string | null;
    pendingChanges: number;
}

export interface SyncOptions {
    syncInterval: number;  // ms between syncs
    conflictResolution: 'local' | 'remote' | 'merge';
    retryAttempts: number;
}

const DEFAULT_SYNC_OPTIONS: SyncOptions = {
    syncInterval: 30000,  // 30 seconds
    conflictResolution: 'merge',
    retryAttempts: 3,
};

export class BackendSync {
    private supabase: SupabaseClient | null = null;
    private localStorage: LocalStorageAdapter;
    private options: SyncOptions;
    private status: SyncStatus = {
        lastSync: null,
        isSyncing: false,
        lastError: null,
        pendingChanges: 0,
    };
    private syncTimer: NodeJS.Timeout | null = null;
    private walletAddress: string | null = null;

    constructor(
        localStorage: LocalStorageAdapter,
        options: Partial<SyncOptions> = {}
    ) {
        this.localStorage = localStorage;
        this.options = { ...DEFAULT_SYNC_OPTIONS, ...options };
    }

    /**
     * Initialize Supabase connection
     */
    initialize(config: QuestEngineConfig): void {
        if (!config.supabaseUrl || !config.supabaseKey) {
            console.warn('BackendSync: Supabase credentials not provided');
            return;
        }

        this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    }

    /**
     * Set the current wallet address for syncing
     */
    setWallet(walletAddress: string | null): void {
        this.walletAddress = walletAddress;
    }

    /**
     * Start automatic sync
     */
    startSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            this.sync().catch(console.error);
        }, this.options.syncInterval);

        // Initial sync
        this.sync().catch(console.error);
    }

    /**
     * Stop automatic sync
     */
    stopSync(): void {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
    }

    /**
     * Get current sync status
     */
    getStatus(): SyncStatus {
        return { ...this.status };
    }

    /**
     * Perform sync operation
     */
    async sync(): Promise<boolean> {
        if (!this.supabase || !this.walletAddress) {
            return false;
        }

        if (this.status.isSyncing) {
            return false;
        }

        this.status.isSyncing = true;
        this.status.lastError = null;

        try {
            // 1. Push local changes
            await this.pushProgress();
            await this.pushStreaks();
            await this.pushUserStats();

            // 2. Pull remote data
            await this.pullMissions();
            await this.pullLeaderboard();

            this.status.lastSync = new Date();
            this.status.pendingChanges = 0;
            return true;
        } catch (error) {
            this.status.lastError = error instanceof Error ? error.message : 'Sync failed';
            console.error('Sync error:', error);
            return false;
        } finally {
            this.status.isSyncing = false;
        }
    }

    // ============================================================================
    // Push Operations
    // ============================================================================

    /**
     * Push local progress to backend
     */
    private async pushProgress(): Promise<void> {
        if (!this.supabase || !this.walletAddress) return;

        const progress = this.localStorage.getUserProgress(this.walletAddress);

        for (const p of progress) {
            await this.supabase
                .from('mission_progress')
                .upsert({
                    wallet_address: p.walletAddress,
                    mission_id: p.missionId,
                    current_value: p.currentValue,
                    target_value: p.targetValue,
                    progress_percent: p.progressPercent,
                    status: p.status,
                    started_at: p.startedAt,
                    completed_at: p.completedAt,
                    claimed_at: p.claimedAt,
                    streak_days: p.streakDays,
                    last_activity_date: p.lastActivityDate,
                    related_transactions: p.relatedTransactions,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'wallet_address,mission_id',
                });
        }
    }

    /**
     * Push streak data to backend
     */
    private async pushStreaks(): Promise<void> {
        if (!this.supabase || !this.walletAddress) return;

        const streaks = this.localStorage.getStreaks()
            .filter(s => s.walletAddress === this.walletAddress);

        for (const streak of streaks) {
            await this.supabase
                .from('streaks')
                .upsert({
                    wallet_address: streak.walletAddress,
                    current_streak: streak.currentStreak,
                    longest_streak: streak.longestStreak,
                    last_activity_date: streak.lastActivityDate,
                    streak_start_date: streak.streakStartDate,
                    total_active_days: streak.totalActiveDays,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'wallet_address',
                });
        }
    }

    /**
     * Push user stats to backend
     */
    private async pushUserStats(): Promise<void> {
        if (!this.supabase || !this.walletAddress) return;

        const stats = this.localStorage.getUserStats(this.walletAddress);
        if (!stats) return;

        await this.supabase
            .from('user_stats')
            .upsert({
                wallet_address: stats.walletAddress,
                total_points: stats.totalPoints,
                total_missions_completed: stats.totalMissionsCompleted,
                total_volume_usd: stats.totalVolumeUsd,
                longest_streak: stats.longestStreak,
                current_streak: stats.currentStreak,
                achievements: stats.achievements,
                joined_at: stats.joinedAt,
                last_active_at: new Date().toISOString(),
            }, {
                onConflict: 'wallet_address',
            });
    }

    // ============================================================================
    // Pull Operations
    // ============================================================================

    /**
     * Pull missions from backend
     */
    private async pullMissions(): Promise<void> {
        if (!this.supabase) return;

        const { data, error } = await this.supabase
            .from('missions')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        if (data && data.length > 0) {
            const missions: Mission[] = data.map(this.mapRemoteMission);
            this.localStorage.saveMissions(missions);
        }
    }

    /**
     * Pull leaderboard data
     */
    private async pullLeaderboard(): Promise<UserStats[]> {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('user_stats')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(100);

        if (error) throw error;

        return data?.map(this.mapRemoteUserStats) || [];
    }

    // ============================================================================
    // Public Query Methods
    // ============================================================================

    /**
     * Get leaderboard from backend
     */
    async getLeaderboard(limit: number = 10): Promise<UserStats[]> {
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from('user_stats')
            .select('*')
            .order('total_points', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Failed to fetch leaderboard:', error);
            return [];
        }

        return data?.map((d, i) => ({
            ...this.mapRemoteUserStats(d),
            rank: i + 1,
        })) || [];
    }

    /**
     * Get user rank
     */
    async getUserRank(walletAddress: string): Promise<number | null> {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .rpc('get_user_rank', { wallet: walletAddress });

        if (error) {
            console.error('Failed to get user rank:', error);
            return null;
        }

        return data;
    }

    /**
     * Get global analytics
     */
    async getAnalytics(): Promise<{
        totalUsers: number;
        totalMissionsCompleted: number;
        totalPoints: number;
        averageStreak: number;
    } | null> {
        if (!this.supabase) return null;

        const { data, error } = await this.supabase
            .from('user_stats')
            .select('wallet_address, total_missions_completed, total_points, current_streak');

        if (error) {
            console.error('Failed to get analytics:', error);
            return null;
        }

        if (!data || data.length === 0) {
            return {
                totalUsers: 0,
                totalMissionsCompleted: 0,
                totalPoints: 0,
                averageStreak: 0,
            };
        }

        const totalMissionsCompleted = data.reduce((sum, d) => sum + (d.total_missions_completed || 0), 0);
        const totalPoints = data.reduce((sum, d) => sum + (d.total_points || 0), 0);
        const averageStreak = data.reduce((sum, d) => sum + (d.current_streak || 0), 0) / data.length;

        return {
            totalUsers: data.length,
            totalMissionsCompleted,
            totalPoints,
            averageStreak,
        };
    }

    // ============================================================================
    // Mapping Functions
    // ============================================================================

    /* eslint-disable @typescript-eslint/no-explicit-any */
    private mapRemoteMission(row: any): Mission {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            type: row.type,
            status: row.status,
            difficulty: row.difficulty,
            requirement: row.requirement,
            reward: row.reward,
            resetCycle: row.reset_cycle,
            startDate: row.start_date ? new Date(row.start_date) : undefined,
            endDate: row.end_date ? new Date(row.end_date) : undefined,
            icon: row.icon,
            category: row.category,
            order: row.order,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by,
            isActive: row.is_active,
            prerequisites: row.prerequisites,
        };
    }

    private mapRemoteUserStats(row: any): UserStats {
        return {
            walletAddress: row.wallet_address,
            totalPoints: row.total_points || 0,
            totalMissionsCompleted: row.total_missions_completed || 0,
            totalVolumeUsd: row.total_volume_usd || 0,
            longestStreak: row.longest_streak || 0,
            currentStreak: row.current_streak || 0,
            achievements: row.achievements || [],
            joinedAt: new Date(row.joined_at || Date.now()),
            lastActiveAt: new Date(row.last_active_at || Date.now()),
        };
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
}
