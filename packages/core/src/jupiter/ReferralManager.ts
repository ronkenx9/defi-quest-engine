/**
 * Jupiter Referral Program Integration
 * Enables integrators to earn fees on swaps through the Jupiter Referral Program
 * @see https://dev.jup.ag/tool-kits/referral-program
 */

export interface ReferralConfig {
    /** Your referral account address from https://referral.jup.ag */
    referralAccount: string;
    /** Fee in basis points (100 = 1%). Max is typically 100 bps. */
    feeBps?: number;
    /** Optional fee token mint - defaults to output token */
    feeTokenMint?: string;
}

export interface ReferralStats {
    totalFeesEarnedUsd: number;
    totalSwapsReferred: number;
    totalVolumeUsd: number;
    lastUpdated: Date;
}

/**
 * Referral Manager - Tracks and manages referral fee earnings
 */
export class ReferralManager {
    private config: ReferralConfig | null = null;
    private stats: ReferralStats = {
        totalFeesEarnedUsd: 0,
        totalSwapsReferred: 0,
        totalVolumeUsd: 0,
        lastUpdated: new Date(),
    };

    /**
     * Configure referral settings
     * @param config Referral configuration from Jupiter Referral Dashboard
     */
    configure(config: ReferralConfig): void {
        if (!config.referralAccount) {
            throw new Error('Referral account address is required');
        }
        this.config = {
            ...config,
            feeBps: config.feeBps ?? 50, // Default 0.5%
        };
    }

    /**
     * Get the configured referral account
     */
    getReferralAccount(): string | null {
        return this.config?.referralAccount ?? null;
    }

    /**
     * Get fee basis points
     */
    getFeeBps(): number {
        return this.config?.feeBps ?? 0;
    }

    /**
     * Check if referral is configured
     */
    isConfigured(): boolean {
        return this.config !== null;
    }

    /**
     * Record a referred swap for tracking
     */
    recordSwap(volumeUsd: number, feeUsd: number): void {
        this.stats.totalSwapsReferred++;
        this.stats.totalVolumeUsd += volumeUsd;
        this.stats.totalFeesEarnedUsd += feeUsd;
        this.stats.lastUpdated = new Date();
    }

    /**
     * Get referral statistics
     */
    getStats(): ReferralStats {
        return { ...this.stats };
    }

    /**
     * Get swap parameters with referral fee
     * Use these when calling Jupiter Swap/Ultra API
     */
    getSwapParams(): Record<string, string> {
        if (!this.config) return {};

        return {
            platformFeeBps: String(this.config.feeBps ?? 50),
            feeAccount: this.config.referralAccount,
        };
    }
}

// Singleton instance for easy access
export const referralManager = new ReferralManager();
