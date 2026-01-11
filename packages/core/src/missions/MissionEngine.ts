/**
 * DeFi Quest Engine - Mission Engine
 * Core mission management and verification logic
 */

import { EventEmitter } from 'eventemitter3';
import {
    Mission,
    MissionProgress,
    MissionStatus,
    MissionType,
    MissionEvents,
    MissionReward,
    ResetCycle,
    VerificationResult,
    ParsedSwapTransaction,
    UserStats,
} from './MissionTypes';
import { MissionVerifier } from './MissionVerifier';

export class MissionEngine extends EventEmitter<MissionEvents> {
    private missions: Map<string, Mission> = new Map();
    private userProgress: Map<string, Map<string, MissionProgress>> = new Map();
    private verifier: MissionVerifier;

    constructor() {
        super();
        this.verifier = new MissionVerifier();
    }

    // ============================================================================
    // Mission Management
    // ============================================================================

    /**
     * Register a new mission
     */
    registerMission(mission: Mission): void {
        if (this.missions.has(mission.id)) {
            throw new Error(`Mission with ID ${mission.id} already exists`);
        }
        this.missions.set(mission.id, {
            ...mission,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * Register multiple missions at once
     */
    registerMissions(missions: Mission[]): void {
        for (const mission of missions) {
            this.registerMission(mission);
        }
    }

    /**
     * Get a mission by ID
     */
    getMission(missionId: string): Mission | undefined {
        return this.missions.get(missionId);
    }

    /**
     * Get all registered missions
     */
    getAllMissions(): Mission[] {
        return Array.from(this.missions.values());
    }

    /**
     * Get active missions (not expired, is active)
     */
    getActiveMissions(): Mission[] {
        const now = new Date();
        return this.getAllMissions().filter((m) => {
            if (!m.isActive) return false;
            if (m.endDate && m.endDate < now) return false;
            if (m.startDate && m.startDate > now) return false;
            return true;
        });
    }

    /**
     * Get missions by type
     */
    getMissionsByType(type: MissionType): Mission[] {
        return this.getAllMissions().filter((m) => m.type === type);
    }

    /**
     * Update a mission
     */
    updateMission(missionId: string, updates: Partial<Mission>): Mission | null {
        const mission = this.missions.get(missionId);
        if (!mission) return null;

        const updatedMission = {
            ...mission,
            ...updates,
            id: mission.id, // Prevent ID changes
            updatedAt: new Date(),
        };

        this.missions.set(missionId, updatedMission);
        return updatedMission;
    }

    /**
     * Deactivate a mission
     */
    deactivateMission(missionId: string): boolean {
        const mission = this.missions.get(missionId);
        if (!mission) return false;
        mission.isActive = false;
        mission.updatedAt = new Date();
        return true;
    }

    // ============================================================================
    // Progress Management
    // ============================================================================

    /**
     * Get user progress for a specific mission
     */
    getUserProgress(walletAddress: string, missionId: string): MissionProgress | undefined {
        return this.userProgress.get(walletAddress)?.get(missionId);
    }

    /**
     * Get all progress for a user
     */
    getAllUserProgress(walletAddress: string): MissionProgress[] {
        const progressMap = this.userProgress.get(walletAddress);
        if (!progressMap) return [];
        return Array.from(progressMap.values());
    }

    /**
     * Initialize progress for a user on a mission
     */
    startMission(walletAddress: string, missionId: string): MissionProgress | null {
        const mission = this.missions.get(missionId);
        if (!mission) return null;

        // Check prerequisites
        if (mission.prerequisites?.length) {
            for (const prereqId of mission.prerequisites) {
                const prereqProgress = this.getUserProgress(walletAddress, prereqId);
                if (!prereqProgress || prereqProgress.status !== MissionStatus.COMPLETED) {
                    return null; // Prerequisites not met
                }
            }
        }

        // Check if already started
        let userProgressMap = this.userProgress.get(walletAddress);
        if (!userProgressMap) {
            userProgressMap = new Map();
            this.userProgress.set(walletAddress, userProgressMap);
        }

        if (userProgressMap.has(missionId)) {
            return userProgressMap.get(missionId)!;
        }

        // Calculate target value based on mission type
        const targetValue = this.calculateTargetValue(mission);

        const progress: MissionProgress = {
            missionId,
            walletAddress,
            currentValue: 0,
            targetValue,
            progressPercent: 0,
            status: MissionStatus.IN_PROGRESS,
            startedAt: new Date(),
            relatedTransactions: [],
        };

        userProgressMap.set(missionId, progress);

        this.emit('mission:started', { mission, walletAddress });

        return progress;
    }

    /**
     * Calculate target value for a mission
     */
    private calculateTargetValue(mission: Mission): number {
        switch (mission.requirement.type) {
            case 'swap':
                return mission.requirement.minInputAmount || 1;
            case 'volume':
                return mission.requirement.minVolumeUsd;
            case 'streak':
                return mission.requirement.requiredDays;
            case 'price':
                return mission.requirement.minAmount || 1;
            case 'routing':
                return 1; // Binary completion
            default:
                return 1;
        }
    }

    // ============================================================================
    // Transaction Verification
    // ============================================================================

    /**
     * Process a swap transaction and update relevant mission progress
     */
    async processTransaction(
        walletAddress: string,
        transaction: ParsedSwapTransaction
    ): Promise<VerificationResult[]> {
        const results: VerificationResult[] = [];
        const activeProgress = this.getAllUserProgress(walletAddress).filter(
            (p) => p.status === MissionStatus.IN_PROGRESS
        );

        for (const progress of activeProgress) {
            const mission = this.missions.get(progress.missionId);
            if (!mission) continue;

            const result = this.verifier.verify(mission, progress, transaction);

            if (result.success && result.progressDelta) {
                // Update progress
                progress.currentValue += result.progressDelta;
                progress.progressPercent = Math.min(
                    100,
                    (progress.currentValue / progress.targetValue) * 100
                );
                progress.relatedTransactions.push(transaction.signature);
                progress.lastActivityDate = new Date();

                // Check completion
                if (progress.currentValue >= progress.targetValue) {
                    progress.status = MissionStatus.COMPLETED;
                    progress.completedAt = new Date();
                    this.emit('mission:completed', { mission, progress });
                } else {
                    this.emit('mission:progress', { mission, progress });
                }
            }

            results.push(result);
        }

        return results;
    }

    /**
     * Claim rewards for a completed mission
     */
    claimReward(walletAddress: string, missionId: string): MissionReward | null {
        const progress = this.getUserProgress(walletAddress, missionId);
        if (!progress || progress.status !== MissionStatus.COMPLETED) {
            return null;
        }

        const mission = this.missions.get(missionId);
        if (!mission) return null;

        progress.status = MissionStatus.CLAIMED;
        progress.claimedAt = new Date();

        this.emit('mission:claimed', { mission, reward: mission.reward });

        return mission.reward;
    }

    // ============================================================================
    // Reset Cycle Management
    // ============================================================================

    /**
     * Check and reset missions based on their cycle
     */
    processResets(): void {
        const now = new Date();

        for (const [walletAddress, progressMap] of this.userProgress) {
            for (const [missionId, progress] of progressMap) {
                const mission = this.missions.get(missionId);
                if (!mission || mission.resetCycle === ResetCycle.NONE) continue;

                if (this.shouldReset(mission, progress, now)) {
                    // Reset progress but keep historical data
                    progress.currentValue = 0;
                    progress.progressPercent = 0;
                    progress.status = MissionStatus.ACTIVE;
                    progress.startedAt = now;
                    progress.completedAt = undefined;
                    progress.claimedAt = undefined;
                    progress.relatedTransactions = [];
                }
            }
        }
    }

    /**
     * Determine if a mission should reset
     */
    private shouldReset(mission: Mission, progress: MissionProgress, now: Date): boolean {
        if (!progress.startedAt) return false;

        const startedAt = new Date(progress.startedAt);

        switch (mission.resetCycle) {
            case ResetCycle.DAILY:
                return this.isDifferentDay(startedAt, now);
            case ResetCycle.WEEKLY:
                return this.isDifferentWeek(startedAt, now);
            case ResetCycle.MONTHLY:
                return this.isDifferentMonth(startedAt, now);
            default:
                return false;
        }
    }

    private isDifferentDay(a: Date, b: Date): boolean {
        return a.toDateString() !== b.toDateString();
    }

    private isDifferentWeek(a: Date, b: Date): boolean {
        const weekA = this.getWeekNumber(a);
        const weekB = this.getWeekNumber(b);
        return weekA !== weekB || a.getFullYear() !== b.getFullYear();
    }

    private isDifferentMonth(a: Date, b: Date): boolean {
        return a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear();
    }

    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000);
        return Math.ceil((days + firstDayOfYear.getDay() + 1) / 7);
    }

    // ============================================================================
    // Statistics
    // ============================================================================

    /**
     * Calculate user statistics
     */
    calculateUserStats(walletAddress: string): UserStats {
        const allProgress = this.getAllUserProgress(walletAddress);

        const completedMissions = allProgress.filter(
            (p) => p.status === MissionStatus.COMPLETED || p.status === MissionStatus.CLAIMED
        );

        let totalPoints = 0;
        const achievements: string[] = [];

        for (const progress of completedMissions) {
            const mission = this.missions.get(progress.missionId);
            if (mission) {
                totalPoints += mission.reward.points * (mission.reward.multiplier || 1);
                if (mission.reward.achievementId) {
                    achievements.push(mission.reward.achievementId);
                }
            }
        }

        // Calculate streaks
        const streakProgress = allProgress.filter((p) => {
            const mission = this.missions.get(p.missionId);
            return mission?.type === MissionType.STREAK;
        });

        const longestStreak = Math.max(0, ...streakProgress.map((p) => p.streakDays || 0));
        const currentStreak = streakProgress.find((p) => !p.streakBroken)?.streakDays || 0;

        return {
            walletAddress,
            totalPoints,
            totalMissionsCompleted: completedMissions.length,
            totalVolumeUsd: 0, // Would need transaction history
            longestStreak,
            currentStreak,
            achievements: [...new Set(achievements)],
            joinedAt: allProgress[0]?.startedAt || new Date(),
            lastActiveAt: new Date(),
        };
    }

    /**
     * Get leaderboard data
     */
    getLeaderboard(limit: number = 10): UserStats[] {
        const allUsers = Array.from(this.userProgress.keys());
        const stats = allUsers.map((wallet) => this.calculateUserStats(wallet));

        return stats
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .slice(0, limit)
            .map((s, i) => ({ ...s, rank: i + 1 }));
    }

    // ============================================================================
    // Serialization
    // ============================================================================

    /**
     * Export all data for storage
     */
    exportData(): {
        missions: Mission[];
        progress: Record<string, MissionProgress[]>;
    } {
        const progress: Record<string, MissionProgress[]> = {};

        for (const [wallet, progressMap] of this.userProgress) {
            progress[wallet] = Array.from(progressMap.values());
        }

        return {
            missions: this.getAllMissions(),
            progress,
        };
    }

    /**
     * Import data from storage
     */
    importData(data: {
        missions: Mission[];
        progress: Record<string, MissionProgress[]>;
    }): void {
        // Import missions
        for (const mission of data.missions) {
            this.missions.set(mission.id, mission);
        }

        // Import progress
        for (const [wallet, progressList] of Object.entries(data.progress)) {
            const progressMap = new Map<string, MissionProgress>();
            for (const progress of progressList) {
                progressMap.set(progress.missionId, progress);
            }
            this.userProgress.set(wallet, progressMap);
        }
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.missions.clear();
        this.userProgress.clear();
    }
}

// Export singleton instance
export const missionEngine = new MissionEngine();
