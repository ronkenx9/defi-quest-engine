/**
 * DeFi Quest Engine - Reward Calculator
 * Calculates and tracks rewards for mission completion
 */

import {
    Mission,
    MissionProgress,
    MissionReward,
    MissionStatus,
    UserStats,
} from '../missions/MissionTypes';

export interface RewardCalculation {
    basePoints: number;
    multiplier: number;
    bonusPoints: number;
    totalPoints: number;
    tokenReward?: {
        mint: string;
        symbol: string;
        amount: number;
    };
    achievementUnlocked?: string;
}

export interface RewardConfig {
    // Global multipliers
    streakMultiplier: number;        // Bonus per streak day (e.g., 0.01 = 1% per day)
    maxStreakBonus: number;          // Maximum streak bonus (e.g., 0.5 = 50%)
    firstCompletionBonus: number;    // Bonus for first-time completion
    speedBonus: {                    // Bonus for fast completion
        enabled: boolean;
        thresholdMinutes: number;
        bonusPercent: number;
    };
    // Referral bonuses
    referralBonus: number;           // Points for referred user's first completion
    referrerBonus: number;           // Points for referring user
}

const DEFAULT_REWARD_CONFIG: RewardConfig = {
    streakMultiplier: 0.05,          // 5% per streak day
    maxStreakBonus: 0.5,             // 50% max
    firstCompletionBonus: 0.25,      // 25% bonus
    speedBonus: {
        enabled: true,
        thresholdMinutes: 60,
        bonusPercent: 0.1,             // 10% for fast completion
    },
    referralBonus: 50,
    referrerBonus: 100,
};

export class RewardCalculator {
    private config: RewardConfig;
    private claimedRewards: Map<string, RewardCalculation[]> = new Map();
    private firstCompletions: Set<string> = new Set(); // missionId:walletAddress

    constructor(config: Partial<RewardConfig> = {}) {
        this.config = { ...DEFAULT_REWARD_CONFIG, ...config };
    }

    /**
     * Calculate reward for a completed mission
     */
    calculateReward(
        mission: Mission,
        progress: MissionProgress,
        userStats: UserStats
    ): RewardCalculation {
        const basePoints = mission.reward.points;
        let multiplier = mission.reward.multiplier || 1;
        let bonusPoints = 0;

        // First completion bonus
        const completionKey = `${mission.id}:${progress.walletAddress}`;
        if (!this.firstCompletions.has(completionKey)) {
            multiplier += this.config.firstCompletionBonus;
        }

        // Streak bonus
        if (userStats.currentStreak > 0) {
            const streakBonus = Math.min(
                userStats.currentStreak * this.config.streakMultiplier,
                this.config.maxStreakBonus
            );
            multiplier += streakBonus;
        }

        // Speed bonus
        if (this.config.speedBonus.enabled && progress.startedAt && progress.completedAt) {
            const completionTime =
                (new Date(progress.completedAt).getTime() - new Date(progress.startedAt).getTime()) /
                (1000 * 60);

            if (completionTime <= this.config.speedBonus.thresholdMinutes) {
                multiplier += this.config.speedBonus.bonusPercent;
            }
        }

        const totalPoints = Math.round(basePoints * multiplier + bonusPoints);

        // Build token reward if present
        let tokenReward: RewardCalculation['tokenReward'];
        if (mission.reward.tokenReward) {
            tokenReward = {
                mint: mission.reward.tokenReward.token.mint,
                symbol: mission.reward.tokenReward.token.symbol,
                amount: mission.reward.tokenReward.amount,
            };
        }

        return {
            basePoints,
            multiplier,
            bonusPoints,
            totalPoints,
            tokenReward,
            achievementUnlocked: mission.reward.achievementId,
        };
    }

    /**
     * Record a claimed reward
     */
    recordClaim(walletAddress: string, calculation: RewardCalculation): void {
        if (!this.claimedRewards.has(walletAddress)) {
            this.claimedRewards.set(walletAddress, []);
        }
        this.claimedRewards.get(walletAddress)!.push(calculation);
    }

    /**
     * Mark a mission as first-completed
     */
    markFirstCompletion(missionId: string, walletAddress: string): void {
        this.firstCompletions.add(`${missionId}:${walletAddress}`);
    }

    /**
     * Get total claimed rewards for a user
     */
    getTotalClaimedPoints(walletAddress: string): number {
        const claims = this.claimedRewards.get(walletAddress) || [];
        return claims.reduce((sum, r) => sum + r.totalPoints, 0);
    }

    /**
     * Get all claimed token rewards for a user
     */
    getClaimedTokenRewards(walletAddress: string): Map<string, number> {
        const claims = this.claimedRewards.get(walletAddress) || [];
        const tokens = new Map<string, number>();

        for (const claim of claims) {
            if (claim.tokenReward) {
                const current = tokens.get(claim.tokenReward.mint) || 0;
                tokens.set(claim.tokenReward.mint, current + claim.tokenReward.amount);
            }
        }

        return tokens;
    }

    /**
     * Get claimed achievements for a user
     */
    getUnlockedAchievements(walletAddress: string): string[] {
        const claims = this.claimedRewards.get(walletAddress) || [];
        const achievements = new Set<string>();

        for (const claim of claims) {
            if (claim.achievementUnlocked) {
                achievements.add(claim.achievementUnlocked);
            }
        }

        return Array.from(achievements);
    }

    /**
     * Calculate referral rewards
     */
    calculateReferralReward(
        referrerAddress: string,
        referredAddress: string
    ): { referrerReward: number; referredReward: number } {
        return {
            referrerReward: this.config.referrerBonus,
            referredReward: this.config.referralBonus,
        };
    }

    /**
     * Export reward data
     */
    exportData(): {
        claimedRewards: Record<string, RewardCalculation[]>;
        firstCompletions: string[];
    } {
        const claimedRewards: Record<string, RewardCalculation[]> = {};
        for (const [wallet, rewards] of this.claimedRewards) {
            claimedRewards[wallet] = rewards;
        }

        return {
            claimedRewards,
            firstCompletions: Array.from(this.firstCompletions),
        };
    }

    /**
     * Import reward data
     */
    importData(data: {
        claimedRewards: Record<string, RewardCalculation[]>;
        firstCompletions: string[];
    }): void {
        for (const [wallet, rewards] of Object.entries(data.claimedRewards)) {
            this.claimedRewards.set(wallet, rewards);
        }

        for (const key of data.firstCompletions) {
            this.firstCompletions.add(key);
        }
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.claimedRewards.clear();
        this.firstCompletions.clear();
    }
}

export const rewardCalculator = new RewardCalculator();
