/**
 * DeFi Quest Engine - Streak Manager
 * Specialized streak tracking with break detection
 */

import { EventEmitter } from 'eventemitter3';

export interface StreakData {
    walletAddress: string;
    currentStreak: number;
    longestStreak: number;
    lastActivityDate: Date | null;
    streakStartDate: Date | null;
    totalActiveDays: number;
    gracePeriodUsed: boolean;
}

export interface StreakEvents {
    'streak:incremented': { walletAddress: string; streakDays: number };
    'streak:broken': { walletAddress: string; previousStreak: number };
    'streak:milestone': { walletAddress: string; milestone: number };
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export class StreakManager extends EventEmitter<StreakEvents> {
    private streaks: Map<string, StreakData> = new Map();
    private gracePeriodHours: number;

    constructor(gracePeriodHours: number = 0) {
        super();
        this.gracePeriodHours = gracePeriodHours;
    }

    /**
     * Get or create streak data for a wallet
     */
    getStreak(walletAddress: string): StreakData {
        if (!this.streaks.has(walletAddress)) {
            this.streaks.set(walletAddress, {
                walletAddress,
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: null,
                streakStartDate: null,
                totalActiveDays: 0,
                gracePeriodUsed: false,
            });
        }
        return this.streaks.get(walletAddress)!;
    }

    /**
     * Record activity for a wallet
     */
    recordActivity(walletAddress: string, activityDate: Date = new Date()): StreakData {
        const streak = this.getStreak(walletAddress);
        const today = this.normalizeDate(activityDate);

        // First activity ever
        if (!streak.lastActivityDate) {
            streak.currentStreak = 1;
            streak.lastActivityDate = today;
            streak.streakStartDate = today;
            streak.totalActiveDays = 1;
            streak.longestStreak = Math.max(streak.longestStreak, 1);

            this.emit('streak:incremented', { walletAddress, streakDays: 1 });
            return streak;
        }

        const lastActivity = this.normalizeDate(streak.lastActivityDate);
        const daysDiff = this.getDaysDifference(lastActivity, today);

        if (daysDiff === 0) {
            // Same day, no change
            return streak;
        }

        if (daysDiff === 1) {
            // Consecutive day
            streak.currentStreak++;
            streak.lastActivityDate = today;
            streak.totalActiveDays++;
            streak.gracePeriodUsed = false;

            // Update longest streak
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }

            this.emit('streak:incremented', { walletAddress, streakDays: streak.currentStreak });

            // Check milestones
            if (STREAK_MILESTONES.includes(streak.currentStreak)) {
                this.emit('streak:milestone', { walletAddress, milestone: streak.currentStreak });
            }

            return streak;
        }

        // Check grace period
        const hoursDiff = this.getHoursDifference(lastActivity, today);
        const withinGracePeriod = hoursDiff <= 24 + this.gracePeriodHours && !streak.gracePeriodUsed;

        if (withinGracePeriod && daysDiff <= 2) {
            // Within grace period
            streak.currentStreak++;
            streak.lastActivityDate = today;
            streak.totalActiveDays++;
            streak.gracePeriodUsed = true;

            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }

            this.emit('streak:incremented', { walletAddress, streakDays: streak.currentStreak });
            return streak;
        }

        // Streak broken
        const previousStreak = streak.currentStreak;
        this.emit('streak:broken', { walletAddress, previousStreak });

        // Reset streak
        streak.currentStreak = 1;
        streak.lastActivityDate = today;
        streak.streakStartDate = today;
        streak.totalActiveDays++;
        streak.gracePeriodUsed = false;

        return streak;
    }

    /**
     * Check if streak is at risk (no activity today)
     */
    isStreakAtRisk(walletAddress: string): boolean {
        const streak = this.getStreak(walletAddress);
        if (!streak.lastActivityDate || streak.currentStreak === 0) {
            return false;
        }

        const today = this.normalizeDate(new Date());
        const lastActivity = this.normalizeDate(streak.lastActivityDate);
        const daysDiff = this.getDaysDifference(lastActivity, today);

        return daysDiff >= 1;
    }

    /**
     * Get time remaining before streak breaks
     */
    getTimeUntilStreakBreaks(walletAddress: string): number | null {
        const streak = this.getStreak(walletAddress);
        if (!streak.lastActivityDate || streak.currentStreak === 0) {
            return null;
        }

        const now = new Date();
        const lastActivity = new Date(streak.lastActivityDate);

        // End of the next day + grace period
        const breakTime = new Date(lastActivity);
        breakTime.setDate(breakTime.getDate() + 1);
        breakTime.setHours(23, 59, 59, 999);
        breakTime.setTime(breakTime.getTime() + this.gracePeriodHours * 60 * 60 * 1000);

        const remaining = breakTime.getTime() - now.getTime();
        return Math.max(0, remaining);
    }

    /**
     * Get all streaks sorted by length
     */
    getLeaderboard(limit: number = 10): StreakData[] {
        return Array.from(this.streaks.values())
            .sort((a, b) => b.currentStreak - a.currentStreak)
            .slice(0, limit);
    }

    /**
     * Process all streaks to check for breaks
     */
    processStreakBreaks(): string[] {
        const brokenStreaks: string[] = [];
        const today = this.normalizeDate(new Date());

        for (const [walletAddress, streak] of this.streaks) {
            if (!streak.lastActivityDate || streak.currentStreak === 0) continue;

            const lastActivity = this.normalizeDate(streak.lastActivityDate);
            const daysDiff = this.getDaysDifference(lastActivity, today);
            const hoursDiff = this.getHoursDifference(lastActivity, new Date());

            // Check if grace period has expired
            const gracePeriodExpired = hoursDiff > 24 + this.gracePeriodHours;

            if (daysDiff >= 2 || (daysDiff >= 1 && gracePeriodExpired)) {
                const previousStreak = streak.currentStreak;
                streak.currentStreak = 0;
                streak.streakStartDate = null;
                streak.gracePeriodUsed = false;

                this.emit('streak:broken', { walletAddress, previousStreak });
                brokenStreaks.push(walletAddress);
            }
        }

        return brokenStreaks;
    }

    /**
     * Helper: Normalize date to midnight
     */
    private normalizeDate(date: Date): Date {
        const normalized = new Date(date);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    }

    /**
     * Helper: Get difference in days between two dates
     */
    private getDaysDifference(a: Date, b: Date): number {
        const normalizedA = this.normalizeDate(a);
        const normalizedB = this.normalizeDate(b);
        return Math.floor((normalizedB.getTime() - normalizedA.getTime()) / (1000 * 60 * 60 * 24));
    }

    /**
     * Helper: Get difference in hours between two dates
     */
    private getHoursDifference(a: Date, b: Date): number {
        return (b.getTime() - a.getTime()) / (1000 * 60 * 60);
    }

    /**
     * Export streak data
     */
    exportData(): StreakData[] {
        return Array.from(this.streaks.values());
    }

    /**
     * Import streak data
     */
    importData(data: StreakData[]): void {
        for (const streak of data) {
            this.streaks.set(streak.walletAddress, {
                ...streak,
                lastActivityDate: streak.lastActivityDate ? new Date(streak.lastActivityDate) : null,
                streakStartDate: streak.streakStartDate ? new Date(streak.streakStartDate) : null,
            });
        }
    }

    /**
     * Clear all streak data
     */
    clear(): void {
        this.streaks.clear();
    }
}

export const streakManager = new StreakManager(6); // 6 hour grace period
