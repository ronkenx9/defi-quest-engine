/**
 * DeFi Quest Engine - Progress Tracker
 * Handles progress persistence and aggregation
 */

import { MissionProgress, MissionStatus, UserStats } from '../missions/MissionTypes';

export interface ProgressSnapshot {
    walletAddress: string;
    missionId: string;
    progress: MissionProgress;
    timestamp: Date;
}

export class ProgressTracker {
    private progressHistory: Map<string, ProgressSnapshot[]> = new Map();

    /**
     * Get history key for wallet + mission
     */
    private getKey(walletAddress: string, missionId: string): string {
        return `${walletAddress}:${missionId}`;
    }

    /**
     * Record a progress snapshot
     */
    recordProgress(walletAddress: string, missionId: string, progress: MissionProgress): void {
        const key = this.getKey(walletAddress, missionId);

        if (!this.progressHistory.has(key)) {
            this.progressHistory.set(key, []);
        }

        const history = this.progressHistory.get(key)!;

        // Limit history size
        if (history.length >= 100) {
            history.shift();
        }

        history.push({
            walletAddress,
            missionId,
            progress: { ...progress },
            timestamp: new Date(),
        });
    }

    /**
     * Get progress history for a mission
     */
    getProgressHistory(walletAddress: string, missionId: string): ProgressSnapshot[] {
        const key = this.getKey(walletAddress, missionId);
        return this.progressHistory.get(key) || [];
    }

    /**
     * Calculate completion rate for a mission across all users
     */
    getMissionCompletionRate(missionId: string): number {
        let started = 0;
        let completed = 0;

        for (const history of this.progressHistory.values()) {
            const latest = history[history.length - 1];
            if (latest && latest.missionId === missionId) {
                started++;
                if (
                    latest.progress.status === MissionStatus.COMPLETED ||
                    latest.progress.status === MissionStatus.CLAIMED
                ) {
                    completed++;
                }
            }
        }

        return started > 0 ? (completed / started) * 100 : 0;
    }

    /**
     * Get average completion time for a mission
     */
    getAverageCompletionTime(missionId: string): number {
        const completionTimes: number[] = [];

        for (const history of this.progressHistory.values()) {
            const latest = history[history.length - 1];
            if (
                latest &&
                latest.missionId === missionId &&
                latest.progress.completedAt &&
                latest.progress.startedAt
            ) {
                const time =
                    new Date(latest.progress.completedAt).getTime() -
                    new Date(latest.progress.startedAt).getTime();
                completionTimes.push(time);
            }
        }

        if (completionTimes.length === 0) return 0;
        return completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
    }

    /**
     * Get activity metrics for a time period
     */
    getActivityMetrics(startDate: Date, endDate: Date): {
        totalSnapshots: number;
        uniqueUsers: Set<string>;
        uniqueMissions: Set<string>;
        completions: number;
    } {
        const metrics = {
            totalSnapshots: 0,
            uniqueUsers: new Set<string>(),
            uniqueMissions: new Set<string>(),
            completions: 0,
        };

        for (const history of this.progressHistory.values()) {
            for (const snapshot of history) {
                if (snapshot.timestamp >= startDate && snapshot.timestamp <= endDate) {
                    metrics.totalSnapshots++;
                    metrics.uniqueUsers.add(snapshot.walletAddress);
                    metrics.uniqueMissions.add(snapshot.missionId);

                    if (
                        snapshot.progress.status === MissionStatus.COMPLETED ||
                        snapshot.progress.status === MissionStatus.CLAIMED
                    ) {
                        metrics.completions++;
                    }
                }
            }
        }

        return metrics;
    }

    /**
     * Clear old history entries
     */
    pruneHistory(olderThan: Date): number {
        let pruned = 0;

        for (const [key, history] of this.progressHistory) {
            const filtered = history.filter((s) => s.timestamp >= olderThan);
            pruned += history.length - filtered.length;

            if (filtered.length === 0) {
                this.progressHistory.delete(key);
            } else {
                this.progressHistory.set(key, filtered);
            }
        }

        return pruned;
    }

    /**
     * Export all history data
     */
    exportHistory(): ProgressSnapshot[] {
        const all: ProgressSnapshot[] = [];
        for (const history of this.progressHistory.values()) {
            all.push(...history);
        }
        return all.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }

    /**
     * Import history data
     */
    importHistory(snapshots: ProgressSnapshot[]): void {
        for (const snapshot of snapshots) {
            this.recordProgress(snapshot.walletAddress, snapshot.missionId, snapshot.progress);
        }
    }

    /**
     * Clear all history
     */
    clear(): void {
        this.progressHistory.clear();
    }
}

export const progressTracker = new ProgressTracker();
